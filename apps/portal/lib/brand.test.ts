import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_BRAND, getPortalBrand, resetPortalBrandForTests } from "./brand";

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

const smith = {
  slug: "smith-realty",
  name: "Smith Realty",
  brokerageName: "Smith Realty LLC",
  brokeragePhone: "(704) 555-0199",
  agentEmail: "leads@smithrealty.com",
  mlsBoards: [{ id: "CanopyMLS", name: "Canopy MLS" }],
};

describe("portal brand", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let clock = 0;
  const now = () => clock;

  beforeEach(() => {
    resetPortalBrandForTests();
    clock = 1_000_000;
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("reads the brand from the current portal", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, smith));
    expect(await getPortalBrand(now)).toEqual({
      name: "Smith Realty",
      brokerageName: "Smith Realty LLC",
      brokeragePhone: "(704) 555-0199",
      email: "leads@smithrealty.com",
      mlsBoards: ["Canopy MLS"],
    });
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/portals\/current$/);
  });

  it("caches for a minute, then picks up an owner's edit", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, smith));
    await getPortalBrand(now);
    clock += 30_000;
    await getPortalBrand(now);
    expect(fetchMock).toHaveBeenCalledOnce();

    fetchMock.mockResolvedValue(jsonResponse(200, { ...smith, name: "Smith Homes" }));
    clock += 31_000;
    expect((await getPortalBrand(now)).name).toBe("Smith Homes");
  });

  it("shares one request between concurrent renders", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, smith));
    await Promise.all([getPortalBrand(now), getPortalBrand(now), getPortalBrand(now)]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("keeps the last good brand when the API stops answering", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, smith));
    await getPortalBrand(now);
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    clock += 61_000;
    expect((await getPortalBrand(now)).name).toBe("Smith Realty");
  });

  it("falls back to neutral words before the first success, and retries", async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { error: "Portal not found" }));
    expect(await getPortalBrand(now)).toEqual(FALLBACK_BRAND);
    fetchMock.mockResolvedValue(jsonResponse(200, { suspended: true, slug: "smith-realty" }));
    expect(await getPortalBrand(now)).toEqual(FALLBACK_BRAND);
    fetchMock.mockResolvedValue(jsonResponse(200, smith));
    expect((await getPortalBrand(now)).name).toBe("Smith Realty");
  });

  it("uses the display name when the brokerage name is blank", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ...smith, brokerageName: " ", brokeragePhone: null, agentEmail: null, mlsBoards: undefined }));
    expect(await getPortalBrand(now)).toEqual({ name: "Smith Realty", brokerageName: "Smith Realty", brokeragePhone: null, email: null, mlsBoards: [] });
  });
});
