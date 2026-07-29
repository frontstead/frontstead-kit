# Contributing to Frontstead Kit

Frontstead Kit is an open-source, self-hostable real estate portal and CRM. Bug fixes, focused features, documentation, accessibility improvements, and tests are welcome.

## Before You Start

- Search existing issues and pull requests before opening a new one.
- Open an issue before substantial changes so scope and approach can be agreed on.
- Never include customer data, MLS credentials or data, API keys, or other secrets in an issue, test, fixture, or commit.
- Keep changes focused. Avoid unrelated formatting or dependency updates.

## Local Development

Use Node.js 22.12.x and npm.

```bash
npm install
npm run db:migrate
npm run db:seed:portal
npm run dev:portal
```

Frontstead uses npm workspaces. Run the narrowest relevant checks before submitting, for example:

```bash
npm run typecheck:portal
npm run test --workspace=api -- <test-file-or-filter>
```

For changes spanning the repository, run `npm run typecheck`, `npm run lint`, and the relevant workspace tests. Database changes must include a migration and must not depend on private production data.

## Pull Requests

- Explain the user problem and the chosen solution.
- Link the relevant issue.
- Include screenshots for visible UI changes.
- Document configuration, schema, API, or deployment changes.
- Add or update tests for changed behavior.
- Confirm that your contribution is yours to submit under the Apache License 2.0.

By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).
