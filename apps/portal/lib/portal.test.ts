import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPortalSlug, getPortalStatus, PortalUnavailableError, resetPortalSlugForTests } from "./portal";

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe("portal slug lookup", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetPortalSlugForTests();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("asks the API for the current portal and caches the slug", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { slug: "smith-realty", isActive: true }));
    expect(await getPortalSlug()).toBe("smith-realty");
    expect(await getPortalSlug()).toBe("smith-realty");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/portals\/current$/);
  });

  it("throws, logs once, and retries on the next call until the portal resolves", async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { error: "Portal not found" }));
    await expect(getPortalSlug()).rejects.toBeInstanceOf(PortalUnavailableError);
    await expect(getPortalSlug()).rejects.toThrow(/no active portal[\s\S]*docs\/COMPOSE\.md#going-live/);
    expect(errorSpy).toHaveBeenCalledOnce();

    fetchMock.mockResolvedValue(jsonResponse(200, { slug: "smith-realty" }));
    expect(await getPortalSlug()).toBe("smith-realty");
  });

  it("reports why the portal is unavailable", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    expect(await getPortalStatus()).toEqual({ ok: false, reason: expect.stringMatching(/unreachable/) });
    fetchMock.mockResolvedValueOnce(jsonResponse(500, {}));
    expect(await getPortalStatus()).toEqual({ ok: false, reason: "GET /api/portals/current returned 500" });
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { suspended: true, slug: "smith-realty" }));
    expect(await getPortalStatus()).toEqual({ ok: true, slug: "smith-realty", suspended: true });
  });
});
