# ─── PostgreSQL ────────────────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = var.name
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.name}-pg17"
  family = "postgres17"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

# No special characters, so the password can sit in a URL without encoding.
resource "random_password" "db" {
  length  = 40
  special = false
}

resource "aws_db_instance" "main" {
  identifier     = var.name
  engine         = "postgres"
  engine_version = "17"

  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 5
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "frontstead"
  username = "frontstead"
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false

  backup_retention_period    = 7
  auto_minor_version_upgrade = true
  deletion_protection        = var.db_deletion_protection
  skip_final_snapshot        = false
  final_snapshot_identifier  = "${var.name}-final"
}

# ─── Media bucket ──────────────────────────────────────────────────────────────
# Portal logos and MLS photos. Objects are public-read (they're shown on the
# public portal); writes need the API/MLS task roles. The browser uploads logos
# straight to S3 with a presigned PUT, hence the CORS rule.

resource "aws_s3_bucket" "media" {
  bucket = "${var.name}-media-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_ownership_controls" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "media_public_read" {
  bucket     = aws_s3_bucket.media.id
  depends_on = [aws_s3_bucket_public_access_block.media]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicRead"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.media.arn}/*"
    }]
  })
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = ["https://${var.domain_name}"]
    allowed_headers = ["Content-Type"]
    max_age_seconds = 3000
  }
}

# ─── Secrets ───────────────────────────────────────────────────────────────────

resource "random_password" "app" {
  for_each = toset(["JWT_SECRET", "CRON_SECRET", "ADMIN_SECRET", "EMAIL_UNSUBSCRIBE_SECRET"])
  length   = 64
  special  = false
}

locals {
  db_base_url = format(
    "%s://%s:%s@%s:%d/%s?schema=public",
    "postgresql",
    aws_db_instance.main.username,
    random_password.db.result,
    aws_db_instance.main.address,
    aws_db_instance.main.port,
    aws_db_instance.main.db_name,
  )
  rds_ca_path = "/etc/ssl/certs/rds-global-bundle.pem" # baked into the API and MLS images
}

# Values Terraform generates. Two database URLs because the two clients spell
# certificate verification differently: node-pg (the app, via PrismaPg) reads
# sslrootcert, while Prisma's migrate engine reads sslcert + sslaccept — and
# node-pg would misread sslcert as a client certificate.
resource "aws_secretsmanager_secret" "generated" {
  name = "${var.name}/generated"
}

resource "aws_secretsmanager_secret_version" "generated" {
  secret_id = aws_secretsmanager_secret.generated.id
  secret_string = jsonencode(merge(
    { for k, v in random_password.app : k => v.result },
    {
      DATABASE_URL         = "${local.db_base_url}&sslmode=verify-full&sslrootcert=${local.rds_ca_path}"
      MIGRATE_DATABASE_URL = "${local.db_base_url}&sslmode=require&sslcert=${local.rds_ca_path}&sslaccept=strict"
    },
  ))
}

# Values the operator sets by hand after the first apply, so third-party
# credentials never pass through tfvars or state:
#   aws secretsmanager put-secret-value --secret-id <name>/operator --secret-string file://operator.json
# Every key below must stay present (an empty string means "not configured");
# ECS refuses to start a task whose referenced JSON key is missing.
resource "aws_secretsmanager_secret" "operator" {
  name = "${var.name}/operator"
}

resource "aws_secretsmanager_secret_version" "operator" {
  secret_id = aws_secretsmanager_secret.operator.id
  secret_string = jsonencode({
    RESEND_API_KEY          = ""
    MLS_ACCESS_TOKEN        = ""
    MLS_OAUTH_CLIENT_SECRET = ""
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
