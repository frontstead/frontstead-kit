# ─── Images ────────────────────────────────────────────────────────────────────
# deploy.sh pushes <repo>:<git sha> and records the tag in the SSM parameter
# below. Terraform reads that parameter when rendering task definitions, so an
# apply after a deploy re-renders the deployed image rather than rolling back.

resource "aws_ecr_repository" "app" {
  for_each             = toset(["api", "portal", "mls"])
  name                 = "${var.name}-${each.key}"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  for_each   = aws_ecr_repository.app
  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the 30 most recent images"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 30 }
      action       = { type = "expire" }
    }]
  })
}

resource "aws_ssm_parameter" "image_tag" {
  name  = "/${var.name}/image-tag"
  type  = "String"
  value = "bootstrap" # until the first deploy.sh run; services can't start before then

  lifecycle {
    ignore_changes = [value]
  }
}

# ─── Cluster ───────────────────────────────────────────────────────────────────

resource "aws_ecs_cluster" "main" {
  name = var.name
}

# Service Connect gives the API the in-cluster name `api`, which is exactly the
# portal image's build-time default NEXT_PUBLIC_API_URL (http://api:3001).
resource "aws_service_discovery_http_namespace" "main" {
  name = "${var.name}.internal"
}

resource "aws_cloudwatch_log_group" "app" {
  for_each          = toset(["portal", "api", "mls", "migrate", "cron"])
  name              = "/ecs/${var.name}/${each.key}"
  retention_in_days = var.log_retention_days
}

# ─── Task definitions ──────────────────────────────────────────────────────────

locals {
  image_tag = aws_ssm_parameter.image_tag.value
  image     = { for k, repo in aws_ecr_repository.app : k => "${repo.repository_url}:${local.image_tag}" }

  portal_url = "https://${var.domain_name}"

  generated = aws_secretsmanager_secret.generated.arn
  operator  = aws_secretsmanager_secret.operator.arn

  storage_env = {
    STORAGE_BUCKET          = aws_s3_bucket.media.bucket
    STORAGE_REGION          = var.aws_region
    STORAGE_PUBLIC_BASE_URL = "https://${aws_s3_bucket.media.bucket_regional_domain_name}"
  }

  # Shared by the API service and the cron tasks (same image, same code paths).
  api_env = merge(var.mls_environment, var.api_environment, local.storage_env, {
    NODE_ENV                   = "production"
    LOG_LEVEL                  = "info"
    API_PORT                   = "3001"
    FRONTEND_URL               = local.portal_url
    ALLOWED_ORIGINS            = local.portal_url
    EMAIL_FROM                 = var.email_from
    JWT_EXPIRES_IN             = "7d"
    REDIS_ENABLED              = "false"
    AGENT_API_ENABLED          = "false"
    BOOTSTRAP_ADMIN_ENABLED    = "false"
    MLS_PUBLIC_DISPLAY_ENABLED = tostring(var.mls_public_display_enabled)
  })

  api_secrets = {
    DATABASE_URL             = "${local.generated}:DATABASE_URL::"
    JWT_SECRET               = "${local.generated}:JWT_SECRET::"
    CRON_SECRET              = "${local.generated}:CRON_SECRET::"
    ADMIN_SECRET             = "${local.generated}:ADMIN_SECRET::"
    EMAIL_UNSUBSCRIBE_SECRET = "${local.generated}:EMAIL_UNSUBSCRIBE_SECRET::"
    RESEND_API_KEY           = "${local.operator}:RESEND_API_KEY::"
  }

  mls_env = merge(var.mls_environment, local.storage_env, {
    NODE_ENV                   = "production"
    LOG_LEVEL                  = "info"
    MLS_PUBLIC_DISPLAY_ENABLED = tostring(var.mls_public_display_enabled)
  })

  mls_secrets = {
    DATABASE_URL            = "${local.generated}:DATABASE_URL::"
    MLS_ACCESS_TOKEN        = "${local.operator}:MLS_ACCESS_TOKEN::"
    MLS_OAUTH_CLIENT_SECRET = "${local.operator}:MLS_OAUTH_CLIENT_SECRET::"
  }

  portal_env = {
    NODE_ENV             = "production"
    PORT                 = "3006"
    HOSTNAME             = "0.0.0.0"
    API_INTERNAL_URL     = "http://api:3001"
    FRONTEND_URL         = local.portal_url
    NEXT_PUBLIC_SITE_URL = local.portal_url
  }
}

