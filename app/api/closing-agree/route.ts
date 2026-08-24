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
    // 1. VALIDAR TOKEN DE CIERRE
    // =========================================================

    const {
      data: accessToken,
      error: tokenError,
    } = await supabase
      .from(
        "lead_contract_access_tokens"
      )
      .select(`
        id,
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

    if (
      accessToken.role !==
        "tenant" &&
      accessToken.role !==
        "owner"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid role",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 2. CONTRATO
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
    // 3. VALIDAR QUE EL TOKEN SEA DE ESA PARTE
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

    // =========================================================
    // 4. MATCH DEBE SEGUIR SIENDO EL CORRECTO
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
        ready_to_connect_at,
        status
      `)
      .eq(
        "id",
        contract.lead_match_id
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

    if (
      match.tenant_lead_id !==
        contract.tenant_lead_id ||
      match.owner_lead_id !==
        contract.owner_lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Contract and match do not correspond",
        },
        {
          status: 409,
        }
      )
    }

    if (
      !match.ready_to_connect_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Match is not ready to close",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 5. GUARDAR ACEPTACIÓN
    // =========================================================

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

    const {
      error: contractUpdateError,
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

    if (
      contractUpdateError
    ) {
      throw new Error(
        contractUpdateError.message
      )
    }

    // =========================================================
    // 6. SI AMBOS ACEPTARON:
    // CIERRE OPERATIVO COMPLETO
    // =========================================================

    if (bothAgreed) {
      // -------------------------------------------------------
      // 6A. MATCH ELEGIDO = CONVERTED
      // -------------------------------------------------------

      const {
        error:
          convertedError,
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

      if (convertedError) {
        throw new Error(
          convertedError.message
        )
      }

      // -------------------------------------------------------
      // 6B. DESCARTAR RESTO DE MATCHES DE ESA BÚSQUEDA TENANT
      // -------------------------------------------------------

      const {
        error:
          tenantMatchesError,
      } = await supabase
        .from("lead_matches")
        .update({
          status:
            "discarded",
        })
        .eq(
          "tenant_lead_id",
          contract.tenant_lead_id
        )
        .neq(
          "id",
          contract.lead_match_id
        )
        .in(
          "status",
          [
            "new",
            "reviewed",
            "contacted",
          ]
        )

      if (
        tenantMatchesError
      ) {
        throw new Error(
          tenantMatchesError.message
        )
      }

      // -------------------------------------------------------
      // 6C. DESCARTAR RESTO DE MATCHES DE ESA PUBLICACIÓN OWNER
      // -------------------------------------------------------

      const {
        error:
          ownerMatchesError,
      } = await supabase
        .from("lead_matches")
        .update({
          status:
            "discarded",
        })
        .eq(
          "owner_lead_id",
          contract.owner_lead_id
        )
        .neq(
          "id",
          contract.lead_match_id
        )
        .in(
          "status",
          [
            "new",
            "reviewed",
            "contacted",
          ]
        )

      if (
        ownerMatchesError
      ) {
        throw new Error(
          ownerMatchesError.message
        )
      }

      // -------------------------------------------------------
      // 6D. CERRAR PANEL DE MATCHES DEL TENANT
      // -------------------------------------------------------

      const {
        error:
          tenantTokenError,
      } = await supabase
        .from(
          "tenant_matches_access_tokens"
        )
        .update({
          revoked_at:
            now,
        })
        .eq(
          "tenant_lead_id",
          contract.tenant_lead_id
        )
        .is(
          "revoked_at",
          null
        )

      if (
        tenantTokenError
      ) {
        throw new Error(
          tenantTokenError.message
        )
      }

      // -------------------------------------------------------
      // 6E. CERRAR PANEL DE CANDIDATOS DEL OWNER
      // -------------------------------------------------------

      const {
        error:
          ownerCandidatesTokenError,
      } = await supabase
        .from(
          "owner_candidates_access_tokens"
        )
        .update({
          revoked_at:
            now,
        })
        .eq(
          "owner_lead_id",
          contract.owner_lead_id
        )
        .is(
          "revoked_at",
          null
        )

      if (
        ownerCandidatesTokenError
      ) {
        throw new Error(
          ownerCandidatesTokenError.message
        )
      }

      // -------------------------------------------------------
      // 6F. CERRAR TOKEN DE CARGA DE ESA PUBLICACIÓN
      // -------------------------------------------------------

      const {
        error:
          ownerPropertyTokenError,
      } = await supabase
        .from(
          "owner_property_access_tokens"
        )
        .update({
          revoked_at:
            now,
        })
        .eq(
          "owner_lead_id",
          contract.owner_lead_id
        )
        .is(
          "revoked_at",
          null
        )

      if (
        ownerPropertyTokenError
      ) {
        throw new Error(
          ownerPropertyTokenError.message
        )
      }
    }

    // =========================================================
    // 7. RESPONSE
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
          : match.status,

      flow_closed:
        bothAgreed,
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
