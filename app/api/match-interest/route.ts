import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

function normalizePhone(value: unknown) {
  return clean(value).replace(/\D/g, "")
}

export async function POST(
  request: Request
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    const ownerInterestWebhook =
      process.env
        .GHL_OWNER_MATCH_INTEREST_WEBHOOK_URL

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing Supabase env vars",
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

    const action =
      clean(body?.action)

    if (
      !token ||
      action !== "tenant_interest"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid request",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. VALIDAR TOKEN DEL TENANT
    // =========================================================

    const {
      data: accessToken,
      error: tokenError,
    } =
      await supabase
        .from(
          "match_access_tokens"
        )
        .select(`
          id,
          match_id,
          lead_id,
          audience,
          expires_at
        `)
        .eq(
          "token",
          token
        )
        .eq(
          "audience",
          "tenant"
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
        {
          status: 403,
        }
      )
    }

    if (!accessToken.match_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Match missing",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 2. LEER MATCH
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
          score,
          status,
          reasons,
          ready_to_connect_at
        `)
        .eq(
          "id",
          accessToken.match_id
        )
        .single()

    if (
      matchError ||
      !match
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Match not found",
        },
        {
          status: 404,
        }
      )
    }

    if (
      match.tenant_lead_id !==
      accessToken.lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Unauthorized token",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 3. EVITAR DOBLE OK DEL TENANT
    // =========================================================

    const {
      data: existingInterest,
      error: existingInterestError,
    } =
      await supabase
        .from(
          "match_connection_events"
        )
        .select("id")
        .eq(
          "match_id",
          match.id
        )
        .eq(
          "direction",
          "tenant"
        )
        .eq(
          "message_template",
          "tenant_interest"
        )
        .limit(1)
        .maybeSingle()

    if (
      existingInterestError
    ) {
      throw new Error(
        existingInterestError.message
      )
    }

    if (!existingInterest) {
      const {
        error: interestError,
      } =
        await supabase
          .from(
            "match_connection_events"
          )
          .insert({
            match_id:
              match.id,

            tenant_lead_id:
              match.tenant_lead_id,

            owner_lead_id:
              match.owner_lead_id,

            channel:
              "ghl",

            direction:
              "tenant",

            message_template:
              "tenant_interest",

            admin_note:
              "Tenant confirmó interés desde la página del match",
          })

      if (interestError) {
        throw new Error(
          interestError.message
        )
      }
    }

    // =========================================================
    // 4. CREAR / REUTILIZAR TOKEN PARA EL OWNER
    //
    // Este token es DEL MATCH.
    // No es el token para subir fotos.
    // =========================================================

    let ownerToken:
      string | null = null

    const {
      data: existingOwnerToken,
      error:
        existingOwnerTokenError,
    } =
      await supabase
        .from(
          "match_access_tokens"
        )
        .select(`
          id,
          token,
          expires_at
        `)
        .eq(
          "match_id",
          match.id
        )
        .eq(
          "lead_id",
          match.owner_lead_id
        )
        .eq(
          "audience",
          "owner"
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle()

    if (
      existingOwnerTokenError
    ) {
      throw new Error(
        existingOwnerTokenError.message
      )
    }

    const ownerTokenValid =
      existingOwnerToken &&
      (
        !existingOwnerToken
          .expires_at ||
        new Date(
          existingOwnerToken
            .expires_at
        ).getTime() >
          Date.now()
      )

    if (ownerTokenValid) {
      ownerToken =
        existingOwnerToken.token
    } else {
      ownerToken =
        randomBytes(32)
          .toString("hex")

      const expiresAt =
        new Date(
          Date.now() +
            30 *
              24 *
              60 *
              60 *
              1000
        ).toISOString()

      const {
        error:
          ownerTokenInsertError,
      } =
        await supabase
          .from(
            "match_access_tokens"
          )
          .insert({
            match_id:
              match.id,

            lead_id:
              match.owner_lead_id,

            owner_prospect_id:
              null,

            token:
              ownerToken,

            audience:
              "owner",

            expires_at:
              expiresAt,
          })

      if (
        ownerTokenInsertError
      ) {
        throw new Error(
          ownerTokenInsertError.message
        )
      }
    }

    const ownerDecisionUrl =
      `https://verlo.lat/match-owner/${ownerToken}`

    // =========================================================
    // 5. LEER OWNER + TENANT
    // =========================================================

    const {
      data: owner,
      error: ownerError,
    } =
      await supabase
        .from("lead_intake")
        .select(`
          id,
          full_name,
          phone,
          phone_normalized,
          email,
          neighborhood_slug,
          property_type,
          property_rooms,
          approx_price_number
        `)
        .eq(
          "id",
          match.owner_lead_id
        )
        .single()

    if (ownerError) {
      throw new Error(
        ownerError.message
      )
    }

    const {
      data: tenant,
      error: tenantError,
    } =
      await supabase
        .from("lead_intake")
        .select(`
          id,
          full_name,
          budget_max,
          move_timing,
          income_proof_type,
          income_range,
          income_max,
          guarantee_types
        `)
        .eq(
          "id",
          match.tenant_lead_id
        )
        .single()

    if (tenantError) {
      throw new Error(
        tenantError.message
      )
    }

    // =========================================================
    // 6. AVISAR AL OWNER POR GHL
    // =========================================================

    let ownerNotified =
      false

    if (
      ownerInterestWebhook &&
      owner
    ) {
      const response =
        await fetch(
          ownerInterestWebhook,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                lead_id:
                  owner.id,

                full_name:
                  owner.full_name,

                first_name:
                  clean(
                    owner.full_name
                  ).split(/\s+/)[0] ||
                  "",

                phone:
                  normalizePhone(
                    owner
                      .phone_normalized ||
                      owner.phone
                  ),

                email:
                  clean(
                    owner.email
                  ).toLowerCase(),

                role:
                  "owner",

                match_id:
                  match.id,

                tenant_lead_id:
                  tenant?.id,

                tenant_name:
                  tenant?.full_name,

                tenant_budget:
                  tenant?.budget_max,

                tenant_move_timing:
                  tenant?.move_timing,

                tenant_income_proof:
                  tenant
                    ?.income_proof_type,

                tenant_income_range:
                  tenant
                    ?.income_range,

                tenant_income_max:
                  tenant
                    ?.income_max,

                tenant_guarantees:
                  tenant
                    ?.guarantee_types,

                verlo_match_score:
                  Number(
                    match.score || 0
                  ),

                verlo_owner_decision_url:
                  ownerDecisionUrl,

                source:
                  "verlo_tenant_interest",

                tags: [
                  "verlo_lead",
                  "verlo_owner",
                  "verlo_tenant_interested",
                ],
              }),
          }
        )

      ownerNotified =
        response.ok

      if (!response.ok) {
        console.error(
          "Owner interest webhook failed",
          response.status
        )
      }
    }

    // =========================================================
    // 7. LOG DEL AVISO
    // =========================================================

    if (ownerNotified) {
      await supabase
        .from(
          "match_connection_events"
        )
        .insert({
          match_id:
            match.id,

          tenant_lead_id:
            match.tenant_lead_id,

          owner_lead_id:
            match.owner_lead_id,

          channel:
            "ghl",

          direction:
            "owner",

          message_template:
            "tenant_interested_owner_notification",

          admin_note:
            "Se notificó al propietario que el tenant quiere avanzar",
        })
    }

    return NextResponse.json({
      ok: true,

      match_id:
        match.id,

      tenant_interest:
        true,

      owner_notified:
        ownerNotified,

      owner_decision_url:
        ownerDecisionUrl,
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
      {
        status: 500,
      }
    )
  }
}
