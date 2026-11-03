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
const DEFAULT_FROM_ADDRESS = "hola@verlo.lat"
const FROM_NAME = "VERLO"

export async function sendWithZeptoMail(
  message: TransactionalMail,
  options: { apiKey?: string; enabled?: boolean; fetcher?: Fetcher } = {},
): Promise<MailResult> {
  // Explicit AND gate. Inactive until verification + manual cutover.
  const enabled = options.enabled ?? process.env.VERLO_ZEPTO_EMAIL_LIVE === "true"
  if (!enabled) return { accepted: false, providerId: null, status: null, reason: "disabled" }

  // Configure the verified transactional subdomain only after Zoho authorizes it.
  // Never infer a Reply-To mailbox: transactional notices are not conversations.
  const fromAddress = (process.env.VERLO_ZEPTO_FROM_EMAIL || DEFAULT_FROM_ADDRESS).trim()
  if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(fromAddress)) {
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
        to: [{ email_address: { address: message.to } }],
        subject: message.subject,
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
    const result = await response.json().catch(() => ({})) as Record<string, unknown>
    return {
      accepted: true,
      providerId: typeof result.request_id === "string" ? result.request_id : null,
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
