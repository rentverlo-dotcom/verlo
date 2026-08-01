import crypto from "crypto"

type MetaCapiLeadInput = {
  eventId: string
  eventSourceUrl?: string | null
  email?: string | null
  phone?: string | null
  fullName?: string | null
  clientIpAddress?: string | null
  clientUserAgent?: string | null
  fbp?: string | null
  fbc?: string | null
  role?: string | null
  intent?: string | null
  zone?: string | null
}

function normalize(value?: string | null) {
  return String(value || "").trim().toLowerCase()
}

function normalizePhone(value?: string | null) {
  return String(value || "").replace(/\D/g, "")
}

function sha256(value?: string | null) {
  const cleaned = normalize(value)

  if (!cleaned) return undefined

  return crypto.createHash("sha256").update(cleaned).digest("hex")
}

function sha256Phone(value?: string | null) {
  const cleaned = normalizePhone(value)

  if (!cleaned) return undefined

  return crypto.createHash("sha256").update(cleaned).digest("hex")
}

function splitName(fullName?: string | null) {
  const parts = String(fullName || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  return {
    firstName: parts[0] || undefined,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
  }
}

export async function sendMetaCapiLead(input: MetaCapiLeadInput) {
  const pixelId = process.env.META_PIXEL_ID
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE

  if (!pixelId || !accessToken) {
    return {
      ok: false,
      skipped: true,
      error: "Faltan META_PIXEL_ID o META_CAPI_ACCESS_TOKEN",
    }
  }

  const { firstName, lastName } = splitName(input.fullName)

  const userData: Record<string, string> = {}

  const em = sha256(input.email)
  const ph = sha256Phone(input.phone)
  const fn = sha256(firstName)
  const ln = sha256(lastName)

  if (em) userData.em = em
  if (ph) userData.ph = ph
  if (fn) userData.fn = fn
  if (ln) userData.ln = ln

  if (input.clientIpAddress) {
    userData.client_ip_address = input.clientIpAddress
  }

  if (input.clientUserAgent) {
    userData.client_user_agent = input.clientUserAgent
  }

  if (input.fbp) {
    userData.fbp = input.fbp
  }

  if (input.fbc) {
    userData.fbc = input.fbc
  }

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.eventSourceUrl || "https://verlo.lat/test-captacion",
        user_data: userData,
    custom_data: {
  content_name: "verlo_home_lead",
  content_category: input.role || "unknown",
  lead_type: input.intent || "unknown",
  zone: input.zone || undefined,
  value: 1,
  currency: "ARS",
      },
    ],
  }

  if (testEventCode) {
    body.test_event_code = testEventCode
  }

  const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const responseBody = await res.json().catch(() => null)

    if (!res.ok) {
      return {
        ok: false,
        skipped: false,
        status: res.status,
        error: responseBody,
      }
    }

    return {
      ok: true,
      skipped: false,
      status: res.status,
      response: responseBody,
    }
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      error: err instanceof Error ? err.message : "Error enviando Meta CAPI",
    }
  }
}
