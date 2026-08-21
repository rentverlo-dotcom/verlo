import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ACTIVE_MATCH_STATUSES = [
  "new",
  "reviewed",
  "contacted",
]

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      )
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const body = await req.json().catch(() => ({}))

    const ownerLeadId =
      String(body?.owner_lead_id || "").trim()

    if (!ownerLeadId) {
      return NextResponse.json(
        { ok: false, error: "Missing owner_lead_id" },
        { status: 400 }
      )
    }

    const {
      data: ownerLead,
      error: ownerError,
    } = await supabase
      .from("lead_intake")
      .select(`
        id,
        full_name,
        role,
        intent
      `)
      .eq("id", ownerLeadId)
      .single()

    if (ownerError || !ownerLead) {
      return NextResponse.json(
        { ok: false, error: "Owner lead not found" },
        { status: 404 }
      )
    }

    if (
      ownerLead.intent !== "owner_new_listing" &&
      ownerLead.role !== "owner"
    ) {
      return NextResponse.json(
        { ok: false, error: "Lead is not an owner property" },
        { status: 400 }
      )
    }

    const {
      data: matches,
      error: matchesError,
    } = await supabase
      .from("lead_matches")
      .select(`
        id,
        tenant_lead_id,
        score
      `)
      .eq("owner_lead_id", ownerLeadId)
      .in("status", ACTIVE_MATCH_STATUSES)
      .gte("score", 80)
      .not("tenant_interest_at", "is", null)
      .not("tenant_verified_at", "is", null)
      .order("score", {
        ascending: false,
      })

    if (matchesError) {
      throw new Error(matchesError.message)
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Property has no interested verified tenants",
        },
        { status: 409 }
      )
    }

    const nowIso = new Date().toISOString()

    const {
      data: existingToken,
      error: tokenLookupError,
    } = await supabase
      .from("owner_candidates_access_tokens")
      .select(`
        id,
        token,
        expires_at
      `)
      .eq("owner_lead_id", ownerLeadId)
      .is("revoked_at", null)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    if (tokenLookupError) {
      throw new Error(tokenLookupError.message)
    }

    if (existingToken) {
      return NextResponse.json({
        ok: true,
        owner_lead_id: ownerLeadId,
        token: existingToken.token,
        candidates_url:
          `https://verlo.lat/candidatos/${existingToken.token}`,
        candidate_count: matches.length,
        reused: true,
      })
    }

    const token =
      randomBytes(32).toString("hex")

    const expiresAt =
      new Date(
        Date.now() +
          30 * 24 * 60 * 60 * 1000
      ).toISOString()

    const { error: insertError } =
      await supabase
        .from("owner_candidates_access_tokens")
        .insert({
          owner_lead_id: ownerLeadId,
          token,
          expires_at: expiresAt,
        })

    if (insertError) {
      throw new Error(insertError.message)
    }

    return NextResponse.json({
      ok: true,
      owner_lead_id: ownerLeadId,
      token,
      candidates_url:
        `https://verlo.lat/candidatos/${token}`,
      candidate_count: matches.length,
      reused: false,
    })
  } catch (error) {
    console.error(
      "owner-candidates-token error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected server error",
      },
      { status: 500 }
    )
  }
}
