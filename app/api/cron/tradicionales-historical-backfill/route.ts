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

  // CORREGIDO:
