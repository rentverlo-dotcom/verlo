import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  createClient,
} from "@supabase/supabase-js"

export const runtime =
  "nodejs"

export const dynamic =
  "force-dynamic"

const ACTIVE_MATCH_STATUSES = [
  "new",
  "reviewed",
  "contacted",
  "converted",
]

const MIN_MATCH_SCORE = 80

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

function firstName(
  fullName:
    | string
    | null
) {
  const value =
    clean(fullName)

  if (!value) {
    return "Candidato"
  }

  return (
    value
      .split(/\s+/)[0] ||
    "Candidato"
  )
}

function getStage(
  match: {
    status?: string | null
    tenant_interest_at?: string | null
    tenant_verified_at?: string | null
    owner_interest_at?: string | null
    ready_to_connect_at?: string | null
  }
):
  | "new"
  | "in_progress"
  | "ready"
  | "closed" {
  if (
    match.status ===
    "converted"
  ) {
    return "closed"
  }

  if (
    match.ready_to_connect_at
  ) {
    return "ready"
  }

  if (
    match.tenant_interest_at ||
    match.owner_interest_at
  ) {
    return "in_progress"
  }

  return "new"
}

export async function GET(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY

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
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      )

    const token =
      clean(
        request
          .nextUrl
          .searchParams
          .get(
            "token"
          )
      )

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing token",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. VALIDAR TOKEN DEL DASHBOARD OWNER
    // =========================================================

    const {
      data:
        accessToken,
      error:
        tokenError,
    } =
      await supabase
        .from(
          "owner_candidates_access_tokens"
        )
        .select(`
          id,
          owner_lead_id,
          expires_at,
          revoked_at,
          first_opened_at,
          open_count
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
          error:
            "Invalid token",
        },
        {
          status: 404,
        }
      )
    }

    if (
      accessToken
        .revoked_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Token revoked",
        },
        {
          status: 403,
        }
      )
    }

    if (
      accessToken
        .expires_at &&
      new Date(
        accessToken
          .expires_at
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
    // 2. TRAZABILIDAD
    // =========================================================

    const openedAt =
      new Date()
        .toISOString()

    const {
      error:
        trackingError,
    } =
      await supabase
        .from(
          "owner_candidates_access_tokens"
        )
        .update({
          first_opened_at:
            accessToken
              .first_opened_at ||
            openedAt,

          last_opened_at:
            openedAt,

          open_count:
            Number(
              accessToken
                .open_count ||
                0
            ) + 1,
        })
        .eq(
          "id",
          accessToken.id
        )

    if (
      trackingError
    ) {
      console.error(
        "owner candidates access tracking error:",
        trackingError
      )
    }

    const ownerLeadId =
      accessToken
        .owner_lead_id

    // =========================================================
    // 3. DATOS DEL OWNER / PROPIEDAD
    // =========================================================

    const {
      data: owner,
      error:
        ownerError,
    } =
      await supabase
        .from(
          "lead_intake"
        )
        .select(`
          id,
          full_name,
          zone,
          neighborhood_labels,
          neighborhood_slug,
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
          error:
            "Owner not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 4. TODOS LOS MATCHES DEL OWNER
    //
    // IMPORTANTE:
    //
    // Ya NO exigimos:
    //
    // tenant_interest_at
    // tenant_verified_at
    //
    // El owner tiene que poder ver desde el primer match:
    //
    // NUEVOS
    // EN PROCESO
    // DOBLE OK
    // CERRADOS
    // =========================================================

    const {
      data: matches,
      error:
        matchesError,
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
          reasons,
          status,
          created_at,
          reviewed_at,
          tenant_interest_at,
          tenant_verified_at,
          owner_interest_at,
          ready_to_connect_at,
          introduced_at,
          tenant_post_visit_decision,
          tenant_post_visit_decided_at,
          owner_post_visit_decision,
          owner_post_visit_decided_at
        `)
        .eq(
          "owner_lead_id",
          ownerLeadId
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
          "created_at",
          {
            ascending:
              false,
          }
        )

    if (
      matchesError
    ) {
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

    const ownerResponse = {
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
        owner
          .neighborhood_labels?.[0] ||
        owner
          .neighborhood_slug ||
        null,

      property_type:
        owner
          .property_type ||
        null,

      rooms:
        owner
          .property_rooms ||
        null,

      approx_price:
        owner
          .approx_price ||
        null,

      approx_price_number:
        owner
          .approx_price_number ??
        null,

      availability_status:
        owner
          .availability_status ||
        null,
    }

    if (
      !matches ||
      matches.length ===
        0
    ) {
      return NextResponse.json({
        ok: true,

        owner:
          ownerResponse,

        count: 0,

        counts: {
          new: 0,
          in_progress: 0,
          ready: 0,
          closed: 0,
        },

        candidates: [],
      })
    }

    // =========================================================
    // 5. TENANTS DE TODOS LOS MATCHES
    // =========================================================

    const tenantLeadIds =
      Array.from(
        new Set(
          matches.map(
            (
              match
            ) =>
              match
                .tenant_lead_id
          )
        )
      )

    const {
      data: tenants,
      error:
        tenantsError,
    } =
      await supabase
        .from(
          "lead_intake"
        )
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
          neighborhood_labels,
          neighborhood_slug,
          area_macro
        `)
        .in(
          "id",
          tenantLeadIds
        )

    if (
      tenantsError
    ) {
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

    const tenantById =
      new Map(
        (
          tenants ||
          []
        ).map(
          (
            tenant
          ) => [
            tenant.id,
            tenant,
          ]
        )
      )

    // =========================================================
    // 6. VERIFICACIONES
    //
    // SON OPCIONALES.
    //
    // El tenant puede aparecer como match nuevo sin haber
    // completado todavía ninguna verificación.
    // =========================================================

    const {
      data:
        verifications,
      error:
        verificationsError,
    } =
      await supabase
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
        .order(
          "created_at",
          {
            ascending:
              false,
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
    // 7. INDEXAR VERIFICACIONES
    //
    // Preferimos:
    //
    // 1. verificación específica del match
    // 2. verificación reusable del tenant (match_id null)
    // =========================================================

    const verificationByMatch =
      new Map<
        string,
        any
      >()

    const reusableVerificationByLead =
      new Map<
        string,
        any
      >()

    for (
      const verification of
        verifications ||
        []
    ) {
      if (
        verification
          .match_id &&
        !verificationByMatch
          .has(
            verification
              .match_id
          )
      ) {
        verificationByMatch
          .set(
            verification
              .match_id,
            verification
          )
      }

      if (
        !verification
          .match_id &&
        !reusableVerificationByLead
          .has(
            verification
              .lead_id
          )
      ) {
        reusableVerificationByLead
          .set(
            verification
              .lead_id,
            verification
          )
      }
    }

    // =========================================================
    // 8. CONTRATOS + TOKEN DE CIERRE DEL OWNER
    // =========================================================

    const matchIds =
      matches.map(
        (
          match
        ) =>
          match.id
      )

    const {
      data:
        contracts,
      error:
        contractsError,
    } =
      await supabase
        .from(
          "lead_contracts"
        )
        .select(`
          id,
          lead_match_id,
          owner_lead_id,
          status
        `)
        .in(
          "lead_match_id",
          matchIds
        )
        .eq(
          "owner_lead_id",
          ownerLeadId
        )

    if (
      contractsError
    ) {
      console.error(
        "candidates-view contracts error:",
        contractsError
      )

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not load contracts",
        },
        {
          status: 500,
        }
      )
    }

    const contractByMatchId =
      new Map<
        string,
        any
      >()

    for (
      const contract of
        contracts ||
        []
    ) {
      contractByMatchId.set(
        contract
          .lead_match_id,
        contract
      )
    }

    const contractIds =
      (
        contracts ||
        []
      ).map(
        (
          contract
        ) =>
          contract.id
      )

    const closingUrlByMatchId =
      new Map<
        string,
        string
      >()

    if (
      contractIds.length >
      0
    ) {
      const {
        data:
          contractTokens,
        error:
          contractTokensError,
      } =
        await supabase
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
            ownerLeadId
          )
          .eq(
            "role",
            "owner"
          )
          .is(
            "revoked_at",
            null
          )

      if (
        contractTokensError
      ) {
        console.error(
          "candidates-view contract token error:",
          contractTokensError
        )

        return NextResponse.json(
          {
            ok: false,
            error:
              "Could not load closing access",
          },
          {
            status: 500,
          }
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
          contractTokens ||
          []
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
    // 9. ARMAR DASHBOARD
    // =========================================================

    const candidates =
      matches
        .map(
          (
            match
          ) => {
            const tenant =
              tenantById
                .get(
                  match
                    .tenant_lead_id
                )

            if (
              !tenant
            ) {
              return null
            }

            const verification =
              verificationByMatch
                .get(
                  match.id
                ) ||
              reusableVerificationByLead
                .get(
                  match
                    .tenant_lead_id
                ) ||
              null

            const stage =
              getStage(
                match
              )

            const tenantInterested =
              Boolean(
                match
                  .tenant_interest_at
              )

            const tenantVerified =
              Boolean(
                match
                  .tenant_verified_at
              )

            const ownerInterested =
              Boolean(
                match
                  .owner_interest_at
              )

            const readyToConnect =
              Boolean(
                match
                  .ready_to_connect_at
              )

            const introduced =
              Boolean(
                match
                  .introduced_at
              )

          const displayName =
  clean(
    tenant.full_name
  ) || "Candidato"

            return {
              match: {
                id:
                  match.id,

                score:
                  Number(
                    match.score ||
                      0
                  ),

                reasons:
                  match.reasons ||
                  {},

                status:
                  match.status,

                stage,

                created_at:
                  match.created_at ||
                  null,

                tenant_interest:
                  tenantInterested,

                tenant_verified:
                  tenantVerified,

                owner_interest:
                  ownerInterested,

                ready_to_connect:
                  readyToConnect,

                introduced,

           requires_owner_action:
  !ownerInterested &&
  !readyToConnect &&
  match.status !==
    "converted",

waiting_tenant:
  ownerInterested &&
  !tenantInterested &&
  !readyToConnect,

waiting_verification:
  false,
                operation_active:
                  readyToConnect ||
                  match.status ===
                    "converted",

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

                owner_closing_url:
                  closingUrlByMatchId.get(
                    match.id
                  ) ||
                  null,
              },

              tenant: {
                first_name:
                  displayName,

                budget_range:
                  tenant
                    .budget_range ||
                  null,

                budget_max:
                  tenant
                    .budget_max ??
                  null,

                move_timing:
                  tenant
                    .move_timing ||
                  null,

                property_type:
                  tenant
                    .desired_property_type ||
                  null,

                rooms:
                  tenant
                    .desired_rooms ||
                  null,

                neighborhood:
                  tenant
                    .neighborhood_labels?.[0] ||
                  tenant
                    .neighborhood_slug ||
                  tenant
                    .area_macro ||
                  null,

                income_proof_type:
                  tenant
                    .income_proof_type ||
                  null,

                income_range:
                  verification
                    ?.income_range ||
                  tenant
                    .income_range ||
                  null,

                income_max:
                  tenant
                    .income_max ??
                  null,

                guarantee_types:
                  Array.isArray(
                    tenant
                      .guarantee_types
                  )
                    ? tenant
                        .guarantee_types
                    : [],

                employment_status:
                  verification
                    ?.employment_status ||
                  null,

                guarantee_type:
                  verification
                    ?.guarantee_type ||
                  null,

                move_notes:
                  verification
                    ?.move_notes ||
                  null,
              },

              verification: {
                exists:
                  Boolean(
                    verification
                  ),

                status:
                  verification
                    ?.status ||
                  null,

                has_dni_front:
                  Boolean(
                    verification
                      ?.dni_front_path
                  ),

                has_dni_back:
                  Boolean(
                    verification
                      ?.dni_back_path
                  ),

                has_selfie:
                  Boolean(
                    verification
                      ?.selfie_path
                  ),

                has_income_proof:
                  Boolean(
                    verification
                      ?.income_proof_path
                  ),

                reviewed:
                  Boolean(
                    verification
                      ?.reviewed_at
                  ),
              },
            }
          }
        )
        .filter(
          Boolean
        )

    // =========================================================
    // 10. ORDEN
    //
    // Prioridad:
    //
    // 1. owner tiene que actuar
    // 2. doble OK
    // 3. tenant avanzando
    // 4. nuevos
    // 5. cerrados
    // =========================================================

    const priority: Record<
      string,
      number
    > = {
      in_progress: 1,
      ready: 2,
      new: 3,
      closed: 4,
    }

    candidates.sort(
      (
        a: any,
        b: any
      ) => {
        if (
          a.match
            .requires_owner_action &&
          !b.match
            .requires_owner_action
        ) {
          return -1
        }

        if (
          !a.match
            .requires_owner_action &&
          b.match
            .requires_owner_action
        ) {
          return 1
        }

        const stageA =
          priority[
            a.match.stage
          ] ||
          99

        const stageB =
          priority[
            b.match.stage
          ] ||
          99

        if (
          stageA !==
          stageB
        ) {
          return (
            stageA -
            stageB
          )
        }

        return (
          Number(
            b.match.score ||
              0
          ) -
          Number(
            a.match.score ||
              0
          )
        )
      }
    )

    // =========================================================
    // 11. CONTADORES DEL DASHBOARD
    // =========================================================

    const counts = {
      new:
        candidates.filter(
          (
            item: any
          ) =>
            item.match
              .stage ===
            "new"
        ).length,

      in_progress:
        candidates.filter(
          (
            item: any
          ) =>
            item.match
              .stage ===
            "in_progress"
        ).length,

      ready:
        candidates.filter(
          (
            item: any
          ) =>
            item.match
              .stage ===
            "ready"
        ).length,

      closed:
        candidates.filter(
          (
            item: any
          ) =>
            item.match
              .stage ===
            "closed"
        ).length,
    }

    // =========================================================
    // 12. RESPONSE
    //
    // NO DEVOLVEMOS:
    //
    // teléfono
    // email
    // DNI
    // paths privados
    //
    // antes del doble OK.
    // =========================================================

    return NextResponse.json({
      ok: true,

      owner:
        ownerResponse,

      count:
        candidates.length,

      counts,

      candidates,
    })
  } catch (
    error
  ) {
    console.error(
      "candidates-view error:",
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
