# Changelog

All notable public changes to Frontstead Kit are documented here.

## [0.12.0.15] - 2026-11-05

### Changed
- A portal visitor's welcome email is in the portal's name ("Welcome to Smith Realty") instead of "Welcome to Frontstead". Agent HQ accounts still get the Frontstead welcome.
- Emails have no default reply-to. It used to fall back to a Frontstead staff address; now replies go to `EMAIL_FROM` unless `EMAIL_REPLY_TO` is set.
- The portal footer and About page name the MLS boards in `listings.boardIds` (for example "Canopy MLS") instead of the "Your MLS Board" placeholder, and leave the MLS lines out while no board is configured. `GET /api/portals/current` now returns `mlsBoards: [{ id, name }]`.

### Upgrading
- If you relied on the old reply-to fallback, set `EMAIL_REPLY_TO`.

## [0.12.0.14] - 2026-11-05

### Added
- **Inquiry alerts go out without an external cron.** The API now sends queued new-inquiry emails itself every minute when an email provider is configured (`RESEND_API_KEY`). Without one, alerts stay queued instead of failing, and go out once a provider is set. `INQUIRY_DELIVERY_INTERVAL_SECONDS` changes the interval, and `0` turns it off for anyone who keeps calling `POST /api/cron/inquiry-deliveries`.
- `portal.config.ts` takes an optional `agentEmail`, the address new-inquiry alerts go to. `db:migrate` sets it when it creates the portal; an existing portal keeps its own value.
- Replying to an inquiry alert now answers the visitor: the alert's reply-to is the visitor's email.

### Changed
- The portal's page titles, header, footer and legal copy use the portal's own name (from `GET /api/portals/current`) instead of the hard-coded "ABC Realty". Pages set only their own part of the title, and the root layout adds ` | <portal name>`. The name is cached for a minute, so an edit to the portal shows up without a redeploy.

### Security
- Inquiry alerts are sent as escaped plain text. They used to put the visitor's message into the HTML part as is, so a message containing HTML rendered in the owner's inbox.

### Upgrading
- If your fork replaced "ABC Realty" in page copy, you can drop those edits: set `name` and `compliance.brokerageName` in `portal.config.ts` (or on the existing portal) instead. Expect merge conflicts in the files you edited; take this release's version.
- To get inquiry alerts, set `RESEND_API_KEY` and `EMAIL_FROM` on the API, and the portal's `agentEmail`.

## [0.12.0.13] - 2026-11-02

### Security
- **Next.js 16.4.4** (from 16.3.8), fixing GHSA-2464-fhr4-w9xw (critical: remote code execution in the Image Optimization API through `sharp` on glibc Linux), GHSA-673q-mjm6-r5xr (critical: remote code execution in `use cache` functions returning typed arrays) and GHSA-p3m5-59mp-jv5r (high: CPU denial of service through Server Actions). The portal uses Server Actions, so the last one applies to every deployment.
- The root `sharp` pin and override move to 0.35.5, the first fixed release. The old pin kept the fixed `sharp` out even after a Next.js upgrade.

### Upgrading
- Rebuild and redeploy the portal image. If your fork pins `sharp` or `next` itself, raise both pins.

## [0.12.0.12] - 2026-10-31

### Added
- **The deployment's portal now sets itself up on `db:migrate`.** After applying migrations, `db:migrate` creates the Account and Portal from `packages/portal-config/src/portal.config.ts` if no portal with that slug exists, and prints one line saying whether the portal is ready. It only ever creates: an existing portal is never changed, so dashboard edits survive redeploys. It never creates users, passwords or demo data. If the database holds portals with other slugs, it warns and creates nothing. Run the step alone with `npm run portal:ensure --workspace=db`.
- `GET /api/portals/current` returns this deployment's portal, the one compiled in from `portal.config.ts`.
- The portal has a `GET /api/health` route. It returns 200 when the API serves this deployment's portal (including a suspended one), and otherwise 503 with the reason and the fix. `compose.yaml` uses it as the portal healthcheck, so a deploy fails instead of serving an empty site.
- `docs/COMPOSE.md` has a Going Live section: one config file, deploy, and what each message means.

### Changed
- The portal reads its slug from the API (`GET /api/portals/current`) instead of the `PORTAL_SLUG` constant in `apps/portal/lib/portal.ts`, so `portal.config.ts` is the only place the slug is set. When the API has no portal for it, the portal logs why once instead of silently rendering empty listings.

