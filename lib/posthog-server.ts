import { createHash } from "node:crypto"

/**
 * Server-confirmed business telemetry. Never use browser clicks for revenue.
 * QA must never pollute the production PostHog project.
 *
 * Capture delivery is best effort and cannot change payment processing.
 * Deterministic UUID helps PostHog deduplicate webhook retries.
 */
type RevenueEvent =
  | "verlo_traditional_payment_approved"
  | "verlo_temporary_fee_approved"
  | "verlo_caucion_partner_payment_confirmed"

type EventArgs = {
  event: RevenueEvent
  reference: string
  businessLine: "tradicionales" | "temporarios" | "caucion"
  amountArs?: number
  paymentReceiver: "verlo" | "powermarket"
}

const SHA_HEX = /^[0-9a-f]{64}$/

export async function recordVerifiedCommercialEvent({
  event, reference, businessLine, amountArs, paymentReceiver,
}: EventArgs): Promise<void> {
  if (process.env.VERCEL_ENV !== "production") return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()
  const rawHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim()
  if (!key || !rawHost || !reference) return

  try {
    const host = new URL(rawHost)
    if (host.protocol !== "https:" ||
        !/^(us|eu)\.i\.posthog\.com$/.test(host.hostname) ||
        host.username || host.password || host.search || host.hash) return

    const hashed = createHash("sha256").update(
      "verlo:commercial:v1:" + businessLine + ":" + reference,
    ).digest("hex")
    if (!SHA_HEX.test(hashed)) return

    // UUID v4-compatible format from a stable hash, used only to suppress
    // repeated deliveries of the same verified payment event.
    const raw = hashed.slice(0, 32).split("")
    raw[12] = "4"
    raw[16] = "89ab"[parseInt(raw[16], 16) % 4]
    const uuid = raw.slice(0, 8).join("") + "-" +
      raw.slice(8, 12).join("") + "-" + raw.slice(12, 16).join("") +
      "-" + raw.slice(16, 20).join("") + "-" + raw.slice(20).join("")

    const properties: Record<string, string | number> = {
      business_line: businessLine,
      payment_receiver: paymentReceiver,
      payment_verified: "true",
      currency: "ARS",
      source: "verified_server_transition",
    }
    if (typeof amountArs === "number" && Number.isFinite(amountArs) && amountArs > 0) {
      properties.amount_ars = amountArs
    }

    // Pseudonymous transaction reference; never share lead IDs, names,
    // private document references or payment-provider IDs with analytics.
    await fetch(host.origin + "/capture/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        uuid,
        distinct_id: "verlo:commercial:" + hashed.slice(0, 24),
        properties,
      }),
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    })
  } catch {
    // Analytics availability must never interfere with payment registration.
  }
}
