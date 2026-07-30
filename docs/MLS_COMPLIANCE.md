# MLS Public Display Compliance

Frontstead Kit provides technical controls for handling MLS data, but each MLS
board and data agreement defines its own display, attribution, retention, and
security requirements. This document is an implementation framework, not legal
advice or approval to publish listing data.

## Safe Default

Keep both `MLS_SYNC_ENABLED=false` and `MLS_PUBLIC_DISPLAY_ENABLED=false` until
the operator has reviewed the current agreement and verified every public read
path for each enabled board.

Compose and the checked-in worker environment example use these values. Direct
process deployments must set and verify the effective values explicitly.

## Enforcement Boundary

`MLS_PUBLIC_DISPLAY_ENABLED` must have the same effective value in the API and
MLS worker. The API applies it to public PostgreSQL listing predicates,
Typesense filters and scoped keys, property details, media, suggestions,
collections, featured listings, and portal readiness. The worker applies it to
media processing and property-document reconciliation.

Existing `Property.media` rows do not carry listing provenance. While MLS display
is disabled, public responses suppress shared property media conservatively;
eligible non-MLS `Listing.imageUrl` values remain available.

Changing the environment flag does not rewrite documents already stored in
Typesense. Run the exact property reindex after every policy transition or schema
upgrade before restoring public traffic.

## Required Review

Before public launch, confirm and document:

- authoritative display opt-in and opt-out fields;
- IDX versus VOW eligibility differences;
- required disclaimer and attribution text and placement;
- address-display restrictions;
- fields that must not be exposed publicly;
- media display, copying, retention, and removal rules;
- sold, withdrawn, expired, and deleted listing timelines;
- staging and non-production replication restrictions;
- refresh frequency and outage obligations;
- reviewer, agreement version, evidence, and approval date.

Store board-specific agreements, legal review, and sign-off evidence outside the
public repository.

## Technical Controls

Provider adapters should map board rules into normalized eligibility fields. The
public API and search paths must enforce eligibility independently of UI behavior.
Raw provider records must never be returned by public endpoints.

At minimum, verify:

- non-displayable listings remain excluded from public PostgreSQL and Typesense
  results;
- manual inclusion cannot bypass MLS or account eligibility;
- removing public-display permission withdraws affected documents;
- required attribution fields are present before rendering;
- media storage and deletion follow the approved policy;
- logs and errors do not expose credentials or restricted raw records.

## Operations

- `MLS_SYNC_ENABLED=false` stops new worker ingestion; it does not hide data
  already stored or indexed.
- `MLS_PUBLIC_DISPLAY_ENABLED=false` excludes MLS-sourced listings from API and
  search results while preserving eligible non-MLS listings.
- Run `POST /api/search/reindex/properties` after changing the flag so stale
  Typesense documents are removed.
- Disable public traffic during a policy transition until PostgreSQL and
  Typesense verification passes.
- Re-run the display verification suite after provider mapping or agreement
  changes.

See [MLS_BOARD_SETUP.md](./MLS_BOARD_SETUP.md) for configuration and launch steps.
