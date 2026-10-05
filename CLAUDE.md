# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Frontstead Kit — the Apache-2.0, self-hostable core: one public portal, one API, one
PostgreSQL database, an optional MLS worker, and the shared packages published to npm as
`@frontstead/{tokens,ui,api-client}`.

Commercial and customer-specific frontends (Agent HQ, marketing, branded portals) live in
separate private repos and consume this repo only through the published packages and the HTTP
API. Do not add private product source, planning transcripts, customer context, or TODO/plan
files here — actionable work belongs in GitHub Issues.

This file is the single source for agent guidance in this repo. `AGENTS.md` is a stub that
points here, so other agent tools that look for `AGENTS.md` by convention land on these rules.
Edit this file; leave the stub alone.

## Commands

npm workspaces with `package-lock.json`. Node `>=22.12 <23` (publishing packages needs 22.14+).
Never pnpm or yarn. All commands run from the repo root unless noted.

```bash
npm install
npm run db:migrate                                # prisma migrate deploy
npm run dev                                       # API :3001 + portal :3006 (concurrently)
npm run dev:api                                   # API only
npm run dev --workspace=@frontstead/mls-service   # MLS worker, separate process

npm run typecheck                                 # all workspaces, in dependency order
npm run typecheck:portal                          # also :api :db :ui :tokens :mls :email :cache :api-client :portal-config
npm run test                                      # every workspace with a test script
npm run test:api                                  # vitest
npm run test:portal                               # vitest
npm run test:e2e                                  # playwright, self-contained (see below)
npm run docs:check                                # CI runs this first — see Documentation
npm run release:check                             # gate for publishing tokens/ui/api-client

npm start                                         # API + portal, production mode
npm run build:api                                 # misnamed: it runs the db build (prisma
                                                  # generate), the API's deploy prerequisite
npm run build --workspace=portal                  # portal only
```

`npm run lint` exists but is a **no-op**: no workspace defines a `lint` script and there is no
ESLint config. Typecheck and tests are the real gates. `tsconfig.base.json` sets
`strict: false`, so `tsc` will not catch null/undefined misuse.

### Focused test runs

```bash
npm run test --workspace=api -- src/__tests__/unit/foo.test.ts   # one file
npm run test --workspace=api -- -t "rejects expired tokens"      # by name
npm run test:unit --workspace=api                                # unit dir only
npm run test:integration --workspace=api                         # needs a live PostgreSQL
npm run test --workspace=portal -- lib/listings.test.ts
```

Two different runners are in play:

- **vitest**: `api`, `portal`, `@frontstead/mls-service`, `portal-config`, `search`, `cache`,
  `email`.
- **node:test** (`node --import tsx --test`): `@frontstead/tokens`, `@frontstead/ui`,
  `@frontstead/api-client`, and `db`'s seed guard. Run a single file by invoking node directly
  from the package directory.

API integration tests share one PostgreSQL database, so `fileParallelism: false` is set in
`apps/api/vitest.config.ts` — do not re-enable it. `apps/api/test-setup.ts` loads
`apps/api/.env.test` and pins `NODE_ENV`, `JWT_SECRET`, and `API_PORT=3002`.

Portal tests default to the `node` environment; component tests opt into jsdom with
`// @vitest-environment jsdom` at the top of the file.

`npm run test:e2e` needs no database and no real API: Playwright boots a mock API on `:3011`
and a standalone portal build on `:3106` itself.

### CI order

`.github/workflows/test.yml` runs `docs:check`, `npm ci`, `build --workspace=db`, `db:migrate`,
api unit, api integration, MLS tests, the destructive seed-guard test, portal tests,
`typecheck:ci`, the package artifact verification, then `next build` for the portal. A second
job boots `compose.yaml` end to end and probes `/health` and `/`.

The `next build` step is not redundant with tsc — only the Next compiler catches a server-only
module leaking into a client component.

## Architecture

### Request and auth flow

The browser only ever talks to the portal origin:

- **Anonymous** calls hit the portal's `/api/:path*` rewrite in `apps/portal/next.config.ts`,
  which forwards to `NEXT_PUBLIC_API_URL`. It is registered under `fallback` (not the default
  `afterFiles`) so it cannot shadow real Next route handlers.
- **Authenticated** calls go to `app/api/proxy/[[...path]]/route.ts`, which reads the
  `portal_token` httpOnly cookie, forwards it as a `Bearer` token plus an `X-Portal-Slug`
  header, and relays the response. Browser JS never holds the raw JWT.
- Login/register go to `app/api/auth/*`, which call the API and hand the response to
  `lib/establish-session.ts` — it sets the cookie server-side and **strips the token out of the
  response body**. Keep that property when touching auth.
- `lib/session-user-server.ts` decodes the cookie's payload for display only, never verifying
  it. Signature verification is the API's job.

### Build order

`packages/db` exports raw TypeScript (`"main": "index.ts"`) and re-exports the Prisma client
from `packages/db/generated/`. Nothing that imports `db` can typecheck or build until
`npm run build --workspace=db` (`prisma generate`) has run. The portal's
`predev`/`prebuild`/`pretypecheck`/`pretest` hooks rebuild `tokens`/`ui`/`api-client` for the
same reason. `apps/api/vitest.config.ts` inlines the `db` workspace so Vite resolves its `.js`
import specifiers to `.ts` sources.

The Prisma datasource declares no `url`; `packages/db/prisma.config.ts` and `db/index.ts` read
`DATABASE_URL` at runtime — root `.env` first, then an optional `packages/db/.env` override, and
an already-set environment variable always wins. `db/index.ts` returns a lazy `Proxy` around
`PrismaClient` so the URL is read on first use rather than at import time.

### The API

