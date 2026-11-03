import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { enqueueVerloEmailSafely } from "@/lib/notifications/verlo-email-outbox"
import { VERLO_EMAIL_EVENT_TYPES } from "@/lib/notifications/verlo-email-templates"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// This is independent of Push. Never invoked by a scheduled job.
// The cutoff prevents historical PowerMarket events from being captured.
const CUTOFF = "2026-11-03T12:00:00Z"
const ok = (status: number, obj: Record<string, unknown>) => NextResponse.json(obj, {
  status, headers: { "Cache-Control": "no-store" },
})

function authorized(req: NextRequest) {
  return !!process.env.CRON_SECRET &&
    req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`
}

async function handle(req: NextRequest, queueRequested: boolean) {
  if (!authorized(req)) return ok(401, { ok: false, error: "Unauthorized" })

  const queueEnabled = queueRequested
    && process.env.VERLO_EMAIL_QUEUE_CAPTURE_ENABLED === "true"
    && process.env.VERLO_EMAIL_CUTOVER_APPROVED === "true"

  const { data, error } = await supabaseAdmin.from("caucion_events")
    .select("id,event_key,event_type,application_id,payload,created_at")
    .gte("created_at", CUTOFF)
    .order("created_at", { ascending: false }).limit(30)
  if (error) return ok(503, { ok: false, error: "PowerMarket events unavailable" })

  if (!queueEnabled) return ok(200, {
    ok: true, dry_run: true, queued: 0, inspected: data?.length || 0,
  })

  let processed = 0
  let eligible = 0

  for (const event of (data || [])) {
    processed++
    if (!(VERLO_EMAIL_EVENT_TYPES.powermarket as readonly string[]).includes(event.event_type)) continue

    const { data: app, error: appError } = await supabaseAdmin.from("caucion_applications")
      .select("tenant_lead_id,submitted_at").eq("id", event.application_id).maybeSingle()
    if (appError || !app?.tenant_lead_id || !app.submitted_at ||
        Date.parse(app.submitted_at) < Date.parse(CUTOFF)) continue

    // Tenant is always the applicant. Never expose partner information in the email.
    const { data: tenant, error: tenantError } = await supabaseAdmin.from("lead_intake")
      .select("email").eq("id", app.tenant_lead_id).maybeSingle()
    if (!tenantError && tenant?.email) {
      await enqueueVerloEmailSafely({
        area: "powermarket", eventType: event.event_type,
        eventKey: `powermarket:${event.event_key}:tenant`,
        recipientEmail: tenant.email, recipientRole: "tenant",
      })
      eligible++
    }

    // Owner only when this exact event points to a contract belonging to applicant.
    const payload = event.payload as Record<string, unknown> | null
    const sourceTable = payload?.source_table === "caucion_contract_reviews"
      ? "caucion_contract_reviews"
      : payload?.source_table === "caucion_policies" ? "caucion_policies" : null
    const sourceId = typeof payload?.source_id === "string" ? payload.source_id : ""
    if (!sourceTable || !/^[0-9a-f-]{36}$/i.test(sourceId)) continue

    const { data: source, error: sourceError } = await supabaseAdmin.from(sourceTable)
      .select("lead_contract_id").eq("id", sourceId)
      .eq("application_id", event.application_id).maybeSingle()
    if (sourceError || !source?.lead_contract_id) continue

    const { data: contract, error: contractError } = await supabaseAdmin.from("lead_contracts")
      .select("owner_lead_id").eq("id", source.lead_contract_id)
      .eq("tenant_lead_id", app.tenant_lead_id).maybeSingle()
    if (contractError || !contract?.owner_lead_id) continue

    const { data: owner, error: ownerError } = await supabaseAdmin.from("lead_intake")
      .select("email").eq("id", contract.owner_lead_id).maybeSingle()
    if (ownerError || !owner?.email) continue

    await enqueueVerloEmailSafely({
      area: "powermarket", eventType: event.event_type,
      eventKey: `powermarket:${event.event_key}:owner`,
      recipientEmail: owner.email, recipientRole: "owner",
    })
    eligible++
  }

  return ok(200, {
    ok: true, dry_run: false, inspected: processed,
    eligible_recipient_events: eligible,
    // Queue only; there is NO provider send in this route.
  })
}

export const GET = (req: NextRequest) => handle(req, false)
export const POST = (req: NextRequest) => handle(req, true)
