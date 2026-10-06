// Run one /api/cron/* job in-process, for schedulers that start a one-off
// container (ECS scheduled tasks, Kubernetes CronJobs) instead of calling a
// running API over HTTP. It mounts the real Express app on an ephemeral
// loopback port and POSTs to the job with CRON_SECRET, so the job code and its
// auth check are exactly the ones the HTTP endpoint uses.
//
// Usage:
//   npm run cron --workspace=api -- <job> ['<json body>']
//   node --import tsx scripts/run-cron.ts saved-search-alerts
//
// Exit codes: 0 on a 2xx response, 1 otherwise.

import type { AddressInfo } from 'node:net';
import { prisma } from 'db';
import { createApp } from '../src/server.js';

const [job, rawBody] = process.argv.slice(2);

if (!job || !/^[a-z0-9-]+$/.test(job)) {
  console.error('Usage: run-cron.ts <job> [json-body]   e.g. saved-search-alerts');
  process.exit(1);
}
if (!process.env.CRON_SECRET) {
  console.error('CRON_SECRET must be set');
  process.exit(1);
}

const server = createApp().listen(0, '127.0.0.1');
await new Promise<void>((resolve) => server.once('listening', () => resolve()));
const { port } = server.address() as AddressInfo;

let ok = false;
try {
  const res = await fetch(`http://127.0.0.1:${port}/api/cron/${job}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: rawBody ?? '{}',
  });
  const text = await res.text();
  console.log(JSON.stringify({ job, status: res.status, body: text }));
  ok = res.ok;
} catch (error) {
  console.error(JSON.stringify({ job, error: error instanceof Error ? error.message : String(error) }));
} finally {
  server.close();
  await prisma.$disconnect();
}

process.exit(ok ? 0 : 1);