`apps/api/src/server.ts` is the whole wiring story: `createApp()` mounts one router per resource
from `src/routes/` (one file per resource), and the Agent API is gated inside it. This is ESM
via `tsx` — **intra-app imports must carry a `.js` extension** even though the files are `.ts`.

`createApp({ agentApiEnabled })` takes an explicit override so tests can exercise both sides of
the gate; production reads `AGENT_API_ENABLED`. Owner routes (`/api/owner/*`) stay available
when the Agent API is off.

### Portal and per-deployment config

`packages/portal-config/src/portal.config.ts` *is* the portal — one config per deployment, no
multi-tenant registry. It validates on load and owns slug, domains, listing mode, feature
flags, MLS compliance posture, and the classification definitions.

Theming is a compile step, not runtime CSS: `apps/portal/theme.config.ts` →
`apps/portal/scripts/gen-theme.mts` → `apps/portal/app/theme.generated.css` (OKLCH,
WCAG-AA guaranteed).
`dev` and `build` run `gen:theme` automatically; run it manually with
`npm run gen:theme --workspace=portal`. Never hand-edit `theme.generated.css`, and keep
`theme.primary` in `portal.config.ts` in sync with `theme.config.ts`.

Read `DESIGN.md` before UI work: compact soft brutalism, Geist Sans/Mono, visible borders over
shadow, 8px spacing base, 6px radius, 75–200ms motion, semantic tokens. Prefer `packages/ui` +
`packages/tokens` over app-local duplication. `docs/SIDEBAR_SHELL.md` records the promotion gate
for shared shells — two independent consumers before anything enters `@frontstead/ui`.

### Search and classification

PostgreSQL is authoritative. Typesense is optional (omit `TYPESENSE_HOST`) and only ever
produces candidates — `packages/search` re-applies visibility, board scope, portal activation,
and collection exclusions in PostgreSQL. Redis is optional (`REDIS_ENABLED=false`).

Collection membership comes from the classification engine in `@frontstead/portal-config`
(predicate AST, config hash, evidence, `manualOverride` protection). There is no
reclassification scheduler; config changes need an explicit resumable run —
`npm run classify --workspace=db -- {check|diff|apply} <accountId>`. See
`docs/CLASSIFICATION.md`.

## Non-negotiable safety rails

- **Agent API is fail-closed.** `/api/agent/*` 404s with `AGENT_API_DISABLED` unless
  `AGENT_API_ENABLED=true`. Every checked-in example and default stays `false`.
- **MLS public display is gated.** `MLS_PUBLIC_DISPLAY_ENABLED` must hold the same effective
  value in the API and the MLS worker, and stays `false` until board approval. Do not sync
  licensed MLS data into a publicly reachable deployment first — see `docs/MLS_COMPLIANCE.md`
  and `docs/MLS_BOARD_SETUP.md`.
- **Demo seeds are guarded.** Every `db:demo:*` / `db:seed:*` script requires
  `CONFIRM_DEMO_SEED` to exactly match `<host>:<port>/<database>` from `DATABASE_URL` and
  refuses to run under `NODE_ENV=production`. The guarded set is `db:demo:reset`,
  `db:demo:reset:1000`, `db:demo:reset:agent`, `db:demo:reset-and-seed`, `db:seed:1000`,
  `db:seed:portal` (portal demo provisioning), and `db:seed:demo-listings` (optional portal
  listings). Never add automatic production seeding, fixed credentials, or a deployed
  `CONFIRM_DEMO_SEED` service variable. `packages/db/scripts/seedGuard.test.ts` is a CI gate —
  keep it passing.
- Never commit customer data, MLS credentials, or secrets, including in fixtures and tests.

## Documentation

`npm run docs:check` runs first in CI and fails the build on:

- any `docs/*.md` (other than `docs/README.md`) missing a `](./name.md)` entry in
  `docs/README.md`;
- any broken relative Markdown link anywhere in the repo;
- any reference to a retired filename listed in `scripts/check-docs.mjs`.

So adding a doc is two steps: create `docs/NAME.md` and link it from `docs/README.md`. Update
docs in the same change as the behavior they describe.

Treat `README.md`, `docs/README.md`, and the linked operational guides as current-state
documentation. Durable architecture and design decisions belong in public docs or ADRs; public
follow-up work belongs in a GitHub Issue with acceptance criteria.

## Release and versioning

`VERSION`, the root `package.json` version, and `CHANGELOG.md` share a four-part scheme
(`0.12.0.8`). Commits that bump it are subject-prefixed with the version:
`v0.12.0.8 feat(ui): add SelectionCard (#33)`. Changes that do not bump it use a plain
conventional subject (`docs: …`, `ci: …`, `fix(portal): …`).

Publishing shared packages: `npm run release:check` (package tests → db build → typecheck →
`build:packages` → tarball allowlist verification → fresh-consumer install test), then the
GitHub OIDC trusted-publishing workflow in `.github/workflows/publish-packages.yml`. Publish
`tokens` before `ui`. Published versions are immutable — fix forward with a new patch.

## Gotchas

- `npm run typecheck` does **not** include `packages/search`. Run
  `npm run typecheck --workspace=search` after touching it.
- `apps/typesense` is a declared workspace with no `package.json` — it is Dockerfile-only
  tooling, so workspace-wide scripts skip it.
- `FRONTEND_URL` and local examples must use port **3006**, not 3000. The one exception in the
  repo is `apps/api/test-setup.ts`, which pins 3000 for API tests that serve no portal.
- API-specific variables belong in `apps/api/.env` or the API service environment, not the
  root `.env`.
- Deployment domains point directly at the root of `apps/portal`.
- Railway's internal PostgreSQL hostnames resolve only inside Railway; from a workstation use
  the service's public URL and never commit or log it.
