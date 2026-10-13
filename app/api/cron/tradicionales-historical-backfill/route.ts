import { createHash, randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { notifyLeadOnce } from "@/lib/lead-notifications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 240

const CUTOFF = "2026-10-09T13:45:00.000Z"
const CAMPAIGN = "oct2026_recovery"

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
}

function digest(value: string) {
  return createHash("sha256")
    .update(value)
    .digest("hex")
}

function identity(lead: Lead) {
  const phone = (
    lead.phone_normalized || ""
  ).trim()

  const email = (
    lead.email || ""
  )
    .trim()
    .toLowerCase()

  return phone
    ? `phone:${phone}`
    : email
      ? `email:${email}`
      : `lead:${lead.id}`
}

async function privateUrl(
  role: Role,
  leadId: string
) {
  const table =
    role === "owner"
      ? "owner_candidates_access_tokens"
      : "tenant_matches_access_tokens"

  const column =
    role === "owner"
      ? "owner_lead_id"
      : "tenant_lead_id"

  const { data, error } =
    await supabaseAdmin
      .from(table)
      .select("token")
      .eq(column, leadId)
      .is("revoked_at", null)
      .or(
        `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

  if (error) throw error

  let token = data?.token

  if (!token) {
    token = randomBytes(32)
      .toString("hex")

    const { error: insertError } =
      await supabaseAdmin
        .from(table)
        .insert({
          [column]: leadId,
          token,
          expires_at: new Date(
            Date.now() +
              30 * 86400000
          ).toISOString(),
        })

    if (insertError) {
      throw insertError
    }
  }

  return `${
    role === "owner"
      ? "/candidatos"
      : "/matches"
  }/${token}`
}

async function recipients(): Promise<
  Recipient[]
> {
  const {
    data: staged,
    error: stagedError,
  } = await supabaseAdmin
    .from(
      "traditional_historical_backfill_matches"
    )
    .select("match_id")
    .eq("campaign", CAMPAIGN)
    .eq("state", "staged")
    .limit(500)

  if (stagedError) {
    throw stagedError
  }

  if (!staged?.length) {
    return []
  }

  const {
    data: matches,
    error: matchError,
  } = await supabaseAdmin
    .from("lead_matches")
    .select(
      "id,tenant_lead_id,owner_lead_id"
    )
    .in(
      "id",
      staged.map((x) => x.match_id)
    )
    .lt("created_at", CUTOFF)
    .gte("score", 80)
    .in("status", ACTIVE)

  if (matchError) {
    throw matchError
  }

  const rows = (matches || []) as Match[]

  const ids = Array.from(new Set(rows.flatMap((x) => [
    x.owner_lead_id, x.tenant_lead_id,
  ])))
  if (!ids.length) return []
  const { data: leads, error: leadError } = await supabaseAdmin
    .from("lead_intake").select("id,email,phone_normalized").in("id", ids)
  if (leadError) throw leadError
  const byId = new Map((leads || []).map((lead) => [lead.id, lead as Lead]))
  const grouped = new Map<string, Recipient>()
  for (const match of rows) {
    const owner = byId.get(match.owner_lead_id)
    const tenant = byId.get(match.tenant_lead_id)
    if (!owner || !tenant) continue
    if ([owner, tenant].some((lead) => (lead.email || "").toLowerCase().endsWith("@example.com"))) continue
    const participants: Array<{ role: Role; lead: Lead }> = [
      { role: "owner", lead: owner },
      { role: "tenant", lead: tenant },
    ]
    for (const { role, lead } of participants) {
      if (!lead.email && !lead.phone_normalized) continue
      const key = `${role}:${identity(lead)}`
      if (!grouped.has(key)) grouped.set(key, {
        role, leadId: lead.id, identity: key, matches: new Set<string>(),
      })
      grouped.get(key)!.matches.add(match.id)
    }
  }
  return Array.from(grouped.values()).sort((a, b) =>
    b.matches.size - a.matches.size || a.identity.localeCompare(b.identity)
  )
}

// Read-only preview until delivery validation is complete.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  try {
    const candidates = await recipients()
    return NextResponse.json({
      ok: true,
      mode: "dry_run",
      recipients: candidates.length,
      owners: candidates.filter((r) => r.role === "owner").length,
      tenants: candidates.filter((r) => r.role === "tenant").length,
      messages_sent: 0,
    })
  } catch (error) {
    console.error("backfill preview error", error)
    return NextResponse.json({ ok: false, error: "preview_failed" }, { status: 500 })
  }
}
