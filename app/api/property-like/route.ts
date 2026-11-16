import { NextResponse } from "next/server"

/**
 * Disabled legacy property-like API (pre-MVP swipe experience).
 * An obsolete property-like endpoint accepted arbitrary tenant and property IDs and inserted using the service-role key.
 * New VERLO matching and interest flows must not use this route.
 * Do not re-enable without verified actor ownership and proper authorization.
 */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "LEGACY_ENDPOINT_DISABLED" },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  )
}
