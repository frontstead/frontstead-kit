variable "aws_region" {
  description = "AWS region for every resource."
  type        = string
}

variable "name" {
  description = "Prefix for resource names. deploy.sh reads the same value from FRONTSTEAD_NAME."
  type        = string
  default     = "frontstead"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.name))
    error_message = "name must be 2-21 lowercase letters, digits, or hyphens."
  }
}

variable "domain_name" {
  description = "Public hostname of the portal, e.g. homes.example.com."
  type        = string
}

variable "route53_zone_id" {
  description = "Hosted zone that holds domain_name; used for the ACM validation and alias records."
  type        = string
}

variable "email_from" {
  description = "From address for outgoing email (EMAIL_FROM), on a domain verified with Resend."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.40.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS storage in GiB."
  type        = number
  default     = 20
}

variable "db_deletion_protection" {
  description = "Block deleting the database. Turn off deliberately before a teardown."
  type        = bool
  default     = true
}

variable "task_size" {
  description = "Fargate CPU units and memory (MiB) per service."
  type = map(object({
    cpu    = number
    memory = number
  }))
  default = {
    portal = { cpu = 512, memory = 1024 }
    api    = { cpu = 512, memory = 1024 }
    mls    = { cpu = 512, memory = 1024 }
    job    = { cpu = 256, memory = 512 } # migrate and cron tasks
  }
}

variable "mls_enabled" {
  description = "Run the MLS worker (one task). Keep false until MLS board approval; see docs/MLS_COMPLIANCE.md."
  type        = bool
  default     = false
}

variable "mls_public_display_enabled" {
  description = "MLS_PUBLIC_DISPLAY_ENABLED, applied to the API and the MLS worker together so they cannot drift."
  type        = bool
  default     = false
}

variable "mls_environment" {
  description = "Non-secret MLS settings (MLS_AUTH_TYPE, MLS_BASE_URL, MLS_BOARD_ID, MLS_PREFIX, ...), given to the API and the MLS worker. Credentials go in the operator secret instead."
  type        = map(string)
  default     = {}

  validation {
    condition = length(setintersection(keys(var.mls_environment), [
      "MLS_PUBLIC_DISPLAY_ENABLED", "MLS_ACCESS_TOKEN", "MLS_OAUTH_CLIENT_SECRET", "DATABASE_URL", "CONFIRM_DEMO_SEED",
    ])) == 0
    error_message = "Set MLS_PUBLIC_DISPLAY_ENABLED with mls_public_display_enabled and MLS credentials in the operator secret; CONFIRM_DEMO_SEED is never allowed."
  }
}

variable "api_environment" {
  description = "Extra non-secret API environment variables (e.g. GOOGLE_WEB_CLIENT_ID)."
  type        = map(string)
  default     = {}

  validation {
    condition = length(setintersection(keys(var.api_environment), [
      "AGENT_API_ENABLED", "CONFIRM_DEMO_SEED", "NODE_ENV", "MLS_PUBLIC_DISPLAY_ENABLED", "BOOTSTRAP_ADMIN_ENABLED",
    ])) == 0
    error_message = "AGENT_API_ENABLED, CONFIRM_DEMO_SEED, NODE_ENV, MLS_PUBLIC_DISPLAY_ENABLED, and BOOTSTRAP_ADMIN_ENABLED are fixed by this stack."
  }
}

variable "cron_jobs" {
  description = "Map of /api/cron/<job> name to EventBridge Scheduler expression. Each run is a one-off Fargate task."
  type        = map(string)
  default = {
    "inquiry-deliveries"  = "rate(5 minutes)"
    "saved-search-alerts" = "cron(0 13 * * ? *)"
  }

  validation {
    condition     = alltrue([for job in keys(var.cron_jobs) : can(regex("^[a-z0-9-]+$", job))])
    error_message = "Job names must match the /api/cron/<job> route: lowercase letters, digits, hyphens."
  }
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention."
  type        = number
  default     = 30
}
