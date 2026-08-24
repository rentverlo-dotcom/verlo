import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function GET(
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
          error: "Missing Supabase env vars",
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

    const token =
      clean(
        request.nextUrl.searchParams.get(
          "token"
        )
      )

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

    if (accessToken.revoked_at) {
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
        monthly_price,
        deposit,
        start_date,
        end_date,
        adjustment_method,
        terms_json,
        content,
        tenant_agreed_at,
        owner_agreed_at,
        created_at,
        updated_at
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

    // =========================================================
    // 3. VALIDAR QUE EL MATCH SIGA EXISTIENDO Y ESTÉ READY
    // =========================================================

    const {
      data: match,
      error: matchError,
    } = await supabase
      .from("lead_matches")
      .select(`
        id,
        score,
        status,
        tenant_lead_id,
        owner_lead_id,
        tenant_interest_at,
        tenant_verified_at,
        owner_interest_at,
        ready_to_connect_at
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

    if (!match.ready_to_connect_at) {
      return NextResponse.json(
        {
          ok: false,
          error: "Match is not ready to close",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 4. TRAER TENANT + OWNER
    // =========================================================

    const {
      data: people,
      error: peopleError,
    } = await supabase
      .from("lead_intake")
      .select(`
        id,
        full_name,
        email,
        phone,
        phone_normalized,
        zone,
        area_macro,
        neighborhood_labels,
        property_type,
        property_rooms,
        approx_price,
        approx_price_number,
        availability_status
      `)
      .in(
        "id",
        [
          contract.tenant_lead_id,
          contract.owner_lead_id,
        ]
      )

    if (peopleError) {
      throw new Error(
        peopleError.message
      )
    }

    const tenant =
      (people || []).find(
        (person) =>
          person.id ===
          contract.tenant_lead_id
      )

    const owner =
      (people || []).find(
        (person) =>
          person.id ===
          contract.owner_lead_id
      )

    if (
      !tenant ||
      !owner
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Tenant or owner not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 5. DATOS COMPLETOS DE LA PROPIEDAD
    // =========================================================

    const {
      data: completion,
      error: completionError,
    } = await supabase
      .from(
        "owner_property_completions"
      )
      .select(`
        id,
        private_address,
        floor_unit,
        expenses_amount,
        availability_status,
        requirements,
        visit_conditions,
        property_notes,
        status
      `)
      .eq(
        "lead_id",
        contract.owner_lead_id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle()

    if (completionError) {
      console.error(
        "closing completion lookup error:",
        completionError
      )
    }

    // =========================================================
    // 6. RESPUESTA
    // =========================================================

    return NextResponse.json({
      ok: true,

      viewer: {
        role:
          accessToken.role,

        lead_id:
          accessToken.lead_id,
      },

      contract: {
        id:
          contract.id,

        match_id:
          contract.lead_match_id,

        status:
          contract.status,

        monthly_price:
          contract.monthly_price,

        deposit:
          contract.deposit,

        start_date:
          contract.start_date,

        end_date:
          contract.end_date,

        adjustment_method:
          contract.adjustment_method,

        terms:
          contract.terms_json || {},

        content:
          contract.content,

        tenant_agreed:
          Boolean(
            contract.tenant_agreed_at
          ),

        owner_agreed:
          Boolean(
            contract.owner_agreed_at
          ),

        tenant_agreed_at:
          contract.tenant_agreed_at,

        owner_agreed_at:
          contract.owner_agreed_at,
      },

      match: {
        id:
          match.id,

        score:
          Number(
            match.score || 0
          ),

        status:
          match.status,

        ready_to_connect_at:
          match.ready_to_connect_at,
      },

      tenant: {
        id:
          tenant.id,

        full_name:
          tenant.full_name,

        email:
          tenant.email,

        phone:
          tenant.phone_normalized ||
          tenant.phone,
      },

      owner: {
        id:
          owner.id,

        full_name:
          owner.full_name,

        email:
          owner.email,

        phone:
          owner.phone_normalized ||
          owner.phone,
      },

      property: {
        address:
          completion?.private_address ||
          null,

        floor_unit:
          completion?.floor_unit ||
          null,

        neighborhood:
          owner
            .neighborhood_labels?.[0] ||
          owner.area_macro ||
          owner.zone ||
          null,

        property_type:
          owner.property_type ||
          null,

        rooms:
          owner.property_rooms ||
          null,

        approx_price:
          owner.approx_price ||
          null,

        approx_price_number:
          owner.approx_price_number ??
          null,

        expenses_amount:
          completion?.expenses_amount ??
          null,

        availability_status:
          completion
            ?.availability_status ||
          owner.availability_status ||
          null,

        requirements:
          completion?.requirements ||
          null,

        visit_conditions:
          completion
            ?.visit_conditions ||
          null,

        notes:
          completion?.property_notes ||
          null,
      },
    })
  } catch (error) {
    console.error(
      "closing-view error:",
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