### Upgrading
- If you edited `PORTAL_SLUG` in `apps/portal/lib/portal.ts`, put that slug in `portal.config.ts` instead. The constant is gone.
- If you copied `seed-portal.ts` to create your production portal, delete the copy: `db:migrate` creates the portal now, without a seeded login. Your existing portal is left as it is, as long as its slug matches `portal.config.ts`.
- If your portal container's healthcheck still requests `/`, switch it to `/api/health` so a missing portal fails the deploy.

## [0.12.0.11] - 2026-10-30

### Security
- Demo seeds no longer create accounts with fixed passwords. The passwords (`admin123`, `agent123` and others) were published in this repository, so they signed anyone in to any deployment that had been seeded, including as an administrator. Each run now generates one password for the accounts it creates and prints it once; set `DEMO_SEED_PASSWORD` (at least 12 characters) to choose it instead. Deployments seeded before this change still have the old passwords until they are reseeded or the passwords are changed.

## [0.12.0.10] - 2026-10-30

### Changed
- IDX approval (`compliance.idxApproved` in the portal config) now gates MLS listings only. Before approval, a portal in `db` listing mode shows listings that did not come from an MLS, such as an agent's own listings, instead of showing nothing; readiness reports IDX approval as a warning. MLS listings and shared property media still need both IDX approval and `MLS_PUBLIC_DISPLAY_ENABLED=true`. The owner collection preview counts the same listings the portal can show instead of returning nothing before approval.

### Fixed
- `/health` reports the search engine actually in use (`PostgreSQL` without `TYPESENSE_HOST`) instead of always `Typesense`.
- The MLS worker image builds again: its Dockerfile now sets the placeholder `DATABASE_URL` that `prisma generate` needs, as the API's does.
- `db:seed:demo-listings` publishes the collection it creates, so the demo listings appear on the portal.

## [0.12.0.9] - 2026-10-04

### Security
- Next.js upgraded from 16.2.11 to 16.3.8, clearing three critical advisories: unauthenticated remote code execution in the Image Optimization API when AVIF files are used, unauthenticated remote code execution on Windows-hosted servers, and remote code execution in `next/og` `ImageResponse`.

## [0.12.0.8] - 2026-08-21

### Added
- `@frontstead/ui` now includes a native-input `SelectionCard` composition for accessible radio and checkbox choices with visual content, descriptions, errors, and selected, focus, disabled, and reduced-motion states.

## [0.12.0.7] - 2026-08-21

### Added
- `@frontstead/ui` now includes brand-neutral Command primitives with required accessible labels and dialog descriptions, grouped and disabled items, empty and loading states, and consumer-owned command behavior.

## [0.12.0.6] - 2026-08-21

### Added
- `@frontstead/ui` now includes a controlled, accessible `DateTimePicker` with explicit local/UTC semantics, stepped time selection, date and datetime bounds, disabled-date policy, and ISO hidden-input form submission.

## [0.12.0.5] - 2026-08-20

### Added
- `@frontstead/ui` now includes an accessible, brand-neutral `Calendar` primitive with consumer-controlled locale, week start, date boundaries, disabled dates, selection mode, and callbacks.

## [0.12.0.4] - 2026-08-20

### Added
- `@frontstead/ui` now includes a brand-neutral `SortableTableHead` with native keyboard activation, explicit ascending/descending/unsorted semantics, and consumer-controlled sorting state.

## [0.12.0.3] - 2026-08-20

### Changed
- `@frontstead/ui` now depends only on the Radix primitives its exported components use, instead of the aggregate `radix-ui` package. The package dependency contract is checked against source imports and verified through a fresh tarball consumer.

## [0.12.0.2] - 2026-08-01

### Fixed
- The demo seeds and the database backfill scripts now read `DATABASE_URL` from the `.env` file the Quick Start tells you to create at the repository root. They previously looked for a `.env` beside themselves in `packages/db`, so following the Quick Start produced "DATABASE_URL is required before running a demo seed". An explicitly set `DATABASE_URL` still takes precedence.
- The demo seeds run again. Every seed entrypoint failed against the current schema: `db:demo:reset` and `db:seed:1000` set an `Account.plan` field that no longer exists, `db:seed:1000` created `Segment` and `PortalSegment` records for models that classification replaced, and `db:demo:reset:agent` called a segment helper that was deleted in the same change. Segment seeding is now expressed as portal listing collections.

