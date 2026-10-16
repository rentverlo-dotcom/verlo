
import { createHash, randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { notifyLeadOnce } from "@/lib/lead-notifications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 240

const CUTOFF = "2026-10-09T13:45:00.000Z"
const CAMPAIGN = "oct2026_recovery"
const MAX_PER_RUN = 50
const MAX_PER_DAY = 50

const ACTIVE = [
  "new",
  "reviewed",
  "contacted",
  "converted",
]

type Role = "owner" | "tenant"

type Lead = {
  id: string
  email: string | null
  phone_normalized: string | null
}

type Match = {
  id: string
  tenant_lead_id: string
  owner_lead_id: string
}

type Recipient = {
  role: Role
  leadId: string
  identity: string
  matches: Set<string>
  recovery?: boolean
}

function digest(value: string): string {
  return createHash("sha256")
    .update(value)
    .digest("hex")
}

function identity(lead: Lead): string {
  const phone = (lead.phone_normalized || "").trim()
  const email = (lead.email || "").trim().toLowerCase()

  return phone
    ? `phone:${phone}`
    : email
      ? `email:${email}`
      : `lead:${lead.id}`
}

function argentinaDay(): string {
  return new Date(Date.now() - 3 * 3600000)
    .toISOString()
    .slice(0, 10)
}

async function privateUrl(
  role: Role,
  leadId: string
): Promise<string> {
  const table =
    role === "owner"
      ? "owner_candidates_access_tokens"
      : "tenant_matches_access_tokens"

  const column =
    role === "owner"
      ? "owner_lead_id"
      : "tenant_lead_id"

  const now = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from(table)
    .select("token")
    .eq(column, leadId)
    .is("revoked_at", null)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  let token = data?.token

  if (!token) {
    token = randomBytes(32).toString("hex")

    const { error: insertError } = await supabaseAdmin
      .from(table)
      .insert({
        [column]: leadId,
        token,
        expires_at: new Date(
          Date.now() + 30 * 86400000
        ).toISOString(),
      })

    if (insertError) throw insertError
  }

  return `${
    role === "owner" ? "/candidatos" : "/matches"
  }/${token}`
}

async function recipients(): Promise<Recipient[]> {
  const staged: Array<{ match_id: string }> = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabaseAdmin
      .from("traditional_historical_backfill_matches")
      .select("match_id")
      .eq("campaign", CAMPAIGN)
      .eq("state", "staged")
      .order("match_id", { ascending: true })
      .range(offset, offset + 499)
    if (error) throw error
    staged.push(...(data || []))
    if (!data || data.length < 500) break
  }
  if (!staged.length) return []

  const rows: Match[] = []
  for (let offset = 0; offset < staged.length; offset += 200) {
    const ids = staged.slice(offset, offset + 200).map(row => row.match_id)
    const { data, error } = await supabaseAdmin
      .from("lead_matches")
      .select("id,tenant_lead_id,owner_lead_id")
      .in("id", ids)
      .lt("created_at", CUTOFF)
      .gte("score", 80)
      .in("status", ACTIVE)
    if (error) throw error
    rows.push(...((data || []) as Match[]))
  }

  const ids = Array.from(new Set(rows.flatMap(row => [
    row.owner_lead_id, row.tenant_lead_id,
  ])))
  if (!ids.length) return []

  const byId = new Map<string, Lead>()
  for (let offset = 0; offset < ids.length; offset += 200) {
    const { data, error } = await supabaseAdmin
      .from("lead_intake")
      .select("id,email,phone_normalized")
      .in("id", ids.slice(offset, offset + 200))
    if (error) throw error
    for (const lead of data || []) byId.set(lead.id, lead as Lead)
  }

  const grouped = new Map<string, Recipient>()

  for (const match of rows) {
    const owner = byId.get(match.owner_lead_id)
    const tenant = byId.get(match.tenant_lead_id)

    if (!owner || !tenant) continue

    const automatedTest = [owner, tenant].some(
      (lead) =>
        (lead.email || "")
          .trim()
          .toLowerCase()
          .endsWith("@example.com")
    )

    if (automatedTest) continue

    const participants: Array<{
      role: Role
      lead: Lead
    }> = [
      { role: "owner", lead: owner },
      { role: "tenant", lead: tenant },
    ]

    for (const { role, lead } of participants) {
      if (!lead.email && !lead.phone_normalized) {
        continue
      }

      const key = `${role}:${identity(lead)}`

      if (!grouped.has(key)) {
        grouped.set(key, {
          role,
          leadId: lead.id,
          identity: key,
          matches: new Set<string>(),
        })
      }

      grouped.get(key)!.matches.add(match.id)
    }
  }

  return Array.from(grouped.values()).sort(
    (a, b) =>
      b.matches.size - a.matches.size ||
      a.identity.localeCompare(b.identity)
  )
}

