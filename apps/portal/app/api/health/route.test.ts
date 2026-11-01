import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPortalStatus } = vi.hoisted(() => ({ getPortalStatus: vi.fn() }));
vi.mock("@/lib/portal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/portal")>()),
  getPortalStatus,
}));

const { GET } = await import("./route");

describe("GET /api/health", () => {
  beforeEach(() => getPortalStatus.mockReset());

  it("is healthy when the API serves this deployment's portal", async () => {
    getPortalStatus.mockResolvedValue({ ok: true, slug: "smith-realty", suspended: false });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, slug: "smith-realty", suspended: false });
  });

  it("stays healthy for a suspended portal", async () => {
    getPortalStatus.mockResolvedValue({ ok: true, slug: "smith-realty", suspended: true });
    expect((await GET()).status).toBe(200);
  });

  it("returns 503 with the reason and the fix when the portal is unavailable", async () => {
    getPortalStatus.mockResolvedValue({ ok: false, reason: "the API has no active portal for the slug in portal.config.ts (missing or inactive)" });
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/^Portal not available: the API has no active portal[\s\S]*ensurePortal \(docs\/COMPOSE\.md#going-live\)\.$/);
  });
});
