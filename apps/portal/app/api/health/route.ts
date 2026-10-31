import { NextResponse } from "next/server";
import { getPortalStatus, portalUnavailableMessage } from "@/lib/portal";

// Container healthcheck: healthy only when the API serves this deployment's
// portal. A missing or inactive portal (or an unreachable API) is a 503 that
// says why, so a deploy fails instead of shipping an empty site. A suspended
// portal is a deliberate admin state, so it stays healthy.
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getPortalStatus();
  if (status.ok === false) {
    return NextResponse.json({ ok: false, error: portalUnavailableMessage(status.reason) }, { status: 503 });
  }
  return NextResponse.json({ ok: true, slug: status.slug, suspended: status.suspended });
}
