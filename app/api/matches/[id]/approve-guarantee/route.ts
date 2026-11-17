import { NextResponse } from "next/server"

/**
 * Disabled obsolete pre-VERLO-MVP guarantee approval endpoint.
 * This route previously wrote match_guarantee_reviews with service-role access
 * without checking the caller's identity or authorization.
 * Current PowerMarket decisions use the authenticated caucion_applications flow.
 * Do not restore without explicit ownership and partner authorization checks.
 */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "LEGACY_ENDPOINT_DISABLED" },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  )
}
