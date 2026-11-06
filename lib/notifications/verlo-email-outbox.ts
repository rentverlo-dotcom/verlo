import { supabaseAdmin } from "@/lib/supabase/admin"
import { VERLO_EMAIL_EVENT_TYPES, type VerloEmailArea, type VerloEmailRole } from "@/lib/notifications/verlo-email-templates"

type EnqueueInput = {
  area: VerloEmailArea
  eventType: string
  eventKey: string
  recipientEmail: string | null | undefined
  recipientRole: VerloEmailRole
  url?: string
  title?: string
  body?: string
}

/**
 * Only new application events, and only after an explicit cutover.
 * Never writes on deploy. Does not send emails. No historical import.
 * Queuing and sending require distinct flags.
 */
export async function enqueueVerloEmail(input: EnqueueInput): Promise<"disabled" | "queued" | "duplicate" | "invalid"> {
  const qaOnly = process.env.VERCEL_GIT_COMMIT_REF === "qa/verlo-e2e"
    && process.env.NEXT_PUBLIC_SUPABASE_URL === "https://anptswspguyotnasoacq.supabase.co"
  // QA can capture synthetic email intents, but never dispatch them.
  if (qaOnly && !(input.recipientEmail || "").trim().toLowerCase().endsWith("@example.com")) return "invalid"
  if (!qaOnly && (process.env.VERLO_EMAIL_QUEUE_CAPTURE_ENABLED !== "true"
    || process.env.VERLO_EMAIL_CUTOVER_APPROVED !== "true")) return "disabled"

  const supported = VERLO_EMAIL_EVENT_TYPES[input.area] as readonly string[] | undefined
  const email = (input.recipientEmail || "").trim().toLowerCase()
  if (!supported?.includes(input.eventType)
    || !input.eventKey.trim()
    || !["owner", "tenant"].includes(input.recipientRole)
    || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "invalid"

  const { error } = await supabaseAdmin.from("verlo_email_outbox").insert({
    event_key: input.eventKey,
    area: input.area,
    event_type: input.eventType,
    recipient_email: email,
    recipient_role: input.recipientRole,
    destination_url: input.url || null,
    notification_title: input.title || null,
    notification_body: input.body || null,
    status: "pending",
  })

  if (error?.code === "23505") return "duplicate"
  if (error) throw new Error("Unable to enqueue VERLO email")
  return "queued"
}

/** Noncritical capture must never interrupt the original business workflow. */
export async function enqueueVerloEmailSafely(input: EnqueueInput): Promise<void> {
  try {
    const status = await enqueueVerloEmail(input)
    if (status === "invalid") console.warn("VERLO email capture skipped invalid event", {
      area: input.area, eventType: input.eventType, eventKey: input.eventKey,
    })
  } catch {
    console.error("VERLO email capture failed", {
      area: input.area, eventType: input.eventType, eventKey: input.eventKey,
    })
  }
}
