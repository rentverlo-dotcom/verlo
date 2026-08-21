import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function POST(request: Request) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing Supabase configuration",
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

    const body =
      await request.json().catch(() => ({}))

    const token =
      clean(body?.token)

    const action =
      clean(body?.action)

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing token",
        },
        { status: 400 }
      )
    }

    if (action !== "tenant_interest") {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid action",
        },
        { status: 400 }
      )
    }

    // =========================================================
    // 1. VALIDAR TOKEN TENANT
    // =========================================================

    const {
      data: accessToken,
      error: tokenError,
    } =
      await supabase
        .from("match_access_tokens")
        .select(`
          id,
          match_id,
          lead_id,
          audience,
          expires_at
        `)
        .eq("token", token)
        .eq("audience", "tenant")
        .single()

    if (tokenError || !accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid token",
        },
        { status: 404 }
      )
    }

    if (
      accessToken.expires_at &&
      new Date(
        accessToken.expires_at
      ).getTime() < Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Expired token",
        },
        { status: 403 }
      )
    }

    if (!accessToken.match_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Match missing",
        },
        { status: 404 }
      )
    }

    // =========================================================
    // 2. CARGAR MATCH
    // =========================================================

    const {
      data: match,
      error: matchError,
    } =
      await supabase
        .from("lead_matches")
        .select(`
          id,
          tenant_lead_id,
          owner_lead_id,
          tenant_interest_at,
          owner_interest_at,
          ready_to_connect_at
        `)
        .eq(
          "id",
          accessToken.match_id
        )
        .single()

    if (matchError || !match) {
      return NextResponse.json(
        {
          ok: false,
          error: "Match not found",
        },
        { status: 404 }
      )
    }

    // El token tiene que pertenecer
    // al tenant de este match.
    if (
      match.tenant_lead_id !==
      accessToken.lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized token",
        },
        { status: 403 }
      )
    }

    // =========================================================
    // 3. REGISTRAR OK DEL TENANT
    // =========================================================

    const now =
      new Date().toISOString()

    const tenantInterestAt =
      match.tenant_interest_at || now

    const bothInterested =
      Boolean(
        tenantInterestAt &&
        match.owner_interest_at
      )

    const updatePayload:
      Record<string, unknown> = {
        tenant_interest_at:
          tenantInterestAt,
      }

    if (
      bothInterested &&
      !match.ready_to_connect_at
    ) {
      updatePayload.ready_to_connect_at =
        now
    }

    const {
      error: updateError,
    } =
      await supabase
        .from("lead_matches")
        .update(updatePayload)
        .eq("id", match.id)

    if (updateError) {
      throw new Error(
        updateError.message
      )
    }

    // =========================================================
    // 4. DEJAR TOKEN MARCADO COMO USADO
    // SIN INVALIDARLO
    //
    // El tenant puede volver a abrir la propiedad.
    // =========================================================

    await supabase
      .from("match_access_tokens")
      .update({
        used_at: now,
      })
      .eq(
        "id",
        accessToken.id
      )

    return NextResponse.json({
      ok: true,

      match_id:
        match.id,

      tenant_interest:
        true,

      owner_interest:
        Boolean(
          match.owner_interest_at
        ),

      ready_to_connect:
        bothInterested,
    })
  } catch (error) {
    console.error(
      "match-interest error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Unexpected server error",
      },
      { status: 500 }
    )
  }
}
