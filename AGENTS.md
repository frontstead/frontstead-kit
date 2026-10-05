# Frontstead Agent Notes

The agent guidance for this repo lives in [`CLAUDE.md`](./CLAUDE.md) — read it before making
changes. It is the single source: setup and commands, architecture, the non-negotiable safety
rails (fail-closed Agent API, gated MLS public display, guarded demo seeds, no committed
secrets), the information boundary for this public core, and the release process.

This file exists so tools that look for `AGENTS.md` by convention find their way there. Do not
add rules here — they would drift out of sync. Edit `CLAUDE.md` instead.
