import { resolveServerApiBaseUrl } from "@frontstead/api-client";

// The names a visitor reads (page titles, header, footer, legal copy) come from
// this deployment's Portal row, through GET /api/portals/current. The row is
// created from portal.config.ts on migrate and is the owner's to edit after
// that, so no page hard-codes a brokerage name.
//
// Cached in memory for a minute so a page render costs no extra round trip,
// while an owner's edit shows up quickly. If the API can't answer, the last
// good brand is kept; before the first success it falls back to neutral words.
// A missing portal is the health route's job to fail loudly, not this one's.

export type PortalBrand = {
  // Display name: titles, header, wordmark alt text.
  name: string;
  // Legal brokerage name: licensing and copyright lines.
  brokerageName: string;
  brokeragePhone: string | null;
  // Portal.agentEmail, where inquiry alerts go.
  email: string | null;
  // Display names of the MLS boards the portal's config lists; empty until
  // one is configured, so pages don't name a board that isn't there.
  mlsBoards: string[];
};

export const FALLBACK_BRAND: PortalBrand = {
  name: "Real Estate",
  brokerageName: "This brokerage",
  brokeragePhone: null,
  email: null,
  mlsBoards: [],
};

const TTL_MS = 60_000;

let cached: { brand: PortalBrand; at: number } | null = null;
let inflight: Promise<PortalBrand> | null = null;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function fetchBrand(): Promise<PortalBrand | null> {
  try {
    const res = await fetch(`${resolveServerApiBaseUrl(process.env)}/api/portals/current`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    // A suspended portal answers with only { suspended, slug }.
    const name = text(body?.name);
    if (!name) return null;
    return {
      name,
      brokerageName: text(body?.brokerageName) ?? name,
      brokeragePhone: text(body?.brokeragePhone),
      email: text(body?.agentEmail),
      mlsBoards: Array.isArray(body?.mlsBoards)
        ? body.mlsBoards.map((board) => text((board as { name?: unknown })?.name)).filter((name): name is string => name !== null)
        : [],
    };
  } catch {
    return null;
  }
}

export async function getPortalBrand(now: () => number = Date.now): Promise<PortalBrand> {
  if (cached && now() - cached.at < TTL_MS) return cached.brand;
  inflight ??= fetchBrand().then((brand) => {
    inflight = null;
    if (brand) cached = { brand, at: now() };
    return brand ?? cached?.brand ?? FALLBACK_BRAND;
  });
  return inflight;
}

export function resetPortalBrandForTests(): void {
  cached = null;
  inflight = null;
}
