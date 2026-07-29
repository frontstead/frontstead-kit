# Frontstead Kit Operations

The default stack is `apps/portal` + `apps/api` + PostgreSQL. The owner inbox, areas, collections, private-app extraction, and Compose baseline are implemented; remaining transport work is tracked in the [Frontstead OSS Roadmap](./FRONTSTEAD_OSS_ROADMAP.md).

## Prerequisites

- Node.js 22.12
- npm
- PostgreSQL

Redis and Typesense are optional and are not required for a local or production baseline.

## Install And Run

From the repository root:

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

This starts the default public portal at <http://localhost:3006> and the API at <http://localhost:3001>. `npm run dev:portal` is the explicit equivalent.

## Optional Demo Data

All demo seed scripts require explicit confirmation of the database target and are disabled in production. For the example local `DATABASE_URL`, run:

```bash
export CONFIRM_DEMO_SEED='localhost:5432/frontstead_dev?schema=public'
npm run db:seed:portal
npm run db:seed:demo-listings
```

The guard value excludes the URL scheme and credentials. Read [DATABASE.md](./DATABASE.md) before running a reset command. Demo seed output is for local evaluation; create real users through the application rather than relying on documented fixed credentials.

## Included MLS Worker

The repository includes `apps/mls-service` as a separate persistent worker:

```bash
cp apps/mls-service/.env.example apps/mls-service/.env
npm run dev --workspace=@frontstead/mls-service
```

It shares PostgreSQL with the API. MLS credentials, board scope, and public-display approval are deployment-specific; follow [MLS_BOARD_SETUP.md](./MLS_BOARD_SETUP.md). The portal and API can run without the worker configured.

## Optional Services

- Typesense adds typo-tolerant search. Leave `TYPESENSE_HOST` unset to use PostgreSQL search.
- Redis may be configured with `REDIS_ENABLED=true` and `REDIS_HOST` for cache-backed paths. It is disabled in the Compose default stack.
- Agent API routes remain unavailable unless an operator explicitly sets `AGENT_API_ENABLED=true`. The default is `false`.

## External Agent Clients

Compatible external clients can use the versioned Agent API when an operator explicitly enables it. Agent HQ and other commercial applications are maintained outside this repository and are not required for a portal deployment.

## Operational Commands

```bash
npm run dev                       # portal + API
npm run dev:api                   # API only
npm run dev --workspace=portal    # portal only
npm run db:migrate                # apply existing migrations
npm run test:api
npm run test:portal
npm run typecheck:api
npm run typecheck:portal
npm run typecheck:mls
```

For the portable container baseline, see [Docker Compose](./COMPOSE.md). Service-by-service Railway guidance remains in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Reference

- [Architecture](./ARCHITECTURE.md)
- [Database operations](./DATABASE.md)
- [Docker Compose](./COMPOSE.md)
- [Railway deployment](./DEPLOYMENT.md)
- [MLS board setup](./MLS_BOARD_SETUP.md)
- [Clean Core roadmap](./FRONTSTEAD_OSS_ROADMAP.md)

## License

This repository is Apache-2.0. Separately distributed commercial applications are not covered by this license.
