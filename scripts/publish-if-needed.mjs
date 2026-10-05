#!/usr/bin/env node
// Publish one workspace package, but only when that exact version is not
// already on the registry.
//
// Published versions are immutable, so `npm publish` over an existing version
// fails. With three unguarded publish steps in a row, a release where only one
// package changed would die on the first already-published package and never
// reach the one that actually needed publishing. Skipping instead makes the
// workflow idempotent and safe to re-run after a partial failure.

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const packageDir = process.argv[2];

if (!packageDir) {
  console.error("usage: publish-if-needed.mjs <package-dir>");
  process.exit(1);
}

const manifestPath = resolve(packageDir, "package.json");
const { name, version } = JSON.parse(readFileSync(manifestPath, "utf8"));

if (!name || !version) {
  console.error(`${manifestPath} is missing a name or version.`);
  process.exit(1);
}

// `npm view <pkg>@<exact> version` prints the version when it exists and exits
// non-zero when it does not. A registry or auth failure also exits non-zero, so
// distinguish "absent" from "could not tell" rather than publishing blindly.
const view = spawnSync("npm", ["view", `${name}@${version}`, "version"], {
  encoding: "utf8",
});

if (view.status === 0 && view.stdout.trim()) {
  console.log(`${name}@${version} is already on the registry - skipping.`);
  process.exit(0);
}

const stderr = view.stderr ?? "";
const isAbsent = /E404|is not in this registry|No match found/i.test(stderr);

if (view.status !== 0 && !isAbsent) {
  console.error(`Could not determine whether ${name}@${version} is published.`);
  console.error(stderr.trim());
  process.exit(1);
}

console.log(`Publishing ${name}@${version}...`);
execFileSync(
  "npm",
  ["publish", "--workspace", name, "--access", "public", "--provenance"],
  { stdio: "inherit" },
);
