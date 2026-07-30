# Changelog

All notable public changes to Frontstead Kit are documented here.

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
