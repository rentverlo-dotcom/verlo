import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

function firstName(fullName: string | null) {
  const value = clean(fullName)

  if (!value) {
    return "Candidato"
  }

  return value.split(/\s+/)[0] || "Candidato"
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
    // 1. VALIDAR TOKEN DEL OWNER
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
    // 2. OWNER
    // =========================================================

    const {
      data: owner,
      error: ownerError,
    } = await supabase
      .from("lead_intake")
      .select(`
        id,
        full_name,
        zone,
        neighborhood_label,
        neighborhood_labels,
        property_type,
        property_rooms,
        approx_price,
        approx_price_number,
        availability_status
      `)
      .eq(
        "id",
        ownerLeadId
      )
      .single()

    if (
      ownerError ||
      !owner
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Owner not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 3. MATCHES CON INTERÉS REAL DEL TENANT
    // =========================================================

    const {
      data: matches,
      error: matchesError,
    } = await supabase
      .from("lead_matches")
      .select(`
        id,
        tenant_lead_id,
        owner_lead_id,
        score,
        reasons,
        status,
        tenant_interest_at,
        tenant_verified_at,
        owner_interest_at,
        ready_to_connect_at,
        introduced_at
      `)
      .eq(
        "owner_lead_id",
        ownerLeadId
      )
      .not(
        "tenant_interest_at",
        "is",
        null
      )
      .not(
        "tenant_verified_at",
        "is",
        null
      )
      .in(
        "status",
        [
          "new",
          "reviewed",
          "contacted",
          "converted",
        ]
      )
      .order(
        "score",
        {
          ascending: false,
        }
      )

    if (matchesError) {
      console.error(
        "candidates-view matches error:",
        matchesError
      )

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not load candidates",
        },
        {
          status: 500,
        }
      )
    }

    if (
      !matches ||
      matches.length === 0
    ) {
      return NextResponse.json({
        ok: true,

        owner: {
          id:
            owner.id,

          first_name:
            firstName(
              owner.full_name
            ),

          zone:
            owner.zone || null,

          neighborhood:
            owner.neighborhood_label ||
            owner.neighborhood_labels?.[0] ||
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
            owner.approx_price_number ||
            null,

          availability_status:
            owner.availability_status ||
            null,
        },

        count: 0,

        candidates: [],
      })
    }

    // =========================================================
    // 4. BUSCAR DATOS DE TODOS LOS TENANTS
    // =========================================================

    const tenantLeadIds =
      Array.from(
        new Set(
          matches.map(
            (match) =>
              match.tenant_lead_id
          )
        )
      )

    const {
      data: tenants,
      error: tenantsError,
    } = await supabase
      .from("lead_intake")
      .select(`
        id,
        full_name,
        desired_property_type,
        desired_rooms,
        budget_range,
        budget_max,
        move_timing,
        income_proof_type,
        income_range,
        income_max,
        guarantee_types,
        neighborhood_label,
        neighborhood_labels,
        area_macro
      `)
      .in(
        "id",
        tenantLeadIds
      )

    if (tenantsError) {
      console.error(
        "candidates-view tenants error:",
        tenantsError
      )

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not load tenant data",
        },
        {
          status: 500,
        }
      )
    }

    // =========================================================
    // 5. VERIFICACIONES REUTILIZABLES
    // =========================================================

    const {
      data: verifications,
      error:
        verificationsError,
    } = await supabase
      .from(
        "tenant_verifications"
      )
      .select(`
        id,
        lead_id,
        match_id,
        dni_front_path,
        dni_back_path,
        selfie_path,
        income_proof_path,
        document_number,
        employment_status,
        income_range,
        guarantee_type,
        move_notes,
        status,
        reviewed_at,
        created_at
      `)
      .in(
        "lead_id",
        tenantLeadIds
      )
      .is(
        "match_id",
        null
      )
      .in(
        "status",
        [
          "submitted",
          "approved",
        ]
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )

    if (
      verificationsError
    ) {
      console.error(
        "candidates-view verifications error:",
        verificationsError
      )

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not load verifications",
        },
        {
          status: 500,
        }
      )
    }

    // =========================================================
    // 6. TOMAR LA ÚLTIMA VERIFICACIÓN DE CADA TENANT
    // =========================================================

    const verificationByLead =
      new Map<string, any>()

    for (
      const verification of
        verifications || []
    ) {
      if (
        !verificationByLead.has(
          verification.lead_id
        )
      ) {
        verificationByLead.set(
          verification.lead_id,
          verification
        )
      }
    }

    const tenantById =
      new Map(
        (tenants || []).map(
          (tenant) => [
            tenant.id,
            tenant,
          ]
        )
      )

    // =========================================================
    // 7. ARMAR CANDIDATOS
    // =========================================================

    const candidates =
      matches
        .map((match) => {
          const tenant =
            tenantById.get(
              match.tenant_lead_id
            )

          const verification =
            verificationByLead.get(
              match.tenant_lead_id
            )

          if (
            !tenant ||
            !verification
          ) {
            return null
          }

          return {
            match: {
              id:
                match.id,

              score:
                Number(
                  match.score || 0
                ),

              reasons:
                match.reasons || {},

              tenant_interest:
                Boolean(
                  match.tenant_interest_at
                ),

              tenant_verified:
                Boolean(
                  match.tenant_verified_at
                ),

              owner_interest:
                Boolean(
                  match.owner_interest_at
                ),

              ready_to_connect:
                Boolean(
                  match.ready_to_connect_at
                ),

              introduced:
                Boolean(
                  match.introduced_at
                ),
            },

            tenant: {
              first_name:
                firstName(
                  tenant.full_name
                ),

              budget_range:
                tenant.budget_range ||
                null,

              budget_max:
                tenant.budget_max ??
                null,

              move_timing:
                tenant.move_timing ||
                null,

              property_type:
                tenant
                  .desired_property_type ||
                null,

              rooms:
                tenant.desired_rooms ||
                null,

              neighborhood:
                tenant
                  .neighborhood_label ||
                tenant
                  .neighborhood_labels?.[0] ||
                tenant.area_macro ||
                null,

              income_proof_type:
                tenant.income_proof_type ||
                null,

              income_range:
                verification.income_range ||
                tenant.income_range ||
                null,

              income_max:
                tenant.income_max ??
                null,

              guarantee_types:
                Array.isArray(
                  tenant.guarantee_types
                )
                  ? tenant.guarantee_types
                  : [],

              employment_status:
                verification
                  .employment_status ||
                null,

              guarantee_type:
                verification
                  .guarantee_type ||
                null,

              move_notes:
                verification
                  .move_notes ||
                null,
            },

            verification: {
              status:
                verification.status,

              has_dni_front:
                Boolean(
                  verification
                    .dni_front_path
                ),

              has_dni_back:
                Boolean(
                  verification
                    .dni_back_path
                ),

              has_selfie:
                Boolean(
                  verification
                    .selfie_path
                ),

              has_income_proof:
                Boolean(
                  verification
                    .income_proof_path
                ),

              reviewed:
                Boolean(
                  verification.reviewed_at
                ),
            },
          }
        })
        .filter(Boolean)

    // =========================================================
    // 8. RESPUESTA
    //
    // NO DEVOLVEMOS:
    // email
    // teléfono
    // DNI
    // paths de archivos
    //
    // hasta que exista doble OK.
    // =========================================================

    return NextResponse.json({
      ok: true,

      owner: {
        id:
          owner.id,

        first_name:
          firstName(
            owner.full_name
          ),

        zone:
          owner.zone ||
          null,

        neighborhood:
          owner.neighborhood_label ||
          owner.neighborhood_labels?.[0] ||
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
          owner.approx_price_number ||
          null,

        availability_status:
          owner.availability_status ||
          null,
      },

      count:
        candidates.length,

      candidates,
    })
  } catch (error) {
    console.error(
      "candidates-view error:",
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
