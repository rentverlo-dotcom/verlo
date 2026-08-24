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

    // =========================================================
    // 1. VALIDAR TOKEN
    // =========================================================

    const {
      data: accessToken,
      error: tokenError,
    } = await supabase
      .from(
        "lead_contract_access_tokens"
      )
      .select(`
        contract_id,
        lead_id,
        role,
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

    // =========================================================
    // 2. TRAER CONTRATO
    // =========================================================

    const {
      data: contract,
      error: contractError,
    } = await supabase
      .from("lead_contracts")
      .select(`
        id,
        lead_match_id,
        tenant_lead_id,
        owner_lead_id,
        status,
        content,
        tenant_agreed_at,
        owner_agreed_at
      `)
      .eq(
        "id",
        accessToken.contract_id
      )
      .single()

    if (
      contractError ||
      !contract
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Contract not found",
        },
        {
          status: 404,
        }
      )
    }

    if (
      !contract.content ||
      (
        contract.status !==
          "generated" &&
        contract.status !==
          "agreed"
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Contract has not been generated yet",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 3. VERIFICAR QUE EL TOKEN CORRESPONDA A LA PARTE
    // =========================================================

    if (
      accessToken.role ===
        "tenant" &&
      accessToken.lead_id !==
        contract.tenant_lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid tenant access",
        },
        {
          status: 403,
        }
      )
    }

    if (
      accessToken.role ===
        "owner" &&
      accessToken.lead_id !==
        contract.owner_lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid owner access",
        },
        {
          status: 403,
        }
      )
    }

    const now =
      new Date().toISOString()

    const tenantAgreedAt =
      accessToken.role ===
      "tenant"
        ? contract.tenant_agreed_at ||
          now
        : contract.tenant_agreed_at

    const ownerAgreedAt =
      accessToken.role ===
      "owner"
        ? contract.owner_agreed_at ||
          now
        : contract.owner_agreed_at

    const bothAgreed =
      Boolean(
        tenantAgreedAt &&
          ownerAgreedAt
      )

    // =========================================================
    // 4. GUARDAR ACEPTACIÓN
    // =========================================================

    const {
      error: updateError,
    } = await supabase
      .from("lead_contracts")
      .update({
        tenant_agreed_at:
          tenantAgreedAt,

        owner_agreed_at:
          ownerAgreedAt,

        status:
          bothAgreed
            ? "agreed"
            : "generated",

        updated_at:
          now,
      })
      .eq(
        "id",
        contract.id
      )

    if (updateError) {
      throw new Error(
        updateError.message
      )
    }

    // =========================================================
    // 5. SI LOS DOS ACEPTARON:
    // CERRAR EL MATCH
    // =========================================================

    if (bothAgreed) {
      const {
        error: matchUpdateError,
      } = await supabase
        .from("lead_matches")
        .update({
          status:
            "converted",
        })
        .eq(
          "id",
          contract.lead_match_id
        )

      if (
        matchUpdateError
      ) {
        throw new Error(
          matchUpdateError.message
        )
      }
    }

    // =========================================================
    // 6. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      role:
        accessToken.role,

      agreed:
        true,

      tenant_agreed:
        Boolean(
          tenantAgreedAt
        ),

      owner_agreed:
        Boolean(
          ownerAgreedAt
        ),

      both_agreed:
        bothAgreed,

      contract_status:
        bothAgreed
          ? "agreed"
          : "generated",

      match_status:
        bothAgreed
          ? "converted"
          : null,
    })
  } catch (error) {
    console.error(
      "closing-agree error:",
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
