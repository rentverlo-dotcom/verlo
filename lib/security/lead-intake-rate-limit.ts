import { createHmac } from "node:crypto"
import { isIP } from "node:net"
import { supabaseAdmin } from "@/lib/supabase/admin"

/** Hash the Vercel proxy-provided client IP. Never persist a raw IP. */
export function getLeadRateLimitKey(
  headers: Pick<Headers, "get">,
  secret: string,
  onVercel: boolean
): string | null {
  if (!secret) return null
  const forwarded = onVercel
    ? (headers.get("x-vercel-forwarded-for") || headers.get("x-forwarded-for"))
    : headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || ""
  if (!isIP(ip)) return null
  return createHmac("sha256", secret)
    .update("verlo:lead-intake:ip:v1:").update(ip).digest("hex")
}

export type IntakeRateResult =
  | { ok: true }
  | { ok: false; status: 429 | 503 }

export async function takeLeadIntakeRateSlot(
  request: Pick<Request, "headers">
): Promise<IntakeRateResult> {
  if (process.env.LEAD_INTAKE_RATE_LIMIT_ENABLED !== "true") return { ok: true }

  const secret = process.env.LEAD_RATE_LIMIT_HMAC_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  const key = getLeadRateLimitKey(request.headers, secret, Boolean(process.env.VERCEL))
  if (!key) {
    console.error("Lead rate limiting client IP missing")
    return { ok: false, status: 503 }
  }
  const { data, error } = await supabaseAdmin.rpc("lead_intake_take_rate_slot", {
    p_client_key: key,
  })
  // Never silently bypass an enabled security check on DB failure.
  if (error || typeof data !== "boolean") {
    console.error("Lead intake rate check failed",{code:error?.code||"invalid_response"})
    return { ok: false, status: 503 }
  }
  return data ? { ok: true } : { ok: false, status: 429 }
}
