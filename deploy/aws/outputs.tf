output "portal_url" {
  value = "https://${var.domain_name}"
}

output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecr_repositories" {
  value = { for k, repo in aws_ecr_repository.app : k => repo.repository_url }
}

output "operator_secret_name" {
  description = "Set RESEND_API_KEY and MLS credentials here; see README.md."
  value       = aws_secretsmanager_secret.operator.name
}

output "media_bucket" {
  value = aws_s3_bucket.media.bucket
}

output "db_endpoint" {
  value = aws_db_instance.main.address
}
