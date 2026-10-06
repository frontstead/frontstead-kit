# AWS ECS Fargate Deployment

`deploy/aws/` is a single Terraform root configuration plus a release script that
runs the default stack on ECS Fargate in one AWS account. It is deliberately flat
— no reusable module — and targets a single operator. For the portable baseline,
see [Docker Compose](./COMPOSE.md); for Railway, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## What It Creates

```text
Route53 ─► ALB (HTTPS, ACM) ─► portal service ──Service Connect "api:3001"──► api service
                                                                                 │
                        mls service (0 or 1 task) ─────────────────────────────►├─► RDS PostgreSQL 17 (TLS)
                        migrate task (run by deploy.sh) ───────────────────────►│
                        cron tasks (EventBridge Scheduler) ────────────────────►┘
api, mls ─► S3 media bucket (public-read objects)     secrets ─► Secrets Manager     logs ─► CloudWatch
```

- **Networking.** A VPC across two AZs. Fargate tasks run in public subnets with
  public IPs, so there is no NAT gateway; security groups admit only ALB → portal,
  portal → API, and API/worker tasks → PostgreSQL. RDS sits in private subnets.
- **The API is private.** The portal reaches it at `http://api:3001` through ECS
  Service Connect — the same name the portal image bakes in as its default
  `NEXT_PUBLIC_API_URL`, so one portal image serves every environment. The browser
  only ever talks to the portal (see [ARCHITECTURE.md](./ARCHITECTURE.md)). Expose
  the API separately only if an external Agent API client needs it.
- **Images** are ARM64 (Graviton) and tagged with the git SHA in ECR.
- **Scheduled jobs.** Each entry in the `cron_jobs` variable is an EventBridge
  Scheduler schedule that starts a one-off task running
  `apps/api/scripts/run-cron.ts <job>`. The script mounts the API's own Express app
  on a loopback port and calls `/api/cron/<job>`, so scheduled runs execute exactly
  the code and `CRON_SECRET` check the HTTP endpoint uses. The defaults are
  `inquiry-deliveries` every five minutes (the inquiry email outbox) and
  `saved-search-alerts` daily.
- **The MLS worker** runs as at most one task and never overlaps itself during a
  deploy (`minimum_healthy_percent = 0`), because it schedules syncs in-process.

Redis and Typesense are not provisioned; search uses PostgreSQL. Email goes through
Resend.

## Safety Rails

The stack fixes `AGENT_API_ENABLED=false`, `BOOTSTRAP_ADMIN_ENABLED=false`, and
`NODE_ENV=production`, and variable validation rejects attempts to override them or to
set `CONFIRM_DEMO_SEED`. `mls_public_display_enabled` is a single variable applied to the
API and the worker together. Keep `mls_enabled` and `mls_public_display_enabled` false
until board approval; see [MLS_COMPLIANCE.md](./MLS_COMPLIANCE.md) and
[MLS_BOARD_SETUP.md](./MLS_BOARD_SETUP.md).

## Prerequisites

- Terraform 1.6+, AWS CLI v2, Docker with buildx, `jq`.
- A Route53 hosted zone for the portal's domain.
- An S3 bucket for Terraform state. The state contains the database password and the
  generated application secrets, so keep the bucket private, versioned, and encrypted.
- A Resend account with the sending domain verified.

## First Deployment

```bash
cd deploy/aws
cp backend.hcl.example backend.hcl            # gitignored
cp terraform.tfvars.example terraform.tfvars  # gitignored
terraform init -backend-config=backend.hcl
terraform apply
```

The services cannot start yet — no image exists — and that is expected. Set the
operator-managed secrets (every key must stay present; an empty string means "not
configured"):

```bash
cat > /tmp/operator.json <<'JSON'
{ "RESEND_API_KEY": "re_...", "MLS_ACCESS_TOKEN": "", "MLS_OAUTH_CLIENT_SECRET": "" }
JSON
aws secretsmanager put-secret-value --secret-id frontstead/operator --secret-string file:///tmp/operator.json
rm /tmp/operator.json
```

Then release:

```bash
AWS_REGION=us-east-1 deploy/aws/deploy.sh
```

Once it reports `Deployed <sha>`, check `https://<domain>/healthz`.

## Releasing

`deploy/aws/deploy.sh` deploys the current commit:

1. Builds and pushes the API, portal, and MLS images (skipped when the tag exists).
2. Registers a new revision of every task definition with the new tag.
3. Runs the migrate task (`prisma migrate deploy`) and stops unless it exits 0.
4. Points the services at the new revisions and records the tag in the
   `/<name>/image-tag` SSM parameter.
5. Waits for the services to stabilize. A deployment whose tasks fail health checks
   rolls back automatically (ECS deployment circuit breaker).

Terraform reads the SSM parameter when it renders task definitions and ignores which
revision a service runs, so `terraform apply` after a release never reverts it.

To roll back, redeploy an earlier SHA that is still in ECR:
`AWS_REGION=us-east-1 deploy/aws/deploy.sh <sha>`. Migrations are forward-only, so
roll back only to a commit compatible with the current schema.

## Database TLS

RDS enforces TLS (`rds.force_ssl`). The API and MLS images contain the Amazon RDS CA
bundle at `/etc/ssl/certs/rds-global-bundle.pem`, and the generated secret holds two
connection strings because the two PostgreSQL clients spell verification differently:

| Key | Used by | TLS parameters |
| --- | --- | --- |
| `DATABASE_URL` | API, MLS worker, cron (node-pg via `PrismaPg`) | `sslmode=verify-full&sslrootcert=<bundle>` |
| `MIGRATE_DATABASE_URL` | migrate task (Prisma's schema engine) | `sslmode=require&sslcert=<bundle>&sslaccept=strict` |

node-pg would read Prisma's `sslcert` as a client certificate, so do not merge them.
If AWS rotates the bundle, update the checksum in both Dockerfiles.

## Operating

- **Logs**: CloudWatch log groups `/ecs/<name>/{portal,api,mls,migrate,cron}`.
- **Shell into a task**: `aws ecs execute-command --cluster <name> --task <id> --container api --interactive --command sh`.
- **Run a job now**: start the `<name>-cron-<job>` task definition with `aws ecs run-task`,
  using the MLS service's network configuration.
- **Database access from a workstation**: there is none by design (RDS is private);
  run one-off commands inside an API task with `execute-command`.
- **Teardown**: set `db_deletion_protection = false`, apply, then `terraform destroy`.
  RDS takes a final snapshot.