async function dailyUsage(today: string) {
  const {
    data: reservations,
    error: reservationError,
  } = await supabaseAdmin
    .from("ghl_digest_daily_reservations")
    .select("recipient_key")
    .eq("day", today)
    .limit(100)

  if (reservationError) throw reservationError

  const prefix = `match_digest:v3:${today}:`

  const {
    data: events,
    error: eventsError,
  } = await supabaseAdmin
    .from("lead_notification_events")
    .select("event_key")
    .like("event_key", `${prefix}%`)
    .limit(100)

  if (eventsError) throw eventsError

  const used = new Set<string>()

  for (const reservation of reservations || []) {
    used.add(reservation.recipient_key)
  }

  for (const event of events || []) {
    used.add(event.event_key.slice(prefix.length))
  }

  return {
    reservedCount: (reservations || []).length,
    used,
  }
}

async function pendingRecipients(
  all: Recipient[],
  used: Set<string>,
  today: string
): Promise<Recipient[]> {
  const pending: Recipient[] = []
  for (const recipient of all) {
    const hash = digest(recipient.identity)
    if (used.has(hash)) continue
    const { data: attempts, error } = await supabaseAdmin
      .from("lead_notification_events")
      .select("event_key,status,created_at")
      .like("event_key", `historic:${CAMPAIGN}:%${hash}`)
      .order("created_at", { ascending: false })
      .limit(5)
    if (error) throw error
    if (!attempts?.length) {
      pending.push(recipient)
      continue
    }
    // Maximo tres intentos y nunca dos al mismo destinatario en un dia.
    if (attempts.length >= 3 || attempts[0].status !== "failed") continue
    const lastDay = new Date(
      new Date(attempts[0].created_at).getTime() - 10800000
    ).toISOString().slice(0, 10)
    if (lastDay >= today) continue
    pending.push({ ...recipient, recovery: true })
  }
  return pending.sort((a, b) =>
    Number(Boolean(b.recovery)) - Number(Boolean(a.recovery))
  )
}

