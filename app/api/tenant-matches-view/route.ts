import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ACTIVE_MATCH_STATUSES = ["new", "reviewed", "contacted"]
const MIN_MATCH_SCORE = 80

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
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

    const token = clean(
      req.nextUrl.searchParams.get("token")
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

    // =========================================================
    // 1. VALIDAR TOKEN AGREGADO DEL TENANT
    // =========================================================

    const {
      data: accessToken,
      error: tokenError,
    } = await supabase
      .from("tenant_matches_access_tokens")
      .select(`
        id,
        tenant_lead_id,
        expires_at,
        revoked_at,
        first_opened_at,
        open_count
      `)
      .eq("token", token)
      .single()

    if (tokenError || !accessToken) {
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
      new Date(accessToken.expires_at).getTime() <
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
    // 1.B TRAZABILIDAD DE APERTURA
    // =========================================================

    const openedAt =
      new Date().toISOString()

    const {
      error: trackingError,
    } = await supabase
      .from("tenant_matches_access_tokens")
      .update({
        first_opened_at:
          accessToken.first_opened_at ||
          openedAt,

        last_opened_at:
          openedAt,

        open_count:
          Number(
            accessToken.open_count || 0
          ) + 1,
      })
      .eq(
        "id",
        accessToken.id
      )

    if (trackingError) {
      console.error(
        "tenant matches access tracking error:",
        trackingError
      )
    }

    const tenantLeadId =
      accessToken.tenant_lead_id

    // =========================================================
    // 2. DATOS DEL TENANT
    // =========================================================

    const {
      data: tenant,
      error: tenantError,
    } = await supabase
      .from("lead_intake")
      .select(`
        id,
        full_name,
        desired_property_type,
        desired_rooms,
        budget_max,
        move_timing,
        neighborhood_slugs
      `)
      .eq("id", tenantLeadId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        {
          ok: false,
          error: "Tenant not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 3. TODOS LOS MATCHES DEL TENANT
    // SOLO LOS QUE YA TIENEN OWNER COMPLETO
    // =========================================================

    const {
      data: matches,
      error: matchesError,
    } = await supabase
      .from("lead_matches")
      .select(`
        id,
        owner_lead_id,
        score,
        status,
        reasons,
        owner_completed_at,
        tenant_interest_at,
        owner_interest_at,
        ready_to_connect_at
      `)
      .eq(
        "tenant_lead_id",
        tenantLeadId
      )
      .gte(
        "score",
        MIN_MATCH_SCORE
      )
      .in(
        "status",
        ACTIVE_MATCH_STATUSES
      )
      .not(
        "owner_completed_at",
        "is",
        null
      )
      .order(
        "score",
        {
          ascending: false,
        }
      )

    if (matchesError) {
      throw new Error(
        matchesError.message
      )
    }

    if (
      !matches ||
      matches.length === 0
    ) {
      return NextResponse.json({
        ok: true,

        tenant: {
          id: tenant.id,
          full_name:
            tenant.full_name,
          desired_property_type:
            tenant.desired_property_type,
          desired_rooms:
            tenant.desired_rooms,
          budget_max:
            tenant.budget_max,
          move_timing:
            tenant.move_timing,
          neighborhoods:
            tenant.neighborhood_slugs ||
            [],
        },

        count: 0,

        matches: [],
      })
    }

    // =========================================================
    // 4. OWNERS / PROPIEDADES
    // =========================================================

    const ownerLeadIds =
      Array.from(
        new Set(
          matches.map(
            (match) =>
              match.owner_lead_id
          )
        )
      )

    const {
      data: owners,
      error: ownersError,
    } = await supabase
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
      .in(
        "id",
        ownerLeadIds
      )

    if (ownersError) {
      throw new Error(
        ownersError.message
      )
    }

    const ownersById =
      new Map(
        (owners || []).map(
          (owner) => [
            owner.id,
            owner,
          ]
        )
      )

    // =========================================================
    // 5. COMPLETIONS SUBMITTED
    // TOMAMOS LA ÚLTIMA DE CADA OWNER
    // =========================================================

    const {
      data: completions,
      error: completionsError,
    } = await supabase
      .from(
        "owner_property_completions"
      )
      .select(`
        id,
        lead_id,
        floor_unit,
        expenses_amount,
        availability_status,
        requirements,
        visit_conditions,
        property_notes,
        status,
        created_at
      `)
      .in(
        "lead_id",
        ownerLeadIds
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

    if (completionsError) {
      throw new Error(
        completionsError.message
      )
    }

    const completionByOwnerId =
      new Map<string, any>()

    for (
      const completion of
        completions || []
    ) {
      if (
        !completionByOwnerId.has(
          completion.lead_id
        )
      ) {
        completionByOwnerId.set(
          completion.lead_id,
          completion
        )
      }
    }

    const completionIds =
      Array.from(
        completionByOwnerId.values()
      ).map(
        (completion) =>
          completion.id
      )

    // =========================================================
    // 6. MEDIA
    // =========================================================

    let media: any[] = []

    if (
      completionIds.length > 0
    ) {
      const {
        data: mediaRows,
        error: mediaError,
      } = await supabase
        .from(
          "owner_property_media"
        )
        .select(`
          id,
          completion_id,
          media_type,
          public_url,
          r2_key,
          content_type,
          original_filename,
          position
        `)
        .in(
          "completion_id",
          completionIds
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

      media =
        mediaRows || []
    }

    const mediaByCompletionId =
      new Map<
        string,
        any[]
      >()

    for (
      const item of media
    ) {
      const list =
        mediaByCompletionId.get(
          item.completion_id
        ) || []

      list.push(item)

      mediaByCompletionId.set(
        item.completion_id,
        list
      )
    }

    // =========================================================
    // 7. ARMAR MATCHES VISIBLES
    // SOLO COMPLETION + MEDIA
    // =========================================================

    const visibleMatches =
      matches.flatMap(
        (match) => {
          const owner =
            ownersById.get(
              match.owner_lead_id
            )

          const completion =
            completionByOwnerId.get(
              match.owner_lead_id
            )

          if (
            !owner ||
            !completion
          ) {
            return []
          }

          const completionMedia =
            mediaByCompletionId.get(
              completion.id
            ) || []

          if (
            completionMedia.length === 0
          ) {
            return []
          }

          return [
            {
              id: match.id,

              score:
                Number(
                  match.score || 0
                ),

              reasons:
                match.reasons || {},

              tenant_interested:
                Boolean(
                  match.tenant_interest_at
                ),

              owner_interested:
                Boolean(
                  match.owner_interest_at
                ),

              ready_to_connect:
                Boolean(
                  match.ready_to_connect_at
                ),

              property: {
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
                  completion
                    .expenses_amount,

                floor_unit:
                  completion
                    .floor_unit,

                requirements:
                  completion
                    .requirements,

                visit_conditions:
                  completion
                    .visit_conditions,

                notes:
                  completion
                    .property_notes,

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
                completionMedia.map(
                  (item) => ({
                    id:
                      item.id,

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
            },
          ]
        }
      )

    // =========================================================
    // 8. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      tenant: {
        id:
          tenant.id,

        full_name:
          tenant.full_name,

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
      },

      count:
        visibleMatches.length,

      matches:
        visibleMatches,
    })
  } catch (error) {
    console.error(
      "tenant-matches-view error:",
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
