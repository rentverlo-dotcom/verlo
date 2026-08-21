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
        {
          ok: false,
          error: "Missing Supabase env vars",
        },
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

    const tenantLeadId =
      String(body?.tenant_lead_id || "").trim()

    if (!tenantLeadId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing tenant_lead_id",
        },
        { status: 400 }
      )
    }

    // 1. VALIDAR TENANT

    const {
      data: tenantLead,
      error: tenantError,
    } = await supabase
      .from("lead_intake")
      .select(`
        id,
        full_name,
        phone,
        phone_normalized,
        role,
        intent
      `)
      .eq("id", tenantLeadId)
      .single()

    if (tenantError || !tenantLead) {
      return NextResponse.json(
        {
          ok: false,
          error: "Tenant lead not found",
        },
        { status: 404 }
      )
    }

    if (
      tenantLead.intent !== "tenant_search" &&
      tenantLead.role !== "tenant"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Lead is not a tenant",
        },
        { status: 400 }
      )
    }

    // 2. VERIFICAR QUE TENGA MATCHES ACTIVOS

    const {
      data: matches,
      error: matchesError,
    } = await supabase
      .from("lead_matches")
      .select(`
        id,
        owner_lead_id,
        score,
        status
      `)
      .eq("tenant_lead_id", tenantLeadId)
      .in("status", ACTIVE_MATCH_STATUSES)
      .gte("score", 80)
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
          error: "Tenant has no active matches",
        },
        { status: 409 }
      )
    }

    // 3. REUTILIZAR TOKEN ACTIVO

    const nowIso = new Date().toISOString()

    const {
      data: existingToken,
      error: tokenLookupError,
    } = await supabase
      .from("tenant_matches_access_tokens")
      .select(`
        id,
        token,
        expires_at
      `)
      .eq("tenant_lead_id", tenantLeadId)
      .is("revoked_at", null)
      .or(
        `expires_at.is.null,expires_at.gt.${nowIso}`
      )
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

        tenant_lead_id: tenantLeadId,

        token: existingToken.token,

        matches_url:
          `https://verlo.lat/matches/${existingToken.token}`,

        match_count: matches.length,

        best_match_score:
          Number(matches[0]?.score || 0),

        reused: true,
      })
    }

    // 4. CREAR TOKEN PRIVADO DEL TENANT

    const token =
      randomBytes(32).toString("hex")

    const expiresAt =
      new Date(
        Date.now() +
          30 * 24 * 60 * 60 * 1000
      ).toISOString()

    const {
      error: tokenInsertError,
    } = await supabase
      .from("tenant_matches_access_tokens")
      .insert({
        tenant_lead_id: tenantLeadId,
        token,
        expires_at: expiresAt,
      })

    if (tokenInsertError) {
      throw new Error(tokenInsertError.message)
    }

    // 5. URL ÚNICA CON TODOS LOS MATCHES

    const matchesUrl =
      `https://verlo.lat/matches/${token}`

    return NextResponse.json({
      ok: true,

      tenant_lead_id: tenantLeadId,

      token,

      matches_url: matchesUrl,

      match_count: matches.length,

      best_match_score:
        Number(matches[0]?.score || 0),

      reused: false,
    })
  } catch (error) {
    console.error(
      "tenant-matches-token error:",
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
