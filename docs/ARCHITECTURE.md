# Architecture

## Current State

The first Clean Core transition uses one public portal frontend, one API, and one PostgreSQL database per deployment. PostgreSQL is the system of record and the only required data service.

```text
Browser
   |
   v
apps/portal (Next.js, default public frontend)
   |
   | HTTP / same-origin API proxy
   v
apps/api (Express + Prisma) --------------+----------------+
   |                                      |                |
   v                                      v                v
PostgreSQL (required)             Redis (optional)  Typesense (optional)
   ^
   |
apps/mls-service (included, separate worker)
   ^
   |
MLS/RESO provider (optional credentials)
```

Commercial and deployment-specific frontends are maintained in separate private repositories. They consume the versioned HTTP API and are not part of the public core deployment.

## Components

| Component | Current responsibility | Required |
| --- | --- | --- |
| `apps/portal` | Public pages, property search and details, inquiries, consumer auth, favorites | Yes |
| `apps/api` | REST API, authentication, portal operations, and the optional Agent API | Yes |
| PostgreSQL | Authoritative application, account, listing, and sync data | Yes |
| `apps/mls-service` | Persistent MLS ingestion and synchronization worker | Included; runs when MLS is configured |
| Typesense | Optional search acceleration | No |
| Redis | Optional caching integration | No |

## Request And Data Flow

Anonymous portal calls use the portal's same-origin `/api` rewrite. Authenticated consumer calls use a portal server route that reads an httpOnly session cookie and forwards the JWT to the API as a Bearer token. Browser JavaScript does not need direct access to the raw session token.

The API accesses PostgreSQL through Prisma. The portal's property search and API search fallback use PostgreSQL ILIKE/trigram behavior. If `TYPESENSE_HOST` is configured, selected search paths may use Typesense; failures fall back to PostgreSQL. Typesense does not replace PostgreSQL authority.

The MLS worker is deployed and operated separately from request-serving processes. It writes normalized MLS data and sync state to the same PostgreSQL database. It can start without synchronization credentials and remain idle; public MLS display remains disabled until explicitly approved and configured.

## Agent API Boundary

`/api/agent/*` routes fail closed by default. Only an operator integrating a compatible external client should set:

```bash
AGENT_API_ENABLED=true
```

All checked-in examples use `AGENT_API_ENABLED=false`.

## Package Roles

```text
packages/
  db/             Prisma schema, migrations, generated client, guarded demo seeds
  api-client/     Shared API base URL resolution and client contracts
  portal-config/  Portal policy and configuration
  search/         PostgreSQL search fallback and optional Typesense integration
  cache/          Optional Redis integration
  email/          Transactional email support
  tokens/         Shared design tokens
  ui/             Shared UI primitives
```

## Environment Boundaries

- Portal: `NEXT_PUBLIC_API_URL` points to the API; local fallback is `http://localhost:3001`.
- API: `DATABASE_URL`, `JWT_SECRET`, and portal origin settings belong in the API service environment.
- `FRONTEND_URL` identifies the portal origin, not a legacy web runtime or slug route.
- MLS worker: has its own service environment and shares only the database and intentionally matching MLS board identifiers with the API.
- Optional Typesense and Redis variables should be omitted, not filled with dummy production values, when those services are absent.

## Roadmap Boundary

The owner inbox, areas, collections, repository extraction, and Docker Compose baseline are implemented. A later Next.js-native transport remains roadmap work. See [FRONTSTEAD_OSS_ROADMAP.md](./FRONTSTEAD_OSS_ROADMAP.md).