locals {
  # Renders one container definition; keeps the per-service blocks short.
  container = {
    for k, c in {
      portal = {
        image  = local.image.portal, env = local.portal_env, secrets = {}, port = 3006, log = "portal"
        health = "fetch('http://127.0.0.1:3006/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
      }
      api = {
        image  = local.image.api, env = local.api_env, secrets = local.api_secrets, port = 3001, log = "api"
        health = "fetch('http://127.0.0.1:3001/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
      }
      mls = {
        image = local.image.mls, env = local.mls_env, secrets = local.mls_secrets, port = null, log = "mls", health = null
      }
      } : k => merge(
      {
        name        = k
        image       = c.image
        essential   = true
        stopTimeout = 30
        environment = [for name, value in c.env : { name = name, value = value }]
        secrets     = [for name, from in c.secrets : { name = name, valueFrom = from }]
        linuxParameters = {
          initProcessEnabled = true
        }
        logConfiguration = {
          logDriver = "awslogs"
          options = {
            awslogs-group         = aws_cloudwatch_log_group.app[c.log].name
            awslogs-region        = var.aws_region
            awslogs-stream-prefix = k
          }
        }
      },
      c.port == null ? {} : {
        portMappings = [{ name = k, containerPort = c.port, protocol = "tcp", appProtocol = "http" }]
      },
      c.health == null ? {} : {
        healthCheck = { command = ["CMD", "node", "-e", c.health], interval = 15, timeout = 5, retries = 3, startPeriod = 30 }
      },
    )
  }
}

resource "aws_ecs_task_definition" "service" {
  for_each                 = local.container
  family                   = "${var.name}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_size[each.key].cpu
  memory                   = var.task_size[each.key].memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task[each.key].arn
  container_definitions    = jsonencode([each.value])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }
}

# One-off: `prisma migrate deploy`, run by deploy.sh before services roll.
resource "aws_ecs_task_definition" "migrate" {
  family                   = "${var.name}-migrate"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_size.job.cpu
  memory                   = var.task_size.job.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task["job"].arn

  container_definitions = jsonencode([{
    name             = "migrate"
    image            = local.image.api
    essential        = true
    workingDirectory = "/app"
    command          = ["npm", "run", "db:migrate", "--workspace=db"]
    environment      = [{ name = "NODE_ENV", value = "production" }]
    secrets          = [{ name = "DATABASE_URL", valueFrom = "${local.generated}:MIGRATE_DATABASE_URL::" }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app["migrate"].name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "migrate"
      }
    }
  }])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }
}

# One task definition per scheduled /api/cron/<job>; see apps/api/scripts/run-cron.ts.
resource "aws_ecs_task_definition" "cron" {
  for_each                 = var.cron_jobs
  family                   = "${var.name}-cron-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_size.job.cpu
  memory                   = var.task_size.job.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task["job"].arn

  container_definitions = jsonencode([{
    name        = "cron"
    image       = local.image.api
    essential   = true
    command     = ["node", "--import", "tsx", "scripts/run-cron.ts", each.key]
    environment = [for name, value in local.api_env : { name = name, value = value }]
    secrets     = [for name, from in local.api_secrets : { name = name, valueFrom = from }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app["cron"].name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = each.key
      }
    }
  }])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }
}

# ─── Services ──────────────────────────────────────────────────────────────────
# deploy.sh owns the task definition revision a service runs, so Terraform
# ignores it after creation.

resource "aws_ecs_service" "portal" {
  name                   = "portal"
  cluster                = aws_ecs_cluster.main.id
  task_definition        = aws_ecs_task_definition.service["portal"].arn
  desired_count          = 1
  launch_type            = "FARGATE"
  enable_execute_command = true

  health_check_grace_period_seconds = 60

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.portal.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.portal.arn
    container_name   = "portal"
    container_port   = 3006
  }

  # Client only: lets the portal resolve http://api:3001.
  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.main.arn
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.https]

  lifecycle {
    ignore_changes = [task_definition]
  }
}

resource "aws_ecs_service" "api" {
  name                   = "api"
  cluster                = aws_ecs_cluster.main.id
  task_definition        = aws_ecs_task_definition.service["api"].arn
  desired_count          = 1
  launch_type            = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.api.id]
    assign_public_ip = true
  }

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.main.arn

    service {
      port_name      = "api"
      discovery_name = "api"

      client_alias {
        dns_name = "api"
        port     = 3001
      }
    }
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}

# Exactly one task, and never two at once: the worker schedules its syncs with
# node-cron in-process, so overlapping tasks during a deploy would double-sync.
resource "aws_ecs_service" "mls" {
  name                   = "mls"
  cluster                = aws_ecs_cluster.main.id
  task_definition        = aws_ecs_task_definition.service["mls"].arn
  desired_count          = var.mls_enabled ? 1 : 0
  launch_type            = "FARGATE"
  enable_execute_command = true

  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.worker.id]
    assign_public_ip = true
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}

# ─── Scheduled jobs ────────────────────────────────────────────────────────────
# The target names the task definition family without a revision, so each run
# picks up the latest revision deploy.sh registered.

resource "aws_scheduler_schedule" "cron" {
  for_each            = var.cron_jobs
  name                = "${var.name}-${each.key}"
  schedule_expression = each.value

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_ecs_cluster.main.arn
    role_arn = aws_iam_role.scheduler.arn

    ecs_parameters {
      task_definition_arn = aws_ecs_task_definition.cron[each.key].arn_without_revision
      launch_type         = "FARGATE"

      network_configuration {
        subnets          = aws_subnet.public[*].id
        security_groups  = [aws_security_group.worker.id]
        assign_public_ip = true
      }
    }

    retry_policy {
      maximum_retry_attempts = 0
    }
  }
}
