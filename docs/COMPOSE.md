# Docker Compose

The root `compose.yaml` provides a portable baseline for the retained portal, API, and PostgreSQL architecture. Migrations run once in the `migrate` service before the API starts.

## Default Stack

Review and replace the placeholder database password and JWT secret before any shared or production deployment. For local evaluation:

```bash
docker compose up --build
```

The portal is available at <http://localhost:3006> and the API health endpoint at <http://localhost:3001/health>. PostgreSQL is exposed on port 5432 for local tools. Data persists in the `postgres-data` named volume.

The default graph does not start or require MLS, Redis, Typesense, MinIO, cloud credentials, or Agent HQ. `AGENT_API_ENABLED` and bootstrap-admin creation remain disabled in Compose.

## Optional Profiles

Profiles may be combined. Starting an infrastructure profile does not automatically opt the API or worker into that dependency; supply the matching settings explicitly.

```bash
# Redis-backed cache
REDIS_ENABLED=true REDIS_HOST=redis docker compose --profile cache up --build

# Typesense search
TYPESENSE_HOST=typesense TYPESENSE_API_KEY=replace-with-a-typesense-key \
  docker compose --profile search up --build

# S3-compatible local object storage (console: http://localhost:9001)
docker compose --profile storage up --build

# Included MLS worker; it remains idle unless MLS_AUTH_TYPE is configured.
docker compose --profile mls up --build
```

For MinIO-backed application storage, set `STORAGE_ENDPOINT=http://minio:9000`, a bucket, and matching MinIO/application credentials. Bucket provisioning is intentionally operator-controlled. For an active MLS sync, also provide the vendor settings documented in [MLS_BOARD_SETUP.md](./MLS_BOARD_SETUP.md) and set `MLS_SYNC_ENABLED=true` only after compliance review.

Use an external secret manager or an untracked environment file for real credentials. Every committed value is blank, local-only, or an explicit replacement placeholder.

## Operations

```bash
docker compose config                       # validate interpolation and service graph
docker compose run --rm migrate             # re-run pending migrations explicitly
docker compose down                         # stop containers; retain named volumes
docker compose down --volumes               # also remove local persisted data
```

The API's normal `npm start` no longer runs migrations. Deployments outside Compose must run `npm run db:migrate` as a separate release step.
