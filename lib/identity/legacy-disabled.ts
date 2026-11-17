import "server-only"
import { NextResponse } from "next/server"

/**
 * Superseded pre-Namirial/Identik identity API.
 *
 * These old routes accepted caller-selected user IDs or unverified provider
 * webhooks while using the Supabase service role. They must NEVER be used as
 * evidence of an identity check or be allowed to mutate verification state.
 *
 * The eventual Namirial integration must have separate authenticated APIs,
 * signed provider callbacks, replay protection and a verified server-side
 * mapping between the provider result and the VERLO user.
 */
export function legacyIdentityDisabled() {
  return NextResponse.json(
    { ok: false, verified: false, error: "IDENTITY_PROVIDER_NOT_CONFIGURED" },
    {
      status: 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  )
}
