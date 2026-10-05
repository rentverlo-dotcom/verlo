type EmailWorkflowMessage = {
  role?: "tenant" | "owner"
  eventKey: string
  eventType: string
  leadId: string
  title: string
  body: string
  url: string
  legacyPayload?: Record<string, any>
}

type EmailWorkflowResult = {
  provider: string
  success: boolean
  skipped?: boolean
  status?: number
  error?: string
}

const GHL_TIMEOUT_MS = 4000

const SITE_URL = (
  process.env.SITE_URL ||
  "https://verlo.lat"
).replace(/\/$/, "")

function clean(value: unknown) {
  return String(value || "").trim()
}

function absoluteUrl(value: unknown) {
  const raw = clean(value)

  if (!raw) {
    return ""
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw
  }

  return `${SITE_URL}${raw.startsWith("/") ? raw : `/${raw}`}`
}

const INTAKE_MATCH_EVENTS = new Set([
  "intake_received",
  "match_created",
  "owner_property_submitted",
  "tenant_verification_submitted",
  "owner_interest_waiting_tenant",
  "double_ok_1",
])

const CLOSING_EVENTS = new Set([
  "post_visit_waiting",
  "double_ok_2",
  "contract_generated",
])

const CONTRACT_FINAL_EVENTS = new Set([
  "contract_accept_waiting",
  "rental_confirmed",
])

export async function sendGhlEmail(
  message: EmailWorkflowMessage
): Promise<EmailWorkflowResult> {
  const eventType = clean(message.eventType)

  let webhookUrl = ""

  if (INTAKE_MATCH_EVENTS.has(eventType)) {
    webhookUrl = clean(
      process.env.GHL_EMAIL_INTAKE_MATCH_WEBHOOK_URL
    )
  } else if (CLOSING_EVENTS.has(eventType)) {
    webhookUrl = clean(
      process.env.GHL_EMAIL_CLOSING_WEBHOOK_URL
    )
  } else if (CONTRACT_FINAL_EVENTS.has(eventType)) {
    webhookUrl = clean(
      process.env.GHL_EMAIL_CONTRACT_FINAL_WEBHOOK_URL
    )
  } else {
    return {
      provider: "ghl-email",
      success: false,
      skipped: true,
      error: "Email event not routed",
    }
  }

  if (!webhookUrl) {
    return {
      provider: "ghl-email",
      success: false,
      skipped: true,
      error: "GHL email webhook not configured",
    }
  }

  const legacyPayload = {
    ...(message.legacyPayload || {}),
  }

  for (const key of [
    "verlo_matches_url",
    "verlo_property_url",
    "verlo_candidates_url",
    "verlo_closing_url",
  ]) {
    if (legacyPayload[key]) {
      legacyPayload[key] = absoluteUrl(
        legacyPayload[key]
      )
    }
  }

  const controller = new AbortController()

  const timeout = setTimeout(
    () => controller.abort(),
    GHL_TIMEOUT_MS
  )

  try {
    const response = await fetch(
      webhookUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...legacyPayload,

          role:
            message.role ||
            legacyPayload.role ||
            null,

          event_type:
            eventType,

          event_key:
            clean(message.eventKey) ||
            null,

          lead_id:
            clean(message.leadId) ||
            null,

          url:
            absoluteUrl(message.url) ||
            null,

          title:
            clean(message.title) ||
            null,

          body:
            clean(message.body) ||
            null,

          source: "verlo",
          channel: "email",
        }),
        signal: controller.signal,
        cache: "no-store",
      }
    )

    if (!response.ok) {
      return {
        provider: "ghl-email",
        success: false,
        status: response.status,
        error: `GHL email HTTP ${response.status}`,
      }
    }

    return {
      provider: "ghl-email",
      success: true,
      status: response.status,
    }
  } catch (error) {
    return {
      provider: "ghl-email",
      success: false,
      error:
        error instanceof Error
          ? error.name === "AbortError"
            ? "GHL email webhook timeout"
            : error.message
          : String(error),
    }
  } finally {
    clearTimeout(timeout)
  }
}
