# Public Roadmap

Frontstead Kit uses [GitHub Issues](https://github.com/frontstead/frontstead-kit/issues)
for actionable work and accepts community contributions through pull requests.

The roadmap is intentionally outcome-oriented. It does not duplicate an unchecked
task list in the repository.

## Current Themes

- Expand accessible, brand-neutral primitives in `@frontstead/ui`.
- Keep package releases reproducible and easy to consume outside the monorepo.
- Improve portable deployment, health checks, and operator documentation.
- Strengthen API contracts for compatible external clients.
- Add MLS provider coverage without weakening display or account boundaries.

Shared packages promote abstractions only after two independent consumers prove
the reuse boundary. For example, charting remains application-owned until a
second public consumer adopts the same underlying chart contract.

See the
[open issues](https://github.com/frontstead/frontstead-kit/issues?q=is%3Aissue+is%3Aopen)
for scoped work that is ready for discussion or contribution. An issue should
describe the user-visible outcome, constraints, and acceptance criteria before
implementation starts.

## Planning Policy

- Public work is tracked as GitHub Issues, not repository TODO files.
- Durable architecture decisions belong in public documentation or ADRs.
- Temporary implementation plans, reviews, and customer-specific context are
  maintained outside this public repository.
- When a plan ships, update current-state documentation and the changelog; do not
  publish the planning transcript as product documentation.
