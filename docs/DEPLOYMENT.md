# Railway Deployment

This document describes service-by-service Railway deployment. For the canonical portable baseline, use [Docker Compose](./COMPOSE.md).

## Required Services

| Service | Source | Required |
| --- | --- | --- |
| Portal | `apps/portal` | Yes |
| API | `apps/api` | Yes |
| PostgreSQL | Railway PostgreSQL | Yes |
| MLS worker | `apps/mls-service` | Included; deploy when MLS sync is configured |
| Redis | External or Railway service | No |
| Typesense | External or Railway service | No |

Commercial and client-specific frontends are maintained separately and are not required for a public portal deployment.

## API Service

Create a service from the repository root.

```text
Build command: npm install && npm run build:api
Start command: npm run start:api
```

Do not use root `npm run build` for the API service; it builds every buildable workspace. The API start command applies existing Prisma migrations before starting.

Minimum variables:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
API_PORT=${{PORT}}
NODE_ENV=production
JWT_SECRET=${{JWT_SECRET}}
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://portal.example.com
ALLOWED_ORIGINS=https://portal.example.com
AGENT_API_ENABLED=false
LOG_LEVEL=info
```

Generate a unique `JWT_SECRET` in a secret manager or secure local shell. Do not commit its value.

## Portal Service

Create a second service from the repository root.

```text
Build command: npm install && npm run build --workspace=portal
Start command: npm run start:portal
```

Variables:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_NAME="Example Realty"
```

Point the public domain directly to the root of `apps/portal`. No legacy frontend or marketing service is required.

## PostgreSQL And Migrations

Attach Railway PostgreSQL to the API and MLS worker. The API uses the internal service URL inside Railway. `npm run start:api` applies migrations; alternatively run `npm run db:migrate` as an explicit deployment step.

Do not auto-seed production. Demo seed commands are disabled under `NODE_ENV=production` and require `CONFIRM_DEMO_SEED` for an exact non-production database target. See [DATABASE.md](./DATABASE.md).

## MLS Worker

Deploy the included worker from the repository root when MLS synchronization is needed.

```text
Build command: npm install && npm run build --workspace=db
Start command: npm run start --workspace=@frontstead/mls-service
```

Set `DATABASE_URL` to the same PostgreSQL service used by the API. Configure provider credentials, matching `MLS_BOARD_ID`/`MLS_PREFIX`, storage, synchronization, and public-display gates according to [MLS_BOARD_SETUP.md](./MLS_BOARD_SETUP.md). Credentials belong only in the worker service environment. Without provider configuration, the worker can remain undeployed or idle.

## Optional Redis And Typesense

The baseline deployment is PostgreSQL-only.

- Leave `REDIS_URL` unset when Redis is absent.
- Leave `TYPESENSE_HOST` and related variables unset when Typesense is absent.
- If Typesense is enabled, configure its host, port, protocol, and API key on services that use it.
- Verify PostgreSQL fallback behavior before treating either optional service as a dependency.

## External Agent Clients

When deploying a compatible external Agent API client, set `AGENT_API_ENABLED=true` on the API and configure that client's API URL and allowed origin. Keep it `false` for the normal portal deployment.

## Production Checklist

- [ ] Portal domain points to `apps/portal`.
- [ ] API and portal use HTTPS URLs and matching CORS origins.
- [ ] PostgreSQL is attached and migrations complete successfully.
- [ ] `JWT_SECRET` is unique and stored as a secret.
- [ ] `AGENT_API_ENABLED=false` unless Agent HQ is intentionally deployed.
- [ ] No demo seed command or `CONFIRM_DEMO_SEED` is configured in production.
- [ ] Redis and Typesense variables are omitted when those services are not deployed.
- [ ] MLS credentials and public display are enabled only after board/compliance setup.
- [ ] API and portal health are verified after deployment.

## Workstation Access To Railway PostgreSQL

Railway's internal PostgreSQL hostname does not resolve from a workstation. Use the PostgreSQL service's public URL temporarily for manual migrations, never commit or log it, and prefer running migrations inside the deployment environment. See [DATABASE.md](./DATABASE.md).
