# Frontstead Kit

Frontstead Kit is an Apache-2.0, self-hostable real estate portal stack. The current public frontend is `apps/portal`, backed by `apps/api` and PostgreSQL.

## Current State

- `apps/portal`: default public Next.js frontend for search, listing pages, inquiries, consumer accounts, and favorites.
- `apps/api`: Express and Prisma API used by the portal, plus an optional versioned Agent API.
- `apps/mls-service`: included MLS synchronization worker. It is a separate long-running process and remains idle when MLS credentials are not configured.
- PostgreSQL: required and authoritative in local development and production.
- Redis and Typesense: optional. The core stack runs without either; search falls back to PostgreSQL when Typesense is not configured.
- Agent API: disabled by default with `AGENT_API_ENABLED=false`.
- Commercial frontends such as Agent HQ are distributed separately and consume the HTTP API.

See the [Frontstead OSS Roadmap](./docs/FRONTSTEAD_OSS_ROADMAP.md) for completed boundaries and remaining transport work. Docker Compose is the canonical portable deployment baseline.

## Quick Start

Prerequisites: Node.js 22.12, npm, and PostgreSQL.

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

`npm run dev` starts the portal and API:

- Portal: <http://localhost:3006>
- API: <http://localhost:3001>

An empty database is valid. To add local demo data, opt in to the exact database target first. The confirmation is the URL host and database name, without credentials:

```bash
export CONFIRM_DEMO_SEED='localhost:5432/frontstead_dev?schema=public'
npm run db:seed:portal
npm run db:seed:demo-listings
```

Demo seeds refuse to run in production. Do not set `CONFIRM_DEMO_SEED` as a production service variable.

## Project Shape

```text
apps/
  portal/         Default public frontend
  api/            Express API
  mls-service/    Included MLS synchronization worker
  typesense/      Optional search service tooling
packages/
  db/             Prisma schema, migrations, and guarded demo seeds
  api-client/     Shared API URL and client utilities
  portal-config/  Portal policy and configuration
  search/         PostgreSQL fallback and optional Typesense integration
  cache/          Optional Redis integration
  email/          Transactional email support
  tokens/         Shared design tokens
  ui/             Shared UI components
```

## Common Commands

```bash
npm run dev                 # portal + API
npm run dev:api             # API only
npm run dev:portal          # portal + API
npm run db:migrate          # apply existing PostgreSQL migrations
npm run test:api
npm run test:portal
npm run typecheck:api
npm run typecheck:portal
npm run typecheck:mls
```

The included MLS worker runs separately:

```bash
npm run dev --workspace=@frontstead/mls-service
```

See [MLS board setup](./docs/MLS_BOARD_SETUP.md) before enabling synchronization or public MLS display.

## Documentation

- [Setup and operations](./docs/README.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Database](./docs/DATABASE.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Docker Compose](./docs/COMPOSE.md)
- [Shared package releases](./docs/PACKAGE_RELEASES.md)
- [MLS board setup](./docs/MLS_BOARD_SETUP.md)
- [Clean Core roadmap](./docs/FRONTSTEAD_OSS_ROADMAP.md)

## License

This repository is licensed under Apache License 2.0. Commercial Frontstead applications are distributed separately and are not covered by this repository's license.
