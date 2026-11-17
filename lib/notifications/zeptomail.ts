/**
 * Zoho CPaaS (ZeptoMail) transactional email transport.
 * Server-only. Never expose API tokens through NEXT_PUBLIC_*.
 * NO GHL changes and no implicit sending.
 */
export type TransactionalMail = {
  to: string
  subject: string
  html: string
  text: string
  eventKey: string
}

type Fetcher = typeof fetch

export type MailResult = {
  accepted: boolean
  providerId: string | null
  status: number | null
  reason?: string
}

const ENDPOINT = "https://cpaas.zoho.com/v1.1/email"
const DEFAULT_FROM_ADDRESS = "notificaciones@verlo.lat"
const REPLY_TO_ADDRESS = "hola@verlo.lat"
const FROM_NAME = "VERLO"

/**
 * Safe administrative readiness snapshot.
 * Never returns keys or values of environment variables. In particular,
 * "configured" is NOT a claim of an email being received by its destination.
 */
export function getZeptoMailReadiness(env: NodeJS.ProcessEnv) {
  const qaIsolated = env.VERCEL_GIT_COMMIT_REF === "qa/verlo-e2e"
  const sender = (env.VERLO_ZEPTO_FROM_EMAIL || DEFAULT_FROM_ADDRESS).trim()
  const senderValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(sender)
  const hasApiKey = Boolean(env.ZOHO_CPAAS_EMAIL_API_KEY?.trim())
  const captureApproved = env.VERLO_EMAIL_QUEUE_CAPTURE_ENABLED === "true" &&
    env.VERLO_EMAIL_CUTOVER_APPROVED === "true"
  const dispatchApproved = env.VERLO_EMAIL_DISPATCH_ENABLED === "true" &&
    env.VERLO_ZEPTO_EMAIL_LIVE === "true" &&
    env.VERLO_EMAIL_CUTOVER_APPROVED === "true"
  return {
    qa_isolated: qaIsolated,
    sender,
    reply_to: REPLY_TO_ADDRESS,
    sender_valid: senderValid,
    api_key_configured: hasApiKey,
    queue_capture_approved: captureApproved,
    dispatch_approved: dispatchApproved,
    can_dispatch: !qaIsolated && hasApiKey && senderValid && dispatchApproved,
    provider_delivery_verified: false,
    note: "La aceptación de ZeptoMail no certifica entrega en la casilla; requiere prueba real supervisada.",
  }
}

export async function sendWithZeptoMail(
  message: TransactionalMail,
  options: { apiKey?: string; enabled?: boolean; fetcher?: Fetcher } = {},
): Promise<MailResult> {
  // Explicit AND gate. Inactive until verification + manual cutover.
  const enabled = options.enabled ?? process.env.VERLO_ZEPTO_EMAIL_LIVE === "true"
  if (!enabled) return { accepted: false, providerId: null, status: null, reason: "disabled" }
  // Mock transports may be tested in QA; real delivery from the isolated QA branch is forbidden.
  if (!options.fetcher && process.env.VERCEL_GIT_COMMIT_REF === "qa/verlo-e2e") {
    return { accepted: false, providerId: null, status: null, reason: "qa_external_delivery_blocked" }
  }

  // The default uses the verified verlo.lat domain; replies reach the real Zoho mailbox.
  const fromAddress = (process.env.VERLO_ZEPTO_FROM_EMAIL || DEFAULT_FROM_ADDRESS).trim()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromAddress)) {
    return { accepted: false, providerId: null, status: null, reason: "invalid_sender" }
  }

  const key = options.apiKey ?? process.env.ZOHO_CPAAS_EMAIL_API_KEY
  if (!key) return { accepted: false, providerId: null, status: null, reason: "not_configured" }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(message.to)) {
    return { accepted: false, providerId: null, status: null, reason: "invalid_recipient" }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const send = options.fetcher ?? fetch
    const response = await send(ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: key.startsWith("Zoho-enczapikey ") ? key : `Zoho-enczapikey ${key}`,
      },
      body: JSON.stringify({
        from: { address: fromAddress, name: FROM_NAME },
        reply_to: [{ address: REPLY_TO_ADDRESS, name: FROM_NAME }],
        to: [{ email_address: { address: message.to } }],
        subject: message.subject,
        client_reference: message.eventKey.slice(0, 128),
        htmlbody: message.html,
        textbody: message.text,
      }),
      signal: controller.signal,
      cache: "no-store",
    })

    if (!response.ok) {
      return {
        accepted: false,
        providerId: null,
        status: response.status,
        reason: response.status === 429 || response.status >= 500 ? "retryable_http" : "provider_rejected",
      }
    }
    const result = await response.json().catch(() => null) as Record<string, unknown> | null
    const codes = Array.isArray(result?.data)
      ? result.data.map((item: unknown) =>
          typeof item === "object" && item !== null && "code" in item ? item.code : null)
      : []
    // HTTP 200 is not sufficient. The provider must explicitly accept the
    // recipient; otherwise keep the outbox unresolved for review/retry.
    if (!result || result.message !== "OK" || codes.length !== 1 || codes[0] !== "EM_104" ||
        typeof result.request_id !== "string" || !result.request_id.trim()) {
      return { accepted: false, providerId: null, status: response.status, reason: "unconfirmed_provider_acceptance" }
    }
    return {
      accepted: true,
      providerId: result.request_id,
      status: response.status,
    }
  } catch (error) {
    return {
      accepted: false,
      providerId: null,
      status: null,
      reason: error instanceof Error && error.name === "AbortError" ? "timeout_unknown_outcome" : "network_unknown_outcome",
    }
  } finally {
    clearTimeout(timeout)
  }
}
