import { createHash, randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { notifyLeadOnce } from "@/lib/lead-notifications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 240

const CUTOFF = "2026-10-09T13:45:00.000Z"
const CAMPAIGN = "oct2026_recovery"
const ACTIVE = ["new", "reviewed", "contacted", "converted"]

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
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function identity(lead: Lead) {
  const phone = (lead.phone_normalized || "").trim()
  const email = (lead.email || "").trim().toLowerCase()

  return phone
    ? `phone:${phone}`
    : email
      ? `email:${email}`
      : `lead:${lead.id}`
}

async function privateUrl(role: Role, leadId: string) {
  const table =
    role === "owner"
      ? "owner_candidates_access_tokens"
      : "tenant_matches_access_tokens"

  const column =
    role === "owner"
      ? "owner_lead_id"
      : "tenant_lead_id"

  const { data, error } = await supabaseAdmin
    .from(table)
    .select("token")
    .eq(column, leadId)
    .is("revoked_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
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

  return `${role === "owner" ? "/candidatos" : "/matches"}/${token}`
}

async function recipients(): Promise<Recipient[]> {
  const { data: staged, error: stagedError } = await supabaseAdmin
    .from("traditional_historical_backfill_matches")
    .select("match_id")
    .eq("campaign", CAMPAIGN)
    .eq("state", "staged")
    .limit(500)

  if (stagedError) throw stagedError
  if (!staged?.length) return []

  const { data: matches, error: matchError } = await supabaseAdmin
    .from("lead_matches")
    .select("id,tenant_lead_id,owner_lead_id")
    .in("id", staged.map((x) => x.match_id))
    .lt("created_at", CUTOFF)
    .gte("score", 80)
    .in("status", ACTIVE)

  if (matchError) throw matchError

  const rows = (matches || []) as Match[]

  const ids = [
    ...new Set(
      rows.flatMap((x) => [
        x.owner_lead_id,
        x.tenant_lead_id,
      ])
    ),
  ]

  if (!ids.length) return []

  const { data: leads, error: leadError } = await supabaseAdmin
    .from("lead_intake")
    .select("id,email,phone_normalized")
    .in("id", ids)

  if (leadError) throw leadError

  const byId = new Map(
    (leads || []).map((x) => [x.id, x as Lead])
  )

  const grouped = new Map<string, Recipient>()

  for (const row of rows) {
    const owner = byId.get(row.owner_lead_id)
    const tenant = byId.get(row.tenant_lead_id)

    if (!owner || !tenant) continue

    if (
      [owner, tenant].some((x) =>
        (x.email || "")
          .trim()
          .toLowerCase()
          .endsWith("@example.com")
      )
    ) {
      continue
    }

    for (const [role, lead] of [
      ["owner", owner],
      ["tenant", tenant],
    ] as const) {
      if (!(lead.email || lead.phone_normalized)) continue

      const key = `${role}:${identity(lead)}`

      if (!grouped.has(key)) {
        grouped.set(key, {
          role,
          leadId: lead.id,
          identity: key,
          matches: new Set(),
        })
      }

      grouped.get(key)!.matches.add(row.id)
    }
  }

  return [...grouped.values()].sort(
    (a, b) =>
      b.matches.size - a.matches.size ||
      a.identity.localeCompare(b.identity)
  )
}

export async function GET(request: NextRequest) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !==
      `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    )
  }

  try {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())

    const all = await recipients()

    const { data: reserved, error: reservationError } =
      await supabaseAdmin
        .from("ghl_digest_daily_reservations")
        .select("recipient_key")
        .eq("day", today)
        .limit(100)

    if (reservationError) throw reservationError

    const { data: freshEvents, error: eventError } =
      await supabaseAdmin
        .from("lead_notification_events")
        .select("event_key")
        .like("event_key", `match_digest:v3:${today}:%`)
        .limit(100)

    if (eventError) throw eventError

    const used = new Set([
      ...(reserved || []).map((x) => x.recipient_key),
      ...(freshEvents || []).map((x) =>
        x.event_key.slice(
          `match_digest:v3:${today}:`.length
        )
      ),
    ])

    const pending: Recipient[] = []

    for (const recipient of all) {
      const eventKey =
        `historic:${CAMPAIGN}:${digest(recipient.identity)}`

      const { data, error } = await supabaseAdmin
        .from("lead_notification_events")
        .select("id")
        .eq("event_key", eventKey)
        .maybeSingle()

      if (error) throw error

      if (
        !data &&
        !used.has(digest(recipient.identity))
      ) {
        pending.push(recipient)
      }
    }

    const enabled =
      process.env.TRADICIONALES_HISTORICAL_BACKFILL_ENABLED ===
      "true"

    const execute =
      enabled &&
      request.nextUrl.searchParams.get("run") === "1"

    const cap = Math.min(
      10,
      Math.max(0, 50 - (reserved || []).length)
    )

    if (!execute) {
      return NextResponse.json({
        ok: true,
        mode: "dry_run",
        enabled,
        recipients: all.length,
        pending: pending.length,
        reservedToday: (reserved || []).length,
        maxThisRun: Math.min(cap, pending.length),
        ownersPending: pending.filter(
          (x) => x.role === "owner"
        ).length,
        tenantsPending: pending.filter(
          (x) => x.role === "tenant"
        ).length,
        sent: 0,
      })
    }

    let attempted = 0
    let failed = 0

    for (const recipient of pending) {
      if (attempted >= cap) break

      const recipientKey = digest(recipient.identity)

      const { data: granted, error: reserveError } =
        await supabaseAdmin.rpc("reserve_ghl_digest_slot", {
          p_day: today,
          p_recipient_key: recipientKey,
        })

      if (reserveError) throw reserveError
      if (granted !== true) break

      attempted++

      try {
        const url = await privateUrl(
          recipient.role,
          recipient.leadId
        )

        const result = await notifyLeadOnce({
          eventKey:
            `historic:${CAMPAIGN}:${recipientKey}`,

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
              ? `Tenés ${recipient.matches.size} candidatos compatibles para revisar.`
              : `Tenés ${recipient.matches.size} propiedades compatibles para revisar.`,

          url,
          skipWhatsApp: false,
        })

        if (!result.ok) failed++
      } catch (error) {
        console.error(
          "historical backfill recipient error",
          {
            role: recipient.role,
            error,
          }
        )

        failed++
      }
    }

    return NextResponse.json({
      ok: failed === 0,
      mode: "send",
      attempted,
      failed,
    })
  } catch (error) {
    console.error("historical backfill error", error)

    return NextResponse.json(
      {
        ok: false,
        error: "historical_backfill_failed",
      },
      { status: 500 }
    )
  }
}
