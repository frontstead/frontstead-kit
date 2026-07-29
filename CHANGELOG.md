# Changelog

All notable public changes to Frontstead Kit are documented here.

## Unreleased

### Added
- Publishable `@frontstead/tokens`, `@frontstead/ui`, and `@frontstead/api-client` packages with compiled ESM, declaration files, explicit export maps, strict tarball allowlists, and Apache-2.0 legal notices.
- Shared Popover, NativeSelect, FormMessage, and Button loading-state primitives.
- Package tests, external tarball-consumer verification, and a manually gated npm trusted-publishing workflow with provenance.
- A public UI roadmap for primitives that need a stronger reuse contract before promotion.

### Changed
- Branding assets now belong to applications rather than the generic UI package.
- Tailwind class discovery is explicitly configured by each consuming application instead of coupling the token package to UI source paths.
- Portal production and test servers now run the generated Next.js standalone artifact directly.

### Security
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
