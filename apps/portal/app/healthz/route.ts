import { NextResponse } from "next/server";

// Liveness probe for load balancers (e.g. an AWS ALB target group). It checks
// only that this Next.js server is answering — not the API — so an API outage
// doesn't cause the balancer to pull every portal task. Lives outside /api so
// the /api/:path* rewrite to the backend never sees it.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
