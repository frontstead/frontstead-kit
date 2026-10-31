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

## Going Live

Taking your own portal to production takes one config file and a deploy. There is no seed to run and no admin to create first.

1. **Set your portal in `packages/portal-config/src/portal.config.ts`.** That means `slug`, `name`, `domains` (your public domain first, after any `*.localhost` names), and `compliance.brokerageName`/`brokeragePhone`. The slug is set **only** here: the API compiles this file in, and the portal asks the API for it at `GET /api/portals/current`.
2. **Deploy.** The `migrate` service runs `npm run db:migrate`, which applies migrations and then creates your portal (one Account and one active Portal) if it doesn't exist yet. Its log ends with one line:

   ```text
   ✓ Portal smith-realty ready (created): Smith Realty · smithrealty.com · listings: hidden (MLS listings stay hidden until IDX approval)
   ```

   On later deploys, it says `ready (existing, not changed)`. It only ever creates the portal. After that, edit the name, phone and so on from the owner dashboard, and a redeploy won't overwrite them. It never creates users, passwords or demo data.
3. **Check it.** The portal's healthcheck is `GET /api/health` on port 3006, and it is healthy only when the API serves your portal, so `docker compose up --wait` fails rather than serving an empty site. Open `<API_URL>/api/portals/slug/<slug>/readiness` to see what's shown and why. When `API_URL` is set in the migrate service, the migrate log prints this URL.

### When something is off

| You see | Cause | Fix |
| --- | --- | --- |
| Migrate log: `portal.config.ts slug 'x' has no portal; this database has 'y'` | The slug in config changed after the portal was created, or the database belongs to another portal | Put the existing slug back in `portal.config.ts`. A rename has to be deliberate: change the slug on the existing portal first. Nothing is created automatically. |
| Migrate log: `Portal x exists but is inactive` | The portal was deactivated | Reactivate it (owner dashboard or `isActive`); the site returns 404 until then |
| Portal `/api/health` 503: `the API has no active portal…` | Migrate didn't run, or one of the two cases above | Run `docker compose run --rm migrate` and read its last line |
| Portal `/api/health` 503: `the API is unreachable at …` | The portal can't reach the API | Check `API_INTERNAL_URL` and that the API is healthy |

Demo data (`db:seed:*`) is for local evaluation only and refuses production. See [DATABASE.md](./DATABASE.md).