### Changed
- Corrected the 0.12.0.1 entry below, which claimed the demo seeds were covered by that release's environment fix. Only `npm run db:migrate` was fixed at the time; the seeds are fixed in this release.

## [0.12.0.1] - 2026-07-30

### Fixed
- Portal listing results show their price, photo, listing link, and status again. Every card on a portal's property list was rendering those as blank while the address and room counts appeared normally.
- `npm run db:migrate` now reads the `DATABASE_URL` from the `.env` file the Quick Start tells you to create at the repository root, instead of failing with "Cannot resolve environment variable: DATABASE_URL". An explicitly set `DATABASE_URL` still takes precedence.

## [0.12.0.0] - 2026-07-30

### Added
- MLS public-display kill-switch (`MLS_PUBLIC_DISPLAY_ENABLED`): MLS-sourced listings and their photos are withheld from every public surface — property search, search suggestions, portal area and collection landings, property detail pages, and the Typesense-backed web search — until a deployment explicitly enables public display. Agent- and owner-facing tools are unaffected.
- Admin search reindex (`POST /api/search/reindex/:collection`) now reconciles the properties index exactly, pruning documents that are no longer publicly eligible, returns per-collection counts, and rejects unknown collections with a 400.
- Publishable `@frontstead/tokens`, `@frontstead/ui`, and `@frontstead/api-client` packages with compiled ESM, declaration files, explicit export maps, strict tarball allowlists, and Apache-2.0 legal notices.
- Shared Popover, NativeSelect, FormMessage, and Button loading-state primitives.
- Package tests, external tarball-consumer verification, and a manually gated npm trusted-publishing workflow with provenance.
- Public GitHub Issues for UI primitives that need a stronger reuse contract before promotion.

### Changed
- Public property, portal, and search responses no longer expose MLS photos or listing-agent contact details (email and phone) unless public display is enabled.
- Every public read path (search, suggestions, portal landings, portal readiness, and geographic-bounds search) now shares one public-eligibility rule: active, IDX-displayable, and non-MLS unless public display is enabled.
- The property search index is kept in sync by reconciling each property to its newest publicly-eligible listing after any listing, property, or MLS-sync change, so hiding an MLS update can no longer drop a manual listing from search.
- Public web-search cache keys and Typesense scoped search keys account for the public-display setting; scoped keys now expire after one hour.
- Branding assets now belong to applications rather than the generic UI package.
- Tailwind class discovery is explicitly configured by each consuming application instead of coupling the token package to UI source paths.
- Portal production and test servers now run the generated Next.js standalone artifact directly.
- Public documentation now separates durable operating guidance from GitHub Issue
  tracking and private implementation planning.

### Security
- Public search filters (city, state, property type, and status) are validated against strict allowlists before reaching the search engine, closing a search-filter injection vector.
- MLS listing data fails closed at the search-index boundary: an index write that cannot be confirmed aborts the related change rather than risk leaving a stale public document behind.
- Public API URL resolution reads only explicit public configuration and rejects credentials, unsafe schemes, queries, and fragments.
- Theme radius values are validated before CSS generation.
- Published tarballs reject source files, source maps, TypeScript build metadata, and unexpected files.
- Spinner, Skeleton, Alert, Empty, Table, Sheet, and AlertDialog APIs received accessibility and composition hardening.
- Patched PostCSS and Sharp releases override vulnerable versions bundled by Next.js.

## [0.11.0.0] - 2026-07-20

### Added
- Property search by address, city, ZIP, or subdivision, with price, bedroom, bathroom, property-type, sorting, and pagination controls.

### Fixed
- City- and subdivision-scoped portals now return matching listings.
- Price-filtered results consistently use the listing displayed to the visitor.
- Search endpoints reject malformed filters and enforce rate limits.

## [0.10.0.0] - 2026-07-19

### Added
- A ready-to-fork public portal with rebranding support.
- Visitor registration, login, favorites, and responsive navigation.

## [0.9.0.0] - 2026-07-02

### Added
- A lightweight owner lead inbox for reviewing portal inquiries and updating their status.

## Pre-Public Development

Earlier prerelease history belonged to private product development and is intentionally not part of the public core changelog.
