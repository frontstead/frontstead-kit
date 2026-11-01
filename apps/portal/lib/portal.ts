import { resolveServerApiBaseUrl } from "@frontstead/api-client";

// This deployment's portal slug comes from the API (GET /api/portals/current),
// which compiles it in from packages/portal-config/src/portal.config.ts. That
// config is the only place the slug is set; the API's migrate step creates
// the matching Portal row (packages/db/scripts/ensurePortal.ts).
//
//   getPortalStatus()  fresh lookup, never throws; the health route uses it
//   getPortalSlug()    cached after the first success; throws
//                      PortalUnavailableError (and logs once) until it resolves

export const GOING_LIVE_DOCS = "docs/COMPOSE.md#going-live";

export type PortalStatus =
  | { ok: true; slug: string; suspended: boolean }
  | { ok: false; reason: string };

export class PortalUnavailableError extends Error {
  constructor(public readonly reason: string) {
    super(portalUnavailableMessage(reason));
    this.name = "PortalUnavailableError";
  }
}

export function portalUnavailableMessage(reason: string): string {
  return `Portal not available: ${reason}. Check the API's migrate log for ensurePortal (${GOING_LIVE_DOCS}).`;
}

let cachedSlug: string | null = null;
let reported = false;

// Logs the first time per process, so a broken deployment says why without
// flooding the log on every request.
export function reportPortalUnavailable(reason: string): void {
  if (reported) return;
  reported = true;
  console.error(portalUnavailableMessage(reason));
}

export async function getPortalStatus(): Promise<PortalStatus> {
  const apiBase = resolveServerApiBaseUrl(process.env);
  let res: Response;
  try {
    res = await fetch(`${apiBase}/api/portals/current`, { cache: "no-store" });
  } catch {
    return { ok: false, reason: `the API is unreachable at ${apiBase}` };
  }
  if (res.status === 404) {
    return { ok: false, reason: "the API has no active portal for the slug in portal.config.ts (missing or inactive)" };
  }
  if (!res.ok) return { ok: false, reason: `GET /api/portals/current returned ${res.status}` };

  const body = (await res.json().catch(() => null)) as { slug?: unknown; suspended?: unknown } | null;
  if (!body || typeof body.slug !== "string") {
    return { ok: false, reason: "GET /api/portals/current returned no slug" };
  }
  return { ok: true, slug: body.slug, suspended: body.suspended === true };
}

export async function getPortalSlug(): Promise<string> {
  if (cachedSlug) return cachedSlug;
  const status = await getPortalStatus();
  if (status.ok === false) {
    reportPortalUnavailable(status.reason);
    throw new PortalUnavailableError(status.reason);
  }
  cachedSlug = status.slug;
  return cachedSlug;
}

export function resetPortalSlugForTests(): void {
  cachedSlug = null;
  reported = false;
}
