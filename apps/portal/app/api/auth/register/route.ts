import { NextRequest, NextResponse } from "next/server";
import { resolveServerApiBaseUrl } from "@frontstead/api-client";
import { buildProxyHeaders } from "@/lib/proxy-headers";
import { establishSessionResponse } from "@/lib/establish-session";
import { getPortalSlug } from "@/lib/portal";

const API_BASE = resolveServerApiBaseUrl(process.env);

/** Server-side register proxy. Mirrors /api/auth/login/route.ts. */
export async function POST(request: NextRequest) {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let slug: string;
  try {
    slug = await getPortalSlug();
  } catch {
    return NextResponse.json({ error: "Sign-up is unavailable right now. Please try again shortly." }, { status: 503 });
  }

  const res = await fetch(`${API_BASE}/api/portals/${slug}/auth/register`, {
    method: "POST",
    headers: buildProxyHeaders(request.headers),
    body,
  });

  return establishSessionResponse(res);
}
