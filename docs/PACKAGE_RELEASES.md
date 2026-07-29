# Shared Package Releases

Frontstead Kit is the source of truth for these Apache-2.0 npm packages:

- `@frontstead/tokens`
- `@frontstead/ui`
- `@frontstead/api-client`

## Release Gate

```bash
npm ci
npm run release:check
```

The release gate runs package tests and typechecks, creates compiled ESM and
declaration output, and rejects tarballs containing source, source maps,
TypeScript build metadata, or files outside each package allowlist.

## Registry Setup

Before the first release:

1. Create or verify ownership of the `frontstead` npm organization.
2. Require two-factor authentication for organization members and package changes.
3. Restrict maintainers to the minimum necessary set.
4. Protect the GitHub `npm` environment with required review.
5. Bootstrap each package once with a short-lived granular npm token and provenance.
6. Configure npm trusted publishing for `.github/workflows/publish-packages.yml`.
7. Delete the bootstrap token before using the workflow again.

Subsequent releases use GitHub OIDC trusted publishing. Do not add a long-lived
`NPM_TOKEN` to the workflow.

## Versioning

Update package versions deliberately and keep `@frontstead/ui`'s dependency on
`@frontstead/tokens` within a tested semver range. Publish tokens before UI.
Published versions are immutable; fix mistakes with a new patch version rather
than replacing an existing artifact.