// Select complete real match pairs, not unrelated recipients.
// A recipient already notified in this historical campaign is not sent again.
function planPairedBatch(
  all: Recipient[],
  pending: Recipient[],
  capacity: number
): { selected: Recipient[]; matchedPairs: number } {
  const pendingKeys = new Set(pending.map(r => r.identity))
  const byIdentity = new Map(all.map(r => [r.identity, r]))
  const byMatch = new Map<string, { owner?: string; tenant?: string }>()
  for (const recipient of all) {
    for (const matchId of Array.from(recipient.matches)) {
      const pair = byMatch.get(matchId) || {}
      pair[recipient.role] = recipient.identity
      byMatch.set(matchId, pair)
    }
  }
  const selectedKeys = new Set<string>()
  let matchedPairs = 0
  for (const matchId of Array.from(byMatch.keys()).sort()) {
    const pair = byMatch.get(matchId)!
    if (!pair.owner || !pair.tenant) continue
    const needed = [pair.owner, pair.tenant].filter(
      key => pendingKeys.has(key) && !selectedKeys.has(key)
    )
    if (!needed.length) continue
    if (selectedKeys.size + needed.length > capacity) continue
    for (const key of needed) selectedKeys.add(key)
    matchedPairs++
    if (selectedKeys.size >= capacity) break
  }
  return {
    selected: Array.from(selectedKeys).map(key => {
      const recipient = pending.find(r => r.identity === key)
      if (!recipient || !byIdentity.has(key)) throw new Error("Invalid pair batch")
      return recipient
    }),
    matchedPairs,
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET

  if (
    !secret ||
    request.headers.get("authorization") !==
      `Bearer ${secret}`
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "unauthorized",
      },
      { status: 401 }
    )
  }

  try {
    const today = argentinaDay()

    const all = await recipients()

    const {
      reservedCount,
      used,
    } = await dailyUsage(today)

    const pending = await pendingRecipients(
      all,
      used,
      today
    )

    const enabled =
      process.env
        .TRADICIONALES_HISTORICAL_BACKFILL_ENABLED ===
      "true"

    const dryRun =
      !enabled ||
      request.nextUrl.searchParams.get("dry_run") ===
        "1"

    const availableToday = Math.max(
      0,
      MAX_PER_DAY - reservedCount
    )

    const maxThisRun = Math.min(
      MAX_PER_RUN,
      availableToday,
      pending.length
    )
    const plan = planPairedBatch(all, pending, maxThisRun)
    const selected = plan.selected

    const ownersPending = pending.filter(
      (recipient) => recipient.role === "owner"
    ).length

    const tenantsPending = pending.filter(
      (recipient) => recipient.role === "tenant"
    ).length

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        mode: "dry_run",
        enabled,
        date: today,
        candidates: all.length,
        pending: pending.length,
        ownersPending,
        tenantsPending,
        reservedToday: reservedCount,
        availableToday,
        maxThisRun,
        plannedRecipients: selected.length,
        matchedPairs: plan.matchedPairs,
        attempted: 0,
        failed: 0,
      })
    }

    // Sin pendientes o sin cupos: terminación normal.
    if (selected.length === 0) {
      return NextResponse.json({
        ok: true,
        mode: "send",
        date: today,
        attempted: 0,
        failed: 0,
        blocked: 0,
        remaining: pending.length,
        reason:
          pending.length === 0
            ? "no_pending_recipients"
            : "daily_quota_exhausted",
      })
    }

    let attempted = 0
    let failed = 0
    let blocked = 0

    for (const recipient of selected) {
      if (attempted >= maxThisRun) break

      const recipientHash = digest(
        recipient.identity
      )

      const {
        data: granted,
        error: reserveError,
      } = await supabaseAdmin.rpc(
        "reserve_ghl_digest_slot",
        {
          p_day: today,
          p_recipient_key: recipientHash,
        }
      )

      if (reserveError) throw reserveError

      if (granted !== true) {
        blocked++
        continue
      }

      attempted++

      try {
        const url = await privateUrl(
          recipient.role,
          recipient.leadId
        )

        const count = recipient.matches.size

        const result = await notifyLeadOnce({
          eventKey:
            recipient.recovery ? `historic:${CAMPAIGN}:retry:${today}:${recipientHash}` : `historic:${CAMPAIGN}:${recipientHash}`,

          eventType:
            recipient.role === "owner"
              ? "owner_match_digest"
              : "match_digest_tenant",

          leadId: recipient.leadId,

          entityType: "lead",
          entityId: recipient.leadId,

          title:
            recipient.role === "owner"
              ? "Verlo · Tus candidatos compatibles"
              : "Verlo · Tus propiedades compatibles",

          body:
            recipient.role === "owner"
              ? `Tenés ${count} candidatos compatibles para revisar.`
              : `Tenés ${count} propiedades compatibles para revisar.`,

          url,

          skipWhatsApp: false, // Existing GHL digest workflow manages commercial channels
        })

        if (!result.ok) {
          failed++
        }

        console.log(
          "HISTORICAL BACKFILL RECIPIENT",
          {
            role: recipient.role,
            matchCount: count,
            ok: result.ok,
            duplicate: result.duplicate,
          }
        )
      } catch (error) {
        failed++

        console.error(
          "HISTORICAL BACKFILL RECIPIENT FAILED",
          {
            role: recipient.role,
            leadId: recipient.leadId,
            error,
          }
        )
      }
    }

    return NextResponse.json({
      ok: failed === 0,
      mode: "send",
      date: today,
      attempted,
      failed,
      blocked,
      selectedPairs: plan.matchedPairs,
      selectedRecipients: selected.length,
      remaining: Math.max(
        0,
        pending.length - attempted
      ),
    })
  } catch (error) {
    console.error(
      "HISTORICAL BACKFILL FAILED",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error: "historical_backfill_failed",
      },
      { status: 500 }
    )
  }
}
