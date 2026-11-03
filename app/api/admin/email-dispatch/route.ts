import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { renderVerloEmail, VERLO_EMAIL_EVENT_TYPES, type VerloEmailArea, type VerloEmailRole } from "@/lib/notifications/verlo-email-templates"
import { sendWithZeptoMail } from "@/lib/notifications/zeptomail"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

type QueueItem = {
  id: string
  event_key: string
  event_type: string
  area: VerloEmailArea
  recipient_email: string
  recipient_role: VerloEmailRole
  status: "pending" | "failed" | "processing"
  attempts: number
}

const json = (status: number, data: Record<string, unknown>) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } })

function authenticated(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`
}

/** This route is deliberately NOT added to vercel.json crons. */
async function handle(request: NextRequest, requestedLive: boolean) {
  if (!authenticated(request)) return json(401, { ok: false, error: "Unauthorized" })

  // Fail closed: even with a key, no emails can leave unless both switches
  // are intentionally enabled after Zoho sender verification and cutover.
  const live = requestedLive
    && process.env.VERLO_EMAIL_DISPATCH_ENABLED === "true"
    && process.env.VERLO_ZEPTO_EMAIL_LIVE === "true"
    && process.env.VERLO_EMAIL_CUTOVER_APPROVED === "true"

  if (!live) {
    // No claims, writes, retries, enqueues, or external email calls in dry-run.
    const { data, error } = await supabaseAdmin
      .from("verlo_email_outbox")
      .select("id,area,event_type,recipient_role,status,attempts")
      .in("status", ["pending", "failed", "unknown", "processing"])
      .order("created_at", { ascending: true })
      .limit(20)
    if (error) return json(503, {
      ok: false, dry_run: true,
      error: "Email outbox unavailable. SQL migration may be pending.",
    })
    return json(200, {
      ok: true, dry_run: true, live_enabled: false, queued: data?.length || 0,
      // Never leak customer addresses in diagnostic output.
      events: (data || []).map(item => ({
        id: item.id, area: item.area, event_type: item.event_type,
        recipient_role: item.recipient_role, status: item.status, attempts: item.attempts,
      })),
    })
  }

  // After eventual cutover: only new, intentionally enqueued records.
  // Zero backfill, no automatic triggers in this change.
  const { data, error: claimError } = await supabaseAdmin.rpc("verlo_email_claim", { p_limit: 10 })
  if (claimError) return json(503, { ok: false, error: "Cannot claim email outbox" })

  const results: Array<{ id: string; status: string }> = []
  for (const item of (data || []) as QueueItem[]) {
    let state: "accepted" | "failed" | "unknown" | "cancelled" = "unknown"
    let providerId: string | null = null
    let reason: string | null = null

    try {
      const supported = VERLO_EMAIL_EVENT_TYPES[item.area] as readonly string[] | undefined
      if (!supported?.includes(item.event_type) ||
        !["tenant", "owner"].includes(item.recipient_role)) {
        state = "cancelled"
        reason = "Unsupported area/role/event type"
      } else {
        const rendered = renderVerloEmail({
          area: item.area, role: item.recipient_role, type: item.event_type,
        })
        const result = await sendWithZeptoMail({
          to: item.recipient_email, subject: rendered.subject,
          html: rendered.html, text: rendered.text, eventKey: item.event_key,
        })
        providerId = result.providerId
        if (result.accepted) state = "accepted"
        else if (result.reason === "invalid_recipient" || result.reason === "provider_rejected") {
          state = "cancelled"
          reason = result.reason
        } else if (result.reason === "retryable_http" && result.status === 429) {
          state = "failed"
          reason = result.reason
        } else {
          // 5xx/timeout/network failure may happen after acceptance:
          // quarantine instead of an unsafe replay.
          state = "unknown"
          reason = result.reason || "Uncertain outcome"
        }
      }
    } catch (error) {
      state = "unknown"
      reason = error instanceof Error ? error.message : "Unexpected send error"
    }

    const { data: finished, error: finishError } = await supabaseAdmin.rpc(
      "verlo_email_finish", {
        p_id: item.id, p_status: state, p_provider_id: providerId,
        p_error: reason,
      },
    )
    if (finishError || finished !== true) {
      // Do not silently re-send a potentially accepted email.
      return json(503, {
        ok: false, error: "Unable to finalize claimed email",
        processed: results.length,
      })
    }
    results.push({ id: item.id, status: state })
  }

  return json(200, {
    ok: true, dry_run: false, processed: results.length,
    accepted_by_provider: results.filter(r => r.status === "accepted").length,
    uncertain_or_blocked: results.filter(r => r.status !== "accepted").length,
    // Provider acceptance != recipient inbox delivery.
    results,
  })
}

export async function GET(req: NextRequest) { return handle(req, false) }
export async function POST(req: NextRequest) { return handle(req, true) }
