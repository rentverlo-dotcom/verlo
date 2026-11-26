/**
 * WhatsApp is permanently disabled in VERLO.
 * This compatibility function intentionally performs no network request.
 * Customer notifications use VERLO Email (ZeptoMail) and Web Push only.
 */
export type WhatsAppMessage = {
  to?: string
  role?: "tenant" | "owner"
  template: string
  variables?: Record<string, string | number>
  context?: Record<string, unknown>
  eventKey?: string
  eventType?: string
  leadId?: string
  title?: string
  body?: string
  url?: string
  matchCount?: number
  matchesUrl?: string
  legacyPayload?: Record<string, unknown>
}

export type WhatsAppResult = {
  provider: string
  success: boolean
  skipped?: boolean
  status?: number
  message_id?: string
  error?: string
}

export async function sendWhatsApp(
  _message: WhatsAppMessage,
): Promise<WhatsAppResult> {
  return {
    provider: "disabled",
    success: false,
    skipped: true,
    error: "WHATSAPP_DISABLED",
  }
}
