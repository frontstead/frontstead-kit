# Configuring your MLS board

This toolkit syncs real MLS listings through a **RESO Web API** connector —
the NAR-mandated data standard implemented by MLS Grid, Trestle
(CoreLogic/Cotality), Bridge Interactive, Spark API, and most modern MLS
data vendors. It is not tied to any one of them. Configuring your own board
touches three places: two separate backend services' environment variables,
and one committed TypeScript file. This doc walks through all three, in
order.

## 1. Get vendor credentials and confirm your board

Contact your MLS (or the vendor they use for RESO Web API access) and get:
credentials, a base URL, and confirmation of which board/dataset you're
licensed for.

Reference — **verify against your own vendor contract, this is not a
substitute for it**:

| Vendor | Auth | Typical board-scope filter | Notes |
|---|---|---|---|
| MLS Grid | Static bearer token (no expiry) | `OriginatingSystemName` | Requires `Accept-Encoding: gzip`; forbids hotlinking media (must download + re-host) |
| Trestle (CoreLogic/Cotality) | OAuth2 client-credentials | Often none — credential implies scope | Tokens expire ~8h, refreshed automatically |
| Bridge Interactive | Client ID/secret ("server token") | Varies by dataset | |
| Spark API (FBS) | OAuth2 client-credentials | Varies | Exposes RESO Web API at `/Reso/OData` |

## 2. Determine auth type and whether your board prefixes IDs

Decide: `static` (one long-lived token) or `oauth2_client_credentials`
(client id/secret). Once you have credentials, run the read-only diagnostic
from `apps/mls-service`:

```bash
npm run sample-pull --workspace=@frontstead/mls-service
```

It reports a guessed ID prefix (e.g. MLS Grid's ACTRIS boards use `ACT`),
field completeness, and the distinct listing-status values your board uses.

## 3. Configure `apps/mls-service`

Copy `apps/mls-service/.env.example` to `.env` and fill in:

- `MLS_AUTH_TYPE`, `MLS_BASE_URL`, and the credentials for your auth type
  (`MLS_ACCESS_TOKEN` for static; `MLS_OAUTH_TOKEN_URL`/`MLS_OAUTH_CLIENT_ID`/
  `MLS_OAUTH_CLIENT_SECRET` for OAuth2)
- `MLS_BOARD_ID` — required, no default
- `MLS_BOARD_SCOPE_FIELD`/`MLS_BOARD_SCOPE_VALUE` — only if your vendor needs
  an explicit filter to narrow to your board (see the table above)
- `MLS_PREFIX` — if `sample-pull` found one

## 4. Configure `apps/api` — the same board identity, again

`apps/api` runs agent MLS-membership verification independently of
mls-service — a **separate deployable service with its own environment**.
Set the identical values in `apps/api`'s env (see `apps/api/.env.example`):

```
MLS_BOARD_ID=<same value as mls-service>
MLS_PREFIX=<same value as mls-service, if any>
MLS_PROVIDER_ID=<same value as mls-service, if you set one>
```

This is a real two-places-to-configure reality, not just a naming
inconsistency — the two services don't share environment, so there's no way
around setting it twice. Get it wrong and agent onboarding (`POST
/api/agent/mls/verify`) will either 500 (if `MLS_BOARD_ID` is missing) or
silently fail to match a real agent (if the two values differ).

## 5. Register your board's compliance policy

IDX/VOW display rules (attribution requirements, disclaimer text) are set by
your MLS's data license agreement and genuinely differ board to board — this
toolkit does not guess at them. Add an entry to
`packages/portal-config/src/mlsBoardPolicy.ts`'s `MLS_BOARD_POLICIES`,
using the existing Canopy MLS entry as a template. This is a committed
TypeScript file you fork and edit, not an env var — same idiom as
`portal.config.ts`.

An unregistered board fails loud (at config-load time, and again anywhere
`getMlsBoardPolicy()` is called for compliance gating) rather than silently
defaulting to "no attribution required" — a wrong guess here is a real
compliance violation, not just a display bug.

## 6. Update your portal's board scope

In `packages/portal-config/src/portal.config.ts`, set `listings.boardIds` to
your board's `MLS_BOARD_ID` value.

## 7. Deploy and verify

Start `apps/mls-service`. Check the logs:

- No `MLS_AUTH_TYPE` set → idle warning, sync disabled (expected if you
  haven't configured a vendor yet).
- Credentials set but `MLS_BOARD_ID` missing → hard startup error, non-zero
  exit. Fix the env and redeploy.
- Otherwise → normal sync metrics logged per run.

## 8. Verify agent onboarding

Submit a real MLS ID through `POST /api/agent/mls/verify` and confirm it
resolves to `verified` against your board's synced roster.

## 9. Before enabling public display

Public listing display is off by default (`MLS_PUBLIC_DISPLAY_ENABLED=false`).
Work through the compliance sign-off checklist in
[docs/mls-compliance.md](./mls-compliance.md) before flipping it on.
