import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ACTIVE_MATCH_STATUSES = [
  "new",
  "reviewed",
  "contacted",
]

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function GET(
  req: NextRequest
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

    const token =
      clean(
        req.nextUrl.searchParams.get(
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

    // =========================================================
    // 1. VALIDAR TOKEN DEL TENANT
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
    // 2. MATCH
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
          owner_completed_at,
          ready_to_connect_at
        `)
        .eq(
          "id",
          accessToken.match_id
        )
        .in(
          "status",
          ACTIVE_MATCH_STATUSES
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

    // Seguridad:
    // el token tiene que pertenecer
    // al tenant de ESTE match.
    if (
      accessToken.lead_id !==
      match.tenant_lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized token",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 3. DATOS PÚBLICOS DE LA PROPIEDAD
    // =========================================================

    const {
      data: owner,
      error: ownerError,
    } =
      await supabase
        .from("lead_intake")
        .select(`
          id,
          neighborhood_slug,
          property_type,
          property_rooms,
          approx_price_number,
          availability_status,
          accepted_income_proof_types,
          min_income_ratio,
          accepted_guarantee_types
        `)
        .eq(
          "id",
          match.owner_lead_id
        )
        .single()

    if (
      ownerError ||
      !owner
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Property not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 4. COMPLEMENTO CARGADO POR OWNER
    // =========================================================

    const {
      data: completion,
      error: completionError,
    } =
      await supabase
        .from(
          "owner_property_completions"
        )
        .select(`
          id,
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
          match.owner_lead_id
        )
        .eq(
          "status",
          "submitted"
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
      throw new Error(
        completionError.message
      )
    }

    if (!completion) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Property is not ready yet",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 5. MULTIMEDIA R2
    // =========================================================

    const {
      data: media,
      error: mediaError,
    } =
      await supabase
        .from(
          "owner_property_media"
        )
        .select(`
          id,
          media_type,
          public_url,
          r2_key,
          content_type,
          original_filename,
          position
        `)
        .eq(
          "completion_id",
          completion.id
        )
        .order(
          "position",
          {
            ascending: true,
          }
        )

    if (mediaError) {
      throw new Error(
        mediaError.message
      )
    }

    if (
      !media ||
      media.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Property has no media",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 6. TENANT: SOLO PARA MOSTRAR SU COMPATIBILIDAD
    // =========================================================

    const {
      data: tenant,
      error: tenantError,
    } =
      await supabase
        .from("lead_intake")
        .select(`
          id,
          neighborhood_slugs,
          desired_property_type,
          desired_rooms,
          budget_max,
          move_timing
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
    // 7. NO EXPONEMOS:
    //
    // private_address
    // teléfono owner
    // email owner
    //
    // hasta doble OK.
    // =========================================================

    return NextResponse.json({
      ok: true,

      match: {
        id: match.id,
        score:
          Number(match.score || 0),
        reasons:
          match.reasons || {},
        ready_to_connect:
          Boolean(
            match.ready_to_connect_at
          ),
      },

      property: {
        owner_lead_id:
          match.owner_lead_id,

        neighborhood:
          owner.neighborhood_slug,

        property_type:
          owner.property_type,

        rooms:
          owner.property_rooms,

        price:
          owner.approx_price_number,

        availability:
          completion
            .availability_status ||
          owner.availability_status,

        expenses:
          completion.expenses_amount,

        floor_unit:
          completion.floor_unit,

        requirements:
          completion.requirements,

        visit_conditions:
          completion.visit_conditions,

        notes:
          completion.property_notes,

        accepted_income_proof_types:
          owner
            .accepted_income_proof_types ||
          [],

        min_income_ratio:
          owner.min_income_ratio,

        accepted_guarantee_types:
          owner
            .accepted_guarantee_types ||
          [],
      },

      media:
        media.map(
          (item) => ({
            id: item.id,

            type:
              item.media_type,

            url:
              item.public_url,

            key:
              item.r2_key,

            content_type:
              item.content_type,

            filename:
              item.original_filename,
          })
        ),

      tenant: tenant
        ? {
            desired_property_type:
              tenant
                .desired_property_type,

            desired_rooms:
              tenant.desired_rooms,

            budget_max:
              tenant.budget_max,

            move_timing:
              tenant.move_timing,

            neighborhoods:
              tenant
                .neighborhood_slugs ||
              [],
          }
        : null,
    })
  } catch (error) {
    console.error(
      "match-view error:",
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
