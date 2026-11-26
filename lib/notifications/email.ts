/**
 * Legacy GHL email transport is permanently retired.
 * No external webhook requests can originate from this module.
 * Active application notifications must use the VERLO ZeptoMail outbox.
 */
export type EmailWorkflowMessage = {
  role?: "tenant" | "owner"
  eventKey: string
  eventType: string
  leadId: string
  title: string
  body: string
  url: string
  legacyPayload?: Record<string, unknown>
}
export type EmailWorkflowResult = {
  provider: string
  success: boolean
  skipped?: boolean
  status?: number
  error?: string
}
export async function sendGhlEmail(
  _message: EmailWorkflowMessage,
): Promise<EmailWorkflowResult> {
  return {
    provider: "disabled",
    success: false,
    skipped: true,
    error: "GHL_RETIRED",
  }
}
