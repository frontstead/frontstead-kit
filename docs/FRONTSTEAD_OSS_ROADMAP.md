# Frontstead OSS Roadmap

## Objective

Publish a clean, Apache-2.0 real-estate portal stack that provides:

- A generic Next.js portal
- PostgreSQL-backed property search
- An included MLS synchronization worker
- Consumer accounts and favorites
- An owner lead inbox
- Configurable geographic areas, property classifications, and listing collections
- An optional open Agent API
- A separately licensed Agent HQ frontend

Implementation must remain incremental. Cleanup, schema replacement, product features, and the Next.js transport migration must not land as one large change.

## Product Boundary

| Product | Distribution | Responsibility |
| --- | --- | --- |
| Frontstead Kit | Public, Apache 2.0 | Portal, owner admin, API, database, MLS worker, classifications, collections |
| Agent HQ | Private commercial source | CRM, tasks, transactions, Google integration, AI workflows, reporting |
| Internal Admin | Private | Cross-account operations and support |
| Marketing | Separate repository | Frontstead commercial website |
| Carolina Golf Homes | Separate deployment | Reference/customer portal built with the kit |

Agent HQ licensing:

- One production client deployment per license
- Private GitHub source access
- Modifiable and fully white-label
- Perpetual use of the purchased version
- One year of updates
- No runtime license server initially

## Target Repository

```text
apps/
  portal/             # Public portal and owner admin
  api/                # Public API and optional Agent API
  mls-service/        # Included persistent ingestion worker
  typesense/          # Optional search profile

packages/
  api-client/         # Versioned generated client and contracts
  cache/              # Optional
  db/
  email/
  portal-config/
  search/
  tokens/
  ui/
```

Move out:

- `apps/admin`
- `apps/marketing`
- `apps/agent-hq`
- `apps/carolina-golf-homes`
- Internal cross-account API routes
- Internal plans, editor state, and personal deployment artifacts

Remove:

- `apps/web`
- Empty `packages/auth` and `packages/etl`
- Generated Prisma output
- Stale SQLite database
- Obsolete MLS examples and documentation
- Unused binaries and design previews
- Client-specific seeds
- Retired CLI references and scripts

## System Design

```text
MLS provider
     |
     v
Provider adapter
     |
     v
Normalized listing attributes -----> Classification engine
     |                                      |
     |                                      v
     |                          Areas, memberships, property tags
     |                                      |
     +-------------> PostgreSQL <-----------+
                         |
                Collection predicate
                         |
              +----------+----------+
              |                     |
         Next portal          Optional Typesense
              |
       Public collection page
              |
         Inquiry transaction
              |
       Contact + delivery outbox
              |
       +------+----------------+
       |                       |
Owner lead inbox       Optional Agent HQ
```

PostgreSQL remains authoritative for listing eligibility. Typesense may accelerate searches but must never bypass account, portal, MLS, IDX, status, or manual-exclusion rules.

## Phase 0: Security

This phase is a release blocker.

1. Rotate every credential found in tracked files, local environment files, history, archives, or deployment examples.
2. Investigate the removed obfuscated `.github/setup.js` hook and document the impact privately.
3. Scan all refs, unreachable Git objects, release assets, archives, DOCX files, HTML artifacts, and Docker contexts.
4. Build the future public repository from an explicit file allowlist.
5. Review licenses for source code, fonts, images, sample MLS data, and dependencies.
6. Add Apache 2.0, `SECURITY.md`, `CONTRIBUTING.md`, a support policy, issue templates, and PR templates.
7. Add secret scanning and dependency review to CI.

**Gate:** Credentials rotated, scans clean, provenance approved, and sanitized history prepared.

## Phase 1: Contracts And Extraction

1. Start from current `origin/main`; the inspected local checkout was 23 commits behind when this plan was written.
2. Separate Express app construction from `listen()` and startup side effects.
3. Move migrations and seeding out of API process startup.
4. Define versioned request, response, error, pagination, authentication, SSE, and capability contracts.
5. Replace the URL-only API client with a generated or schema-backed client.
6. Fix the `featured-properties` versus `featured-listings` contract mismatch.
7. Publish versioned `@frontstead/ui`, `@frontstead/tokens`, and API contract packages.
8. Add compatibility tests that build Agent HQ against released public contracts.
9. Extract Agent HQ, admin, marketing, and CGH before removing their original workspaces.
10. Move `x-admin-secret` routes into the private operations repository.
11. Make `/api/agent/*` fail closed behind `AGENT_API_ENABLED=false`.
12. Keep the Agent backend source Apache-licensed and public; only the Agent HQ frontend is commercial.
13. Regenerate root scripts, package metadata, workspace references, and the lockfile.
14. Rewrite README, architecture, database, environment, MLS, and deployment documentation.

**Gate:** The public repository builds without private paths, Agent HQ builds against public contracts, and internal routes are inaccessible.

## Phase 2: Portable Deployment

Docker Compose becomes the canonical deployment contract.

