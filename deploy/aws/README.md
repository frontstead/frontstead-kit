# deploy/aws

Terraform root configuration and release script for running Frontstead Kit on AWS
ECS Fargate. The full guide — architecture, first deployment, releases, TLS, and
operations — is [docs/AWS_ECS.md](../../docs/AWS_ECS.md).

| File | Purpose |
| --- | --- |
| `network.tf` | VPC, subnets, security groups |
| `alb.tf` | ACM certificate, load balancer, DNS record |
| `data.tf` | RDS PostgreSQL, S3 media bucket, Secrets Manager |
| `iam.tf` | Execution, task, and scheduler roles |
| `ecs.tf` | ECR, cluster, task definitions, services, scheduled jobs |
| `deploy.sh` | Build, push, migrate, and roll the services |

`terraform.tfvars` and `backend.hcl` are gitignored; start from the `.example` files.
