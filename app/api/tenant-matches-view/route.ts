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
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

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
        ready_to_connect_at,
        tenant_post_visit_decision,
        tenant_post_visit_decided_at,
        owner_post_visit_decision,
        owner_post_visit_decided_at
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

    // =========================================================
    // 6. TODA LA MEDIA DE LOS OWNERS
    // =========================================================

    let media: any[] = []

    if (
      ownerLeadIds.length > 0
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
          lead_id,
          completion_id,
          media_type,
          public_url,
          r2_key,
          content_type,
          original_filename,
          position
        `)
        .in(
          "lead_id",
          ownerLeadIds
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

    // =========================================================
    // 7. AGRUPAR MEDIA POR OWNER
    // =========================================================

    const mediaByOwnerId =
      new Map<
        string,
        any[]
      >()

    for (
      const item of media
    ) {
      const ownerLeadId =
        clean(
          item.lead_id
        )

      if (!ownerLeadId) {
        continue
      }

      const list =
        mediaByOwnerId.get(
          ownerLeadId
        ) || []

      list.push(item)

      mediaByOwnerId.set(
        ownerLeadId,
        list
      )
    }

    // =========================================================
    // 8. CONTRATOS + TOKEN DE CIERRE DEL TENANT
    // =========================================================

    const matchIds =
      matches.map(
        (match) =>
          match.id
      )

    const {
      data: contracts,
      error: contractsError,
    } = await supabase
      .from(
        "lead_contracts"
      )
      .select(`
        id,
        lead_match_id,
        tenant_lead_id,
        status
      `)
      .in(
        "lead_match_id",
        matchIds
      )
      .eq(
        "tenant_lead_id",
        tenantLeadId
      )

    if (contractsError) {
      throw new Error(
        contractsError.message
      )
    }

    const contractByMatchId =
      new Map<
        string,
        any
      >()

    for (
      const contract of
        contracts || []
    ) {
      contractByMatchId.set(
        contract.lead_match_id,
        contract
      )
    }

    const contractIds =
      (
        contracts || []
      ).map(
        (contract) =>
          contract.id
      )

    const closingUrlByMatchId =
      new Map<
        string,
        string
      >()

    if (
      contractIds.length > 0
    ) {
      const {
        data: contractTokens,
        error: contractTokensError,
      } = await supabase
        .from(
          "lead_contract_access_tokens"
        )
        .select(`
          contract_id,
          lead_id,
          role,
          token,
          expires_at,
          revoked_at
        `)
        .in(
          "contract_id",
          contractIds
        )
        .eq(
          "lead_id",
          tenantLeadId
        )
        .eq(
          "role",
          "tenant"
        )
        .is(
          "revoked_at",
          null
        )

      if (contractTokensError) {
        throw new Error(
          contractTokensError.message
        )
      }

      const nowMs =
        Date.now()

      const tokenByContractId =
        new Map<
          string,
          string
        >()

      for (
        const item of
          contractTokens || []
      ) {
        if (
          item.expires_at &&
          new Date(
            item.expires_at
          ).getTime() <=
            nowMs
        ) {
          continue
        }

        if (
          !tokenByContractId.has(
            item.contract_id
          )
        ) {
          tokenByContractId.set(
            item.contract_id,
            item.token
          )
        }
      }

      contractByMatchId.forEach(
        (
          contract,
          matchId
        ) => {
          const contractToken =
            tokenByContractId.get(
              contract.id
            )

          if (
            contractToken
          ) {
            closingUrlByMatchId.set(
              matchId,
              `/cierre/${encodeURIComponent(
                contractToken
              )}`
            )
          }
        }
      )
    }

    // =========================================================
    // 9. ARMAR MATCHES VISIBLES
    // =========================================================

    const visibleMatches =
      matches.flatMap(
        (match) => {
          const owner =
            ownersById.get(
              match.owner_lead_id
            )

          if (!owner) {
            return []
          }

          const completion =
            completionByOwnerId.get(
              match.owner_lead_id
            )

          const ownerMedia =
            mediaByOwnerId.get(
              match.owner_lead_id
            ) || []

          const photoMedia =
            ownerMedia.filter(
              (item) =>
                item.media_type ===
                "photo"
            )

          if (
            photoMedia.length === 0
          ) {
            return []
          }

          return [
            {
              id:
                match.id,

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

              owner_completed:
                Boolean(
                  match.owner_completed_at
                ),

              tenant_post_visit_decision:
                match
                  .tenant_post_visit_decision ||
                null,

              tenant_post_visit_decided_at:
                match
                  .tenant_post_visit_decided_at ||
                null,

              owner_post_visit_decision:
                match
                  .owner_post_visit_decision ||
                null,

              owner_post_visit_decided_at:
                match
                  .owner_post_visit_decided_at ||
                null,

              tenant_closing_url:
                closingUrlByMatchId.get(
                  match.id
                ) ||
                null,

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
                    ?.availability_status ||
                  owner.availability_status,

                expenses:
                  completion
                    ?.expenses_amount ??
                  null,

                floor_unit:
                  completion
                    ?.floor_unit ??
                  null,

                requirements:
                  completion
                    ?.requirements ??
                  null,

                visit_conditions:
                  completion
                    ?.visit_conditions ??
                  null,

                notes:
                  completion
                    ?.property_notes ??
                  null,

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
                ownerMedia.map(
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

                    completion_id:
                      item.completion_id,
                  })
                ),
            },
          ]
        }
      )

    // =========================================================
    // 10. RESPONSE
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
