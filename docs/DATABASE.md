# Database Operations

Frontstead uses PostgreSQL in development and production. Prisma schema, migrations, client generation, and demo seeds live in `packages/db`.

## Prerequisites

- Node.js `>=22.12.0 <23`; the repository pins `22.12.0` in `.nvmrc` and `.node-version`.
- npm with workspace support. No exact npm version is pinned; use the root `package-lock.json` with `npm ci` for reproducible installs. Do not use pnpm or yarn.
- PostgreSQL. Redis and Typesense are optional and are not substitutes for PostgreSQL.

## Configure PostgreSQL

Set a PostgreSQL URL in the root `.env` for local commands:

```bash
DATABASE_URL="postgresql://frontstead:change-me@localhost:5432/frontstead_dev?schema=public"
```

Use a dedicated local database and credentials. Never commit a real connection URL.

## Migrations And Client Generation

From the repository root:

```bash
npm run db:migrate
npm run build --workspace=db
```

`db:migrate` runs `prisma migrate deploy` and applies committed migrations. It does not create a migration. API startup does not run this command, so run it explicitly before starting a newly deployed API version.

To author a migration against a disposable development database:

```bash
npx prisma migrate dev --config=packages/db/prisma.config.ts --name <migration-name>
```

Review the generated SQL before committing it. Generate the Prisma client after schema changes with `npm run build --workspace=db`.

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

Guarded reset commands:

```bash
npm run db:demo:reset
npm run db:demo:reset:1000
npm run db:demo:reset:agent
npm run db:demo:reset-and-seed
```

Reset commands replace or delete data. Confirm the parsed target shown by the guard before proceeding. Demo data must not be treated as account provisioning, and documentation must not publish fixed login credentials.

## Production

Apply migrations as an explicit deployment step before starting the API:

```bash
npm run db:migrate
npm run start:api
```

Neither `npm run start:api` nor the API Docker image applies migrations. Demo seeds do not run automatically and must not be added to production startup.

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

See [DEPLOYMENT.md](./DEPLOYMENT.md) for service-by-service deployment and
[COMPOSE.md](./COMPOSE.md) for the portable deployment baseline.
