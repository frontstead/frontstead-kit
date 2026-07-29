# MLS Grid (Canopy) — IDX/VOW Compliance Gate

> **🚫 BLOCKING (decision D19):** Do NOT let any **public** portal render a synced MLS
> listing until the items in **"Confirm before public launch"** are signed off against
> Canopy MLS's actual IDX/VOW data-display agreement. Syncing to staging / the DB is
> fine; public display is gated. This protects the data feed (a violation can get it
> revoked) and limits legal exposure.

## Plumbing in place (code)

| Requirement | Status | Where |
|---|---|---|
| Honor internet-display opt-out — don't surface opted-out listings | ✅ enforced | `idxDisplayable` set at ingest from `InternetEntireListingDisplayYN`; non-displayable listings are kept in the DB but excluded from the public Typesense index (`apps/mls-service/src/sync/persistence.ts`, `mappers.isIdxDisplayable`) |
| Never expose the raw RESO record publicly | ✅ verified | `rawData` lives on `Listing`; the public property endpoint includes `media` only (not `listings`), and the search feed uses `toPropertyDoc` which omits `rawData` |
| Display de-prefixed MLS ids, store the prefixed key | ✅ | `mlsId` de-prefixed; `listingKey` prefixed (D17) |
| Remove sold/withdrawn listings promptly | ✅ | `MlgCanView=false` → mark removed + drop from index, within the 7-day feed window (D5) |
| Capture brokerage/agent attribution data | ✅ | `Listing.brokerageName` / `brokeragePhone` / `listingAgentName` populated at ingest |
| No hotlinking of MLS Grid media | ✅ | photos downloaded to S3 with the OAuth token in `User-Agent`, served from our storage (D7) |

## Confirm before public launch (the gate — owner: legal / Canopy agreement)

- [ ] **Exact display rule.** Confirm `InternetEntireListingDisplayYN` is the authoritative
      opt-out flag for Canopy, and whether a board opt-in (`IDXOptInYN`) or a VOW-vs-IDX
      distinction also applies. Adjust `isIdxDisplayable` accordingly.
- [ ] **Required disclaimer text + placement** on portal listing feed and detail pages
      (e.g. "Listing data provided courtesy of Canopy MLS…"). Portal-UI work.
- [ ] **Brokerage attribution rendering** — the "courtesy of {brokerageName}" line on every
      public listing card/detail (data is already captured). Portal-UI work (TODOS: white-label chunk 3).
- [ ] **Address display opt-out** — if Canopy uses `InternetAddressDisplayYN=false`, the
      address must be hidden for those listings. Not yet enforced; add if used.
- [ ] **Forbidden/display-restricted fields** — confirm which RESO fields must NOT be shown
      publicly and that none leak through the feed/detail responses.
- [ ] **Photo usage & retention** rules (display limits, removal on listing expiry).
- [ ] **Staging exposure** — confirm Canopy permits non-prod replication and that staging
      data is not publicly reachable (Codex #4).

## Operational controls (T15)

- **`MLS_PUBLIC_DISPLAY_ENABLED`** (default **off** — fail-closed): the gate above is
  enforced in code. No synced listing is indexed into the public search / portal feed
  until this is `true`. Flip it on **only after every box above is checked**. Setting it
  back to `false` pulls all synced listings from public view on the next sync cycle.
- **`MLS_SYNC_ENABLED`** (default on): set to `false` to stop the sync entirely
  (kill-switch) without a redeploy.
- **Staging:** keep `MLS_PUBLIC_DISPLAY_ENABLED` unset/false in staging so replicated MLS
  data is never publicly reachable.

So a fresh deploy with credentials syncs MLS data into the database but shows **nothing**
publicly until someone with the IDX/VOW sign-off explicitly enables display.
