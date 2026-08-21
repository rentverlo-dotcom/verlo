import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    const readyWebhook =
      process.env
        .GHL_READY_TO_CONNECT_WEBHOOK_URL

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing configuration",
        },
        {
          status: 500,
        }
      )
    }

    const supabase =
      createClient(
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
      await request
        .json()
        .catch(() => ({}))

    const token =
      clean(body?.token)

    const matchId =
      clean(body?.match_id)

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing token",
        },
        {
          status: 400,
        }
      )
    }

    if (!matchId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing match_id",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. VALIDAR TOKEN AGREGADO DEL OWNER
    // =========================================================

    const {
      data: accessToken,
      error: tokenError,
    } = await supabase
      .from(
        "owner_candidates_access_tokens"
      )
      .select(`
        id,
        owner_lead_id,
        expires_at,
        revoked_at
      `)
      .eq(
        "token",
        token
      )
      .single()

    if (
      tokenError ||
      !accessToken
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid token",
        },
        {
          status: 404,
        }
      )
    }

    if (
      accessToken.revoked_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Token revoked",
        },
        {
          status: 403,
        }
      )
    }

    if (
      accessToken.expires_at &&
      new Date(
        accessToken.expires_at
      ).getTime() <
        Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Expired token",
        },
        {
          status: 403,
        }
      )
    }

    const ownerLeadId =
      accessToken.owner_lead_id

    // =========================================================
    // 2. BUSCAR MATCH ELEGIDO
    // =========================================================

    const {
      data: match,
      error: matchError,
    } = await supabase
      .from("lead_matches")
      .select(`
        id,
        tenant_lead_id,
        owner_lead_id,
        tenant_interest_at,
        tenant_verified_at,
        owner_interest_at,
        ready_to_connect_at,
        introduced_at
      `)
      .eq(
        "id",
        matchId
      )
      .eq(
        "owner_lead_id",
        ownerLeadId
      )
      .single()

    if (
      matchError ||
      !match
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Match not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 3. EL OWNER SOLO PUEDE ACEPTAR UN CANDIDATO
    // QUE YA MOSTRÓ INTERÉS Y COMPLETÓ VALIDACIÓN
    // =========================================================

    if (
      !match.tenant_interest_at ||
      !match.tenant_verified_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Tenant has not completed the candidate flow",
        },
        {
          status: 409,
        }
      )
    }

    const now =
      new Date().toISOString()

    const ownerInterestAt =
      match.owner_interest_at ||
      now

    const ready =
      Boolean(
        match.tenant_interest_at &&
        ownerInterestAt
      )

    const update:
      Record<
        string,
        string
      > = {
      owner_interest_at:
        ownerInterestAt,
    }

    if (
      ready &&
      !match.ready_to_connect_at
    ) {
      update.ready_to_connect_at =
        now
    }

    // =========================================================
    // 4. GUARDAR OK DEL OWNER
    // =========================================================

    const {
      error: updateError,
    } = await supabase
      .from("lead_matches")
      .update(update)
      .eq(
        "id",
        match.id
      )
      .eq(
        "owner_lead_id",
        ownerLeadId
      )

    if (updateError) {
      throw new Error(
        updateError.message
      )
    }

    const becameReady =
      ready &&
      !match.ready_to_connect_at

    // =========================================================
    // 5. DOBLE OK
    //
    // Solo dispara webhook la PRIMERA vez
    // que el match queda ready_to_connect.
    // =========================================================

    if (
      becameReady &&
      readyWebhook
    ) {
      try {
        const webhookResponse =
          await fetch(
            readyWebhook,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                event:
                  "ready_to_connect",

                source:
                  "verlo_double_opt_in",

                match_id:
                  match.id,

                tenant_lead_id:
                  match.tenant_lead_id,

                owner_lead_id:
                  match.owner_lead_id,

                ready_to_connect_at:
                  now,
              }),
            }
          )

        if (
          !webhookResponse.ok
        ) {
          console.error(
            "ready webhook error:",
            webhookResponse.status
          )
        }
      } catch (
        webhookError
      ) {
        console.error(
          "ready webhook request error:",
          webhookError
        )
      }
    }

    // =========================================================
    // 6. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      match_id:
        match.id,

      owner_interest:
        true,

      tenant_interest:
        true,

      tenant_verified:
        true,

      ready_to_connect:
        ready,

      became_ready:
        becameReady,
    })
  } catch (error) {
    console.error(
      "owner-interest error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Unexpected server error",
      },
      {
        status: 500,
      }
    )
  }
}