| Service | Requirement |
| --- | --- |
| Portal | Required |
| API | Required initially |
| PostgreSQL | Required |
| MLS worker | Included; dormant when credentials are absent |
| S3-compatible storage | Required for production MLS media |
| Typesense | Optional profile |
| Redis | Optional profile |
| Agent HQ | Separate commercial profile |

Work:

1. Build minimal non-root OCI images.
2. Add explicit migration and portal-provisioning jobs.
3. Add liveness and dependency-aware readiness endpoints.
4. Add restart policies, persistent volumes, resource limits, and secret injection.
5. Add database-level MLS worker locking.
6. Make worker cursors resumable after interruption.
7. Verify Postgres-only behavior when Redis and Typesense are unavailable.
8. Add fresh-clone and Compose smoke tests.
9. Test Postgres failure, worker restart, Typesense loss/recovery, and service version skew.

**Gate:** A fresh clone can configure, migrate, seed, and launch the portal and worker through documented commands.

## Phase 3: Unified Lead Model

Replace the duplicate inquiry paths before building the owner inbox.

### Model

Create one inquiry aggregate supporting:

- Anonymous and authenticated visitors
- An optional listing
- Portal, area, and collection attribution
- Contact preference
- `NEW`, `READ`, `RESPONDED`, and `ARCHIVED` statuses
- Delivery status and retry state
- A linked normalized Contact identity
- Attribution snapshots that survive collection changes

### Identity

- Normalize email casing and phone representation.
- Use an account-scoped identity constraint or identity table to prevent concurrent duplicate creation.
- Treat one normalized email as one lead profile per account initially.
- Keep merge/split workflows in Agent HQ.
- Create the inquiry and contact link in one database transaction.

### Delivery

- Replace fire-and-forget email and CRM bridging with a transactional outbox.
- Add idempotency, retries, dead-letter state, and observable delivery history.
- Escape visitor content before rendering email.
- Preserve successful inquiry capture when email delivery temporarily fails.

### Owner Admin

Add `/admin/leads` inside `apps/portal`:

- Unified inbox
- Source and listing context
- New, Read, Responded, and Archived filters
- Email and phone actions
- Safe, bounded CSV export
- Delivery settings and test inquiry
- Contextual Agent HQ prompts

Every request must verify current database membership, owner role, account scope, and portal scope. Do not rely only on JWT claims.

**Gate:** Transactional contact linking, cross-account isolation, delivery recovery, CSV formula safety, and unified inquiry reconciliation all pass.

## Phase 4: Areas And Collections

Replace the current overloaded `Segment` model with distinct concepts.

### Models

```text
GeographicArea
PropertyAreaMembership
PropertyClassification
ListingCollection
CollectionManualOverride
ClassificationRun
ClassificationOutbox
```

### Geographic Areas

Support:

- City, ZIP, and subdivision groups
- GeoJSON polygons
- Radius definitions
- Composite areas
- Stable slugs and hierarchy

Advanced geometry remains code-managed. Owners select configured areas in admin.

### Property Classifications

Support provider-aware, config-defined tags:

- `golf-front`
- `golf-view`
- `golf-community`
- `near-golf`
- `waterfront`
- `pool`
- Other portal-specific amenities

Each assignment records:

- Stable key
- Property target
- MLS/listing evidence
- Source
- Confidence
- Configuration hash
- Classifier version
- Positive or negative decision
- Manual override protection

### Listing Collections

Collections combine:

- Geographic areas
- Classification tags
- Price
- Bedrooms and bathrooms
- Square footage
- Lot size
- Year built
- Property type
- Manual inclusion and exclusion

Fixed semantics:

- Values within a field are `OR`.
- Different dimensions are `AND`.
- Manual exclusions win.
- Null behavior is explicit.
- Publishing an empty collection requires confirmation.

### Configuration

Typed config defines:

- Provider field mappings
- Classification taxonomy
- Geospatial classifiers
- Golf-course geometry
- Confidence thresholds
- Initial areas
- Initial collections

Runtime behavior:

- Setup creates missing configured records.
- Setup does not overwrite owner edits.
- Force-sync is explicit.
- Export serializes database configuration back to typed config.
- `classify:check`, `classify:diff`, and `classify:apply` validate and reclassify inventory.

### Admin

Add `/admin/areas` and `/admin/collections`:

- Create and edit collections
- Select configured areas and tags
- Apply core property filters
- Preview counts and representative listings
- Explain why each property matched
- Publish, unpublish, and reorder
- Manually include or exclude properties
- Display provider field coverage

### Public Pages

```text
/areas/lake-norman
/collections/lake-norman-golf-homes
/collections/lake-norman-waterfront-homes
```

Inquiry attribution records the active area and collection.

**Gate:** Classification provenance, manual overrides, collection preview, public pages, and inquiry attribution pass against production-shaped fixtures.

## Phase 5: Search And Performance

Build one canonical collection predicate representation and compile it to:

- PostgreSQL
- Optional Typesense

Required behavior:

- Same eligible IDs
- Same counts
- Same pagination
- Same null handling
- Same manual override behavior
- Same MLS and IDX restrictions

Performance work:

