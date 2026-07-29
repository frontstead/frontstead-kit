# Database Operations

## Current State

Frontstead uses PostgreSQL in development and production. Prisma schema, migrations, generated client configuration, and demo seeds live under `packages/db`.

```text
packages/db/
  prisma/schema.prisma
  prisma/migrations/
  prisma/seed*.ts
  prisma.config.ts
  scripts/seedGuard.ts
```

PostgreSQL is authoritative even when optional Redis or Typesense services are configured.

## Configure PostgreSQL

Set a PostgreSQL URL in the root `.env` for local commands:

```bash
DATABASE_URL="postgresql://frontstead:change-me@localhost:5432/frontstead_dev?schema=public"
```

Use a dedicated local database and credentials. Never commit a real connection URL.

## Migrations And Client Generation

From the repository root:

```bash
npm run db:migrate              # prisma migrate deploy; applies existing migrations
npm run build --workspace=db    # generate the Prisma client
```

To author a migration, run Prisma from `packages/db` with its local config and schema. Review generated SQL, especially extension-backed indexes, before applying it. Do not use `npm run db:migrate` to author migrations.

Core search works on standard PostgreSQL without extensions. Operators with database-owner privileges can optionally apply `packages/db/scripts/enable-trigram-search.sql` to install `pg_trgm` and accelerate free-text search. Prisma does not represent those manually created indexes, so reject generated migrations that would drop them unintentionally.

## Guarded Demo Seeds

Demo seeds are explicit development operations. Every demo or destructive seed:

- requires `DATABASE_URL`;
- refuses to run when `NODE_ENV=production`;
- requires `CONFIRM_DEMO_SEED` to equal the exact URL host and database target; and
- must never be placed in a production start command or production service environment.

For this example URL:

```text
postgresql://frontstead:change-me@localhost:5432/frontstead_dev?schema=public
```

the confirmation is:

```bash
export CONFIRM_DEMO_SEED='localhost:5432/frontstead_dev?schema=public'
```

Portal demo data:

```bash
npm run db:seed:portal
npm run db:seed:demo-listings
```

Renamed guarded reset commands:

```bash
npm run db:demo:reset
npm run db:demo:reset:1000
npm run db:demo:reset:agent
npm run db:demo:reset-and-seed
```

Reset commands replace or delete data. Confirm the parsed target shown by the guard before proceeding. Demo data must not be treated as account provisioning, and documentation must not publish fixed login credentials.

## Production

Apply migrations as an explicit deploy or startup step. The current API start script runs `prisma migrate deploy`; demo seeds do not run automatically and must not be added to production startup.

On Railway, the API typically receives an internal `DATABASE_URL` from the PostgreSQL service. That hostname only resolves inside Railway. For a workstation operation, temporarily supply the PostgreSQL service's public URL as `DATABASE_URL`, then run the migration command. Treat both URLs as secrets and avoid shell history, logs, and committed files.

```bash
DATABASE_URL="$DATABASE_PUBLIC_URL" npm run db:migrate
```

Prefer migrations from the deployment environment when possible.

## Development Reset

Prisma's migration reset drops the selected database and reapplies migrations. Use it only against a disposable local database and only after independently verifying `DATABASE_URL`. The guarded `db:demo:*` commands are the documented way to prepare demo data.

## Troubleshooting

### Cannot reach the database

- Confirm PostgreSQL is running and the host, port, database, and credentials are correct.
- From a workstation, do not use Railway's internal hostname; use a short-lived public connection URL.
- Confirm `.env` resolution before assuming a platform-injected variable is active.

### Prisma client is missing

```bash
npm run build --workspace=db
```

### Migration status

```bash
npx prisma migrate status --config=packages/db/prisma.config.ts
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the current service-by-service deployment and [FRONTSTEAD_OSS_ROADMAP.md](./FRONTSTEAD_OSS_ROADMAP.md) for future portable deployment work.
