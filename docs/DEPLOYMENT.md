# Railway Deployment

This document describes service-by-service Railway deployment. For the canonical portable baseline, use [Docker Compose](./COMPOSE.md).

## Runtime Requirements

- Node.js `>=22.12.0 <23`; use `22.12.0` to match the repository and API Dockerfile.
- npm workspaces and the root `package-lock.json`. No exact npm version is pinned; use `npm ci` in reproducible builds.

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
Build command: npm ci && npm run build:api
Start command: npm run start:api
```

Do not use root `npm run build` for the API service; it builds every buildable workspace. The start command only starts the API and does not apply database migrations.

Unlike the portal, the API builds with Railpack rather than its Dockerfile.
`prisma generate` reads `DATABASE_URL` through `packages/db/prisma.config.ts`,
and Railpack has the service variables in scope at build time while a Docker
build does not, so `apps/api/Dockerfile` currently fails at that step. Use it
only with `DATABASE_URL` supplied as a build argument.

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
MLS_PUBLIC_DISPLAY_ENABLED=false
LOG_LEVEL=info
```

Generate a unique `JWT_SECRET` in a secret manager or secure local shell. Do not commit its value.

## Portal Service

Create a second service from the repository root. It builds from
`apps/portal/Dockerfile`, which `apps/portal/railway.json` selects:

```text
Builder:         Dockerfile
Dockerfile path: apps/portal/Dockerfile
Root directory:  /            (the image builds from the monorepo root)
```

Leave the start command empty, and clear any command an existing service already
has. The image runs the standalone server itself, binding `HOSTNAME=0.0.0.0` so
the platform can reach it.

A Railway start command overrides the image's `CMD`. Routing startup back through
`npm run start` binds the container hostname rather than all interfaces, and the
service returns `502` while its logs still report `✓ Ready`. A stale command left
from an earlier setup fails the same way — or crashes the container outright if it
names a script this repository no longer has. Check the build command too;
switching builders does not clear either one.

Point the service's public domain at the port the container actually binds, which
is not necessarily the `3006` the image declares. Railway injects its own `PORT`
into the running container, and a runtime variable overrides the image's `ENV`,
so the server follows the injected value — `8080` by default. The startup log
line reports the truth:

```text
▲ Next.js
- Network:  http://0.0.0.0:8080     <- set the domain's target port to this
```

Honouring an injected `PORT` is the behaviour every managed platform expects, so
prefer matching the domain to it over forcing the port back to `3006` with a
service variable. `3006` applies where nothing injects a port — Docker Compose,
and a plain `docker run`.

A target port that does not match the bound port returns `502` while the
deployment reports success and the container logs `✓ Ready`.

Variables:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_NAME="Example Realty"
```

`NEXT_PUBLIC_*` values are compiled into the bundle, so changing one rebuilds the
image rather than restarting it. `apps/portal/Dockerfile` declares
`ARG NEXT_PUBLIC_API_URL`, so Railway passes the service variable through at
build time; its `http://api:3001` default only applies to a local
`docker build` with no argument (and to Docker Compose, where that hostname
resolves).

Point the public domain directly to the root of `apps/portal`. No legacy frontend or marketing service is required.

## PostgreSQL And Migrations

Attach Railway PostgreSQL to the API and MLS worker. The API uses the internal service URL inside Railway.

Run migrations as an explicit pre-deploy or release step, with the same `DATABASE_URL` that the API uses:

```bash
npm run db:migrate
```

The command runs `prisma migrate deploy`. It must complete before `npm run start:api`; API startup and the API Docker image do not apply migrations automatically.

Do not auto-seed production. Demo seed commands are disabled under `NODE_ENV=production` and require `CONFIRM_DEMO_SEED` for an exact non-production database target. See [DATABASE.md](./DATABASE.md).

## MLS Worker

Deploy the included worker from the repository root when MLS synchronization is needed.

```text
Build command: npm ci && npm run build --workspace=db
Start command: npm run start --workspace=@frontstead/mls-service
```

Set `DATABASE_URL` to the same PostgreSQL service used by the API. Configure provider credentials, matching `MLS_BOARD_ID`/`MLS_PREFIX`, storage, synchronization, and public-display gates according to [MLS_BOARD_SETUP.md](./MLS_BOARD_SETUP.md). Set `MLS_PUBLIC_DISPLAY_ENABLED` to the same value on the API and worker. Credentials belong only in the worker service environment. Without provider configuration, the worker can remain undeployed or idle.

## Optional Redis And Typesense

The baseline deployment is PostgreSQL-only.

- Set `REDIS_ENABLED=false` when Redis is absent.
- When Redis is enabled, configure `REDIS_HOST`, `REDIS_PORT`, and optional
  `REDIS_PASSWORD` and `REDIS_DB` values.
- Leave `TYPESENSE_HOST` and related variables unset when Typesense is absent.
- If Typesense is enabled, configure its host, port, protocol, and API key on services that use it.
- The Railway pre-deploy command runs the Typesense schema migration when
  `TYPESENSE_HOST` is configured and skips it for PostgreSQL-only deployments.
- Outside Railway, run `npm run typesense:migrate --workspace=api` before
  deploying code that depends on a changed Typesense schema.
- After changing MLS public-display policy or deploying a Typesense visibility
  schema change, run the authenticated
  `POST /api/search/reindex/properties` endpoint. Reindex completes the exact
  desired set and removes stale property documents.
- Verify PostgreSQL fallback behavior before treating either optional service as a dependency.

## External Agent Clients

When deploying a compatible external Agent API client, set `AGENT_API_ENABLED=true` on the API and configure that client's API URL and allowed origin. Keep it `false` for the normal portal deployment.

## Production Checklist

- [ ] Portal domain points to `apps/portal`.
- [ ] API and portal use HTTPS URLs and matching CORS origins.
- [ ] PostgreSQL is attached and migrations complete successfully.
- [ ] `JWT_SECRET` is unique and stored as a secret.
- [ ] `AGENT_API_ENABLED=false` unless a compatible external Agent API client is intentionally deployed.
- [ ] API and MLS worker use the same `MLS_PUBLIC_DISPLAY_ENABLED` value.
- [ ] No demo seed command or `CONFIRM_DEMO_SEED` is configured in production.
- [ ] `REDIS_ENABLED=false` and Typesense variables are omitted when those services are not deployed.
- [ ] MLS credentials and public display are enabled only after board/compliance setup.
- [ ] Typesense property reindex completed after the latest visibility-policy change.
- [ ] API and portal health are verified after deployment.

## Workstation Access To Railway PostgreSQL

Railway's internal PostgreSQL hostname does not resolve from a workstation. Use the PostgreSQL service's public URL temporarily for manual migrations, never commit or log it, and prefer running migrations inside the deployment environment. See [DATABASE.md](./DATABASE.md).
