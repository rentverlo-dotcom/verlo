import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"
import { sendPushToLead } from "@/lib/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function POST(
  request: Request
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

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
      action !==
        "tenant_interest"
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
    // 1. VALIDAR TOKEN DEL TENANT PARA ESTE MATCH
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
          error:
            "Invalid token",
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
      ).getTime() <
        Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Expired token",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 2. MATCH
    // =========================================================

    const {
      data: match,
      error: matchError,
    } =
      await supabase
        .from(
          "lead_matches"
        )
        .select(`
          id,
          tenant_lead_id,
          owner_lead_id,
          score,
          tenant_interest_at,
          owner_interest_at,
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

    const now =
      new Date()
        .toISOString()

    // =========================================================
    // 3. REGISTRAR OK DEL TENANT
    // =========================================================

    if (
      !match.tenant_interest_at
    ) {
      const {
        error:
          interestUpdateError,
      } =
        await supabase
          .from(
            "lead_matches"
          )
          .update({
            tenant_interest_at:
              now,
          })
          .eq(
            "id",
            match.id
          )

      if (
        interestUpdateError
      ) {
        throw new Error(
          interestUpdateError.message
        )
      }
    }

    // =========================================================
    // 4. TOKEN OWNER PARA ESTE MATCH
    // =========================================================

    let ownerToken:
      string | null = null

    const {
      data:
        existingOwnerToken,
      error:
        ownerTokenError,
    } =
      await supabase
        .from(
          "match_access_tokens"
        )
        .select(`
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
      ownerTokenError
    ) {
      throw new Error(
        ownerTokenError.message
      )
    }

    const validOwnerToken =
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

    if (
      validOwnerToken
    ) {
      ownerToken =
        existingOwnerToken.token
    } else {
      ownerToken =
        randomBytes(32)
          .toString(
            "hex"
          )

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
          insertTokenError,
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

            token:
              ownerToken,

            audience:
              "owner",

            expires_at:
              expiresAt,
          })

      if (
        insertTokenError
      ) {
        throw new Error(
          insertTokenError.message
        )
      }
    }

    const ownerDecisionUrl =
      `/candidato/${ownerToken}`

    // =========================================================
    // 5. TENANT
    //
    // Solo necesitamos el nombre para el mensaje provisorio.
    // El copy definitivo se define después.
    // =========================================================

    const {
      data: tenant,
      error: tenantError,
    } =
      await supabase
        .from(
          "lead_intake"
        )
        .select(`
          id,
          full_name
        `)
        .eq(
          "id",
          match.tenant_lead_id
        )
        .single()

    if (
      tenantError
    ) {
      console.error(
        "tenant lookup error:",
        tenantError
      )
    }

    const tenantFirstName =
      clean(
        tenant?.full_name
      ).split(
        /\s+/
      )[0] ||
      "Una persona"

    // =========================================================
    // 6. TENANT DIJO "ME INTERESA" -> PUSH AL OWNER
    //
    // Este reemplaza completamente:
    // GHL_OWNER_MATCH_INTEREST_WEBHOOK_URL
    //
    // No cambia la lógica del match.
    // Solo cambia el canal de aviso.
    // =========================================================

    let ownerNotified =
      false

    let pushResult:
      unknown = null

    try {
      pushResult =
        await sendPushToLead(
          match.owner_lead_id,
          {
            title:
              "Verlo · Hay interés",

            body:
              `${tenantFirstName} quiere avanzar con tu propiedad. Revisá su perfil.`,

            url:
              ownerDecisionUrl,
          }
        )

      const sent =
        Number(
          (
            pushResult as {
              sent?: number
            }
          )?.sent ||
            0
        )

      ownerNotified =
        sent >
        0
    } catch (
      pushError
    ) {
      console.error(
        "owner interest push error:",
        pushError
      )
    }

    // =========================================================
    // 7. RESPONSE
    // =========================================================

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

      push_result:
        pushResult,
    })
  } catch (
    error
  ) {
    console.error(
      "match-interest error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error",
      },
      {
        status: 500,
      }
    )
  }
}