- Precompute area memberships and classifications during ingestion.
- Add indexes for eligibility, memberships, tags, overrides, and inbox status/date.
- Use keyset pagination for inboxes, previews, exports, and classification runs.
- Process reclassification in resumable batches.
- Use durable search indexing outbox events.
- Reconcile stale or failed Typesense documents periodically.
- Run `EXPLAIN ANALYZE` against production-scale fixtures.

**Gate:** Postgres and Typesense differential tests pass, and stale search indexes cannot expose ineligible listings.

## Phase 6: Agent HQ Productization

1. Make Agent HQ a standalone Next repository.
2. Consume pinned public UI, token, and API contract packages.
3. Add independent Docker and CI configuration.
4. Add auth/proxy, cookie, contract, and dashboard E2E tests.
5. Replace JWT-in-query OAuth callbacks with one-time codes.
6. Align cookie and JWT expiry or implement refresh.
7. Add API capability negotiation.
8. Preserve historical leads and collection attribution.
9. Add the commercial license, white-label guidance, update policy, and customer onboarding.
10. Use contextual links from the portal inbox to Agent HQ workflows.

**Gate:** A licensed customer can deploy Agent HQ against a released Frontstead Kit version without repository-relative dependencies.

## Phase 7: Next.js-Native Portal

This begins only after the clean release and transport-neutral contracts exist.

1. Extract portal domain operations from Express and Prisma-aware route handlers.
2. Add thin Next Route Handlers for consumer auth, listings, inquiries, favorites, owner inbox, areas, and collections.
3. Let server components call domain operations directly where an HTTP contract is unnecessary.
4. Retain Express as the optional Agent HQ and external API adapter.
5. Run the same contract suite against Express and Next adapters.
6. Move all startup jobs, long-running work, and ingestion out of web request processes.
7. Support Vercel for the portal without presenting the full MLS stack as Vercel-only.

**Gate:** The portal runs as one Next web deployment plus PostgreSQL; MLS remains the included portable worker.

## Test Map

```text
MLS fixture
  `- provider mapping [unit]
      `- persistence [integration]
          `- classifier [unit + property fixtures]
              `- memberships/tags [integration]
                  `- collection predicate
                      |- Postgres [integration]
                      `- Typesense [differential]
                          `- public page [E2E]
                              `- inquiry [integration]
                                  `- contact/outbox [crash recovery]
                                      |- owner inbox [E2E + IDOR]
                                      `- Agent HQ [contract + E2E]
```

Critical suites:

- Sanitized fresh-clone scan
- Agent/internal routes disabled by default
- Provider mapping coverage
- MLS worker overlap and crash recovery
- Inquiry transaction and delivery recovery
- Contact deduplication under concurrency
- Owner authorization and cross-account IDOR
- CSV formula injection
- Area membership fixtures
- Classification provenance and overrides
- Postgres/Typesense differential behavior
- IDX fail-closed behavior
- Compose outage and restart tests
- Agent HQ compatibility
- Express/Next adapter conformance

## Parallelization

| Lane | Work | Dependency |
| --- | --- | --- |
| A | Security, licensing, sanitized history | None |
| B | API contracts and Express app factory | Current source |
| C | Private repository extraction | A and contract baseline |
| D | Compose and deployment hardening | B |
| E | Unified inquiries and owner inbox | B |
| F | Areas, classifications, collections | B and normalized MLS mapping |
| G | Agent HQ productization | B, C, E |
| H | Next transport migration | B, D, E, F |

Lanes D and E can proceed after B. Lane F can run alongside E once the database contract is stable. Lane H remains last.

## Explicit Deferrals

- Hosted multi-provider installer
- Managed Agent HQ SaaS
- Runtime commercial license server
- Full-stack Vercel-only deployment
- Browser-based GeoJSON editing
- Arbitrary nested boolean collection builder
- PostGIS as a mandatory dependency
- Support for every MLS field and provider at launch
- Multi-tenant centralized Frontstead SaaS
- Advanced contact merge/split UI in the free portal admin

## Stop Conditions

Pause implementation if:

- Any current production deployment or irreplaceable database is discovered.
- Agent HQ cannot compile against the extracted public contract.
- MLS licensing forbids included fixtures or field mappings.
- Postgres and Typesense cannot produce equivalent eligibility.
- A provider lacks sufficient data to substantiate a public classification claim.
- Sanitized history still contains credentials or malicious artifacts.

If production data is discovered, replace direct schema cleanup with additive migrations, backfills, dual-read comparison, and rollback rehearsal.

## Release Sequence

1. **Clean Core:** Sanitized history, extracted workspaces, Apache license, Postgres-only Compose, and existing portal behavior.
2. **Lead Operations:** Unified inquiries, durable delivery, and owner inbox.
3. **Niche Portal Engine:** Areas, classifications, listing collections, and provider-aware config.
4. **Commercial Add-on:** Standalone Agent HQ.
5. **Next Portal:** One Next web deployment with an optional Express adapter.

## Review Status

The roadmap has no unresolved product decisions. Security rotation/history sanitization and confirmation that no production data depends on the current schema are hard prerequisites before implementation.
