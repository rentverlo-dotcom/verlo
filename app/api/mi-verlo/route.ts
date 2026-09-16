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

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

function isExpired(
  value: string | null | undefined
) {
  if (!value) return false

  return (
    new Date(
      value
    ).getTime() <
    Date.now()
  )
}

type MatchRow = {
  id: string
  created_at: string
  tenant_lead_id: string
  owner_lead_id: string
  status: string
  score: number

  reasons:
    Record<string, unknown> | null

  tenant_interest_at:
    string | null

  owner_interest_at:
    string | null

  ready_to_connect_at:
    string | null

  introduced_at:
    string | null

  tenant_post_visit_decision:
    string | null

  tenant_post_visit_decided_at:
    string | null

  owner_post_visit_decision:
    string | null

  owner_post_visit_decided_at:
    string | null
}

type ContractRow = {
  id: string
  lead_match_id: string
  tenant_lead_id: string
  owner_lead_id: string
  status: string

  monthly_price:
    number | null

  deposit:
    number | null

  start_date:
    string | null

  end_date:
    string | null

  tenant_agreed_at:
    string | null

  owner_agreed_at:
    string | null

  created_at: string
  updated_at: string
}

type RentalRow = {
  id: string
  lead_contract_id: string
  lead_match_id: string
  tenant_lead_id: string
  owner_lead_id: string
  status: string
  start_date: string
  end_date: string
  activated_at: string
}

function getMatchStage(
  match: MatchRow,
  contract:
    ContractRow | undefined,
  rental:
    RentalRow | undefined,
  role:
    "tenant" | "owner"
) {
  if (
    rental &&
    rental.status ===
      "active"
  ) {
    return {
      key:
        "rental_active",

      label:
        "ALQUILER CONFIRMADO",

      action:
        "VER ALQUILER",
    }
  }

  if (
    contract?.status ===
      "agreed"
  ) {
    return {
      key:
        "contract_agreed",

      label:
        "CONTRATO ACEPTADO",

      action:
        "VER OPERACIÓN",
    }
  }

  if (
    contract?.status ===
      "generated"
  ) {
    const ownAgreed =
      role ===
      "tenant"
        ? Boolean(
            contract
              .tenant_agreed_at
          )
        : Boolean(
            contract
              .owner_agreed_at
          )

    if (!ownAgreed) {
      return {
        key:
          "contract_acceptance_pending",

        label:
          "FALTA TU ACEPTACIÓN",

        action:
          "REVISAR CONTRATO",
      }
    }

    return {
      key:
        "waiting_contract_acceptance",

      label:
        "ESPERANDO A LA OTRA PARTE",

      action:
        "VER OPERACIÓN",
    }
  }

  const tenantPostVisit =
    match
      .tenant_post_visit_decision

  const ownerPostVisit =
    match
      .owner_post_visit_decision

  if (
    tenantPostVisit ===
      "yes" &&
    ownerPostVisit ===
      "yes"
  ) {
    return {
      key:
        "second_double_ok",

      label:
        "CONTRATO EN PREPARACIÓN",

      action:
        "ENTRAR AL CIERRE",
    }
  }

  if (
    match
      .ready_to_connect_at
  ) {
    const ownDecision =
      role ===
      "tenant"
        ? tenantPostVisit
        : ownerPostVisit

    const otherDecision =
      role ===
      "tenant"
        ? ownerPostVisit
        : tenantPostVisit

    if (
      ownDecision ===
      "no"
    ) {
      return {
        key:
          "post_visit_declined",

        label:
          "NO QUISISTE AVANZAR",

        action:
          "VER OPERACIÓN",
      }
    }

    if (
      otherDecision ===
      "no"
    ) {
      return {
        key:
          "counterpart_declined",

        label:
          "LA OTRA PARTE NO AVANZÓ",

        action:
          "VER OPERACIÓN",
      }
    }

    if (
      ownDecision ===
        "yes" &&
      !otherDecision
    ) {
      return {
        key:
          "waiting_post_visit",

        label:
          "ESPERANDO DECISIÓN",

        action:
          "ENTRAR AL CIERRE",
      }
    }

    if (
      !ownDecision &&
      otherDecision ===
        "yes"
    ) {
      return {
        key:
          "post_visit_action",

        label:
          "DECISIÓN PENDIENTE",

        action:
          "RESPONDER AHORA",
      }
    }

    return {
      key:
        "closing",

      label:
        "VISITA / CIERRE EN CURSO",

      action:
        "ENTRAR AL CIERRE",
    }
  }

  const tenantInterested =
    Boolean(
      match
        .tenant_interest_at
    )

  const ownerInterested =
    Boolean(
      match
        .owner_interest_at
    )

  const ownInterested =
    role ===
    "tenant"
      ? tenantInterested
      : ownerInterested

  const otherInterested =
    role ===
    "tenant"
      ? ownerInterested
      : tenantInterested

  if (
    ownInterested &&
    otherInterested
  ) {
    return {
      key:
        "double_ok",

      label:
        "DOBLE OK",

      action:
        "CONTINUAR",
    }
  }

  if (
    ownInterested &&
    !otherInterested
  ) {
    return {
      key:
        "waiting_interest",

      label:
        "ESPERANDO RESPUESTA",

      action:
        "VER MATCH",
    }
  }

  if (
    !ownInterested &&
    otherInterested
  ) {
    return {
      key:
        "interest_action",

      label:
        "QUIEREN AVANZAR CON VOS",

      action:
        "RESPONDER AHORA",
    }
  }

  return {
    key:
      "new_match",

    label:
      "NUEVO MATCH",

    action:
      "VER MATCH",
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL

    const anonKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing configuration",
        },
        {
          status: 500,
        }
      )
    }

    // =========================================================
    // 1. SESIÓN
    // =========================================================

    const authorization =
      clean(
        request.headers.get(
          "authorization"
        )
      )

    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing session",
        },
        {
          status: 401,
        }
      )
    }

    const accessToken =
      authorization
        .slice(
          "Bearer ".length
        )
        .trim()

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing access token",
        },
        {
          status: 401,
        }
      )
    }

    const supabaseAuth =
      createClient(
        supabaseUrl,
        anonKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      )

    const {
      data:
        userData,

      error:
        userError,
    } =
      await supabaseAuth
        .auth
        .getUser(
          accessToken
        )

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid session",
        },
        {
          status: 401,
        }
      )
    }

    const user =
      userData.user

    const supabaseAdmin =
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

    // =========================================================
    // 2. AUTH USER -> LEAD
    // =========================================================

    const {
      data:
        profile,

      error:
        profileError,
    } =
      await supabaseAdmin
        .from(
          "user_profiles"
        )
        .select(`
          user_id,
          lead_id,
          full_name,
          email,
          phone
        `)
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle()

    if (
      profileError
    ) {
      throw new Error(
        profileError.message
      )
    }

    if (!profile) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "User profile not found",
        },
        {
          status: 404,
        }
      )
    }

    const leadId =
      profile.lead_id

    // =========================================================
    // 3. LEAD / FORM ORIGINAL
    // =========================================================

    const {
      data:
        lead,

      error:
        leadError,
    } =
      await supabaseAdmin
        .from(
          "lead_intake"
        )
        .select(`
          id,
          created_at,
          full_name,
          email,
          phone,
          phone_normalized,
          role,
          intent,
          zone,
          area_macro,
          neighborhood_labels,
          neighborhood_slugs,
          neighborhood_slug,
          desired_property_type,
          desired_rooms,
          budget_range,
          budget_max,
          move_timing,
          property_type,
          property_rooms,
          approx_price,
          approx_price_number,
          availability_status,
          match_notifications
        `)
        .eq(
          "id",
          leadId
        )
        .single()

    if (
      leadError ||
      !lead
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Lead not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 4. MATCHES DONDE PARTICIPA ESTE LEAD
    // =========================================================

    const {
      data:
        matchesData,

      error:
        matchesError,
    } =
      await supabaseAdmin
        .from(
          "lead_matches"
        )
        .select(`
          id,
          created_at,
          tenant_lead_id,
          owner_lead_id,
          status,
          score,
          reasons,
          tenant_interest_at,
          owner_interest_at,
          ready_to_connect_at,
          introduced_at,
          tenant_post_visit_decision,
          tenant_post_visit_decided_at,
          owner_post_visit_decision,
          owner_post_visit_decided_at
        `)
        .or(
          `tenant_lead_id.eq.${leadId},owner_lead_id.eq.${leadId}`
        )
        .neq(
          "status",
          "discarded"
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
      throw new Error(
        matchesError.message
      )
    }

    const matches =
      (
        matchesData ||
        []
      ) as MatchRow[]

    // =========================================================
    // 5. CONTRATOS
    // =========================================================

    const {
      data:
        contractsData,

      error:
        contractsError,
    } =
      await supabaseAdmin
        .from(
          "lead_contracts"
        )
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
          tenant_agreed_at,
          owner_agreed_at,
          created_at,
          updated_at
        `)
        .or(
          `tenant_lead_id.eq.${leadId},owner_lead_id.eq.${leadId}`
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )

    if (
      contractsError
    ) {
      throw new Error(
        contractsError.message
      )
    }

    const contracts =
      (
        contractsData ||
        []
      ) as ContractRow[]

    // =========================================================
    // 6. ALQUILERES
    // =========================================================

    const {
      data:
        rentalsData,

      error:
        rentalsError,
    } =
      await supabaseAdmin
        .from(
          "rentals"
        )
        .select(`
          id,
          lead_contract_id,
          lead_match_id,
          tenant_lead_id,
          owner_lead_id,
          status,
          start_date,
          end_date,
          activated_at
        `)
        .or(
          `tenant_lead_id.eq.${leadId},owner_lead_id.eq.${leadId}`
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )

    if (
      rentalsError
    ) {
      throw new Error(
        rentalsError.message
      )
    }

    const rentals =
      (
        rentalsData ||
        []
      ) as RentalRow[]

    // =========================================================
    // 7. DATOS DE LAS CONTRAPARTES
    // =========================================================

    const counterpartIds =
      Array.from(
        new Set(
          matches
            .map(
              (
                match
              ) =>
                match
                  .tenant_lead_id ===
                leadId
                  ? match
                      .owner_lead_id
                  : match
                      .tenant_lead_id
            )
            .filter(
              Boolean
            )
        )
      )

    let counterpartMap =
      new Map<
        string,
        Record<
          string,
          unknown
        >
      >()

    if (
      counterpartIds.length >
      0
    ) {
      const {
        data:
          counterpartData,

        error:
          counterpartError,
      } =
        await supabaseAdmin
          .from(
            "lead_intake"
          )
          .select(`
            id,
            full_name,
            role,
            zone,
            area_macro,
            neighborhood_labels,
            neighborhood_slug,
            desired_property_type,
            desired_rooms,
            budget_range,
            budget_max,
            move_timing,
            property_type,
            property_rooms,
            approx_price,
            approx_price_number,
            availability_status
          `)
          .in(
            "id",
            counterpartIds
          )

      if (
        counterpartError
      ) {
        throw new Error(
          counterpartError
            .message
        )
      }

      counterpartMap =
        new Map(
          (
            counterpartData ||
            []
          ).map(
            (
              item
            ) => [
              item.id,
              item,
            ]
          )
        )
    }

    // =========================================================
    // 8. TOKENS DE ACCESO DIRECTO
    // =========================================================

    const [
      tenantTokenResult,
      ownerTokenResult,
      contractTokensResult,
    ] =
      await Promise.all([
        supabaseAdmin
          .from(
            "tenant_matches_access_tokens"
          )
          .select(`
            token,
            expires_at,
            revoked_at,
            created_at
          `)
          .eq(
            "tenant_lead_id",
            leadId
          )
          .is(
            "revoked_at",
            null
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(5),

        supabaseAdmin
          .from(
            "owner_candidates_access_tokens"
          )
          .select(`
            token,
            expires_at,
            revoked_at,
            created_at
          `)
          .eq(
            "owner_lead_id",
            leadId
          )
          .is(
            "revoked_at",
            null
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(5),

        supabaseAdmin
          .from(
            "lead_contract_access_tokens"
          )
          .select(`
            contract_id,
            lead_id,
            role,
            token,
            expires_at,
            revoked_at,
            created_at
          `)
          .eq(
            "lead_id",
            leadId
          )
          .is(
            "revoked_at",
            null
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          ),
      ])

    if (
      tenantTokenResult
        .error
    ) {
      throw new Error(
        tenantTokenResult
          .error.message
      )
    }

    if (
      ownerTokenResult
        .error
    ) {
      throw new Error(
        ownerTokenResult
          .error.message
      )
    }

    if (
      contractTokensResult
        .error
    ) {
      throw new Error(
        contractTokensResult
          .error.message
      )
    }

    const tenantToken =
      (
        tenantTokenResult
          .data ||
        []
      ).find(
        (
          item
        ) =>
          !isExpired(
            item.expires_at
          )
      )

    const ownerToken =
      (
        ownerTokenResult
          .data ||
        []
      ).find(
        (
          item
        ) =>
          !isExpired(
            item.expires_at
          )
      )

    const contractTokenMap =
      new Map<
        string,
        {
          token: string
          role:
            "tenant" |
            "owner"
        }
      >()

    for (
      const tokenRow of
      contractTokensResult
        .data ||
      []
    ) {
      if (
        isExpired(
          tokenRow
            .expires_at
        )
      ) {
        continue
      }

      if (
        contractTokenMap.has(
          tokenRow
            .contract_id
        )
      ) {
        continue
      }

      contractTokenMap.set(
        tokenRow
          .contract_id,
        {
          token:
            tokenRow.token,

          role:
            tokenRow.role,
        }
      )
    }

    // =========================================================
    // 9. NORMALIZAR MATCHES PARA MI VERLO
    // =========================================================

    const dashboardMatches =
      matches.map(
        (
          match
        ) => {
          const role:
            "tenant" |
            "owner" =
            match
              .tenant_lead_id ===
            leadId
              ? "tenant"
              : "owner"

          const counterpartId =
            role ===
            "tenant"
              ? match
                  .owner_lead_id
              : match
                  .tenant_lead_id

          const counterpart =
            counterpartMap.get(
              counterpartId
            ) ||
            null

          const contract =
            contracts.find(
              (
                item
              ) =>
                item
                  .lead_match_id ===
                match.id
            )

          const rental =
            rentals.find(
              (
                item
              ) =>
                item
                  .lead_match_id ===
                match.id
            )

          const stage =
            getMatchStage(
              match,
              contract,
              rental,
              role
            )

          let actionUrl:
            string | null =
            null

          if (
            rental
          ) {
            actionUrl =
              "/mi-alquiler"
          } else if (
            contract
          ) {
            const contractToken =
              contractTokenMap.get(
                contract.id
              )

            if (
              contractToken
            ) {
              actionUrl =
                `/cierre/${contractToken.token}`
            }
          } else if (
            role ===
              "tenant" &&
            tenantToken
          ) {
            actionUrl =
              `/matches/${tenantToken.token}`
          } else if (
            role ===
              "owner" &&
            ownerToken
          ) {
            actionUrl =
              `/candidatos/${ownerToken.token}`
          }

          return {
            id:
              match.id,

            role,

            score:
              match.score,

            status:
              match.status,

            created_at:
              match.created_at,

            reasons:
              match.reasons,

            counterpart,

            interest: {
              tenant:
                Boolean(
                  match
                    .tenant_interest_at
                ),

              owner:
                Boolean(
                  match
                    .owner_interest_at
                ),

              ready:
                Boolean(
                  match
                    .ready_to_connect_at
                ),
            },

            post_visit: {
              tenant:
                match
                  .tenant_post_visit_decision,

              owner:
                match
                  .owner_post_visit_decision,
            },

            stage,

            contract:
              contract ||
              null,

            rental:
              rental ||
              null,

            action_url:
              actionUrl,
          }
        }
      )

    // =========================================================
    // 10. SEPARAR MATCHES Y OPERACIONES
    // =========================================================

    const simpleMatches =
      dashboardMatches.filter(
        (
          item
        ) =>
          !item.contract &&
          !item.rental &&
          !item
            .interest
            .ready
      )

    const operations =
      dashboardMatches.filter(
        (
          item
        ) =>
          Boolean(
            item.contract ||
            item.rental ||
            item
              .interest
              .ready
          )
      )

    // =========================================================
    // 11. RESPUESTA
    // =========================================================

    return NextResponse.json({
      ok: true,

      user: {
        id:
          user.id,

        email:
          user.email ||
          profile.email ||
          lead.email,

        full_name:
          profile.full_name ||
          lead.full_name,

        lead_id:
          leadId,

        role:
          lead.role,
      },

      intake: {
        id:
          lead.id,

        role:
          lead.role,

        intent:
          lead.intent,

        created_at:
          lead.created_at,

        tenant:
          lead.intent ===
          "tenant_search"
            ? {
                zone:
                  lead.zone,

                area_macro:
                  lead
                    .area_macro,

                neighborhoods:
                  lead
                    .neighborhood_labels,

                property_type:
                  lead
                    .desired_property_type,

                rooms:
                  lead
                    .desired_rooms,

                budget_range:
                  lead
                    .budget_range,

                budget_max:
                  lead
                    .budget_max,

                move_timing:
                  lead
                    .move_timing,
              }
            : null,

        owner:
          lead.intent ===
          "owner_new_listing"
            ? {
                zone:
                  lead.zone,

                neighborhood:
                  lead
                    .neighborhood_slug,

                property_type:
                  lead
                    .property_type,

                rooms:
                  lead
                    .property_rooms,

                price:
                  lead
                    .approx_price,

                price_number:
                  lead
                    .approx_price_number,

                availability:
                  lead
                    .availability_status,
              }
            : null,
      },

      summary: {
        matches:
          simpleMatches
            .length,

        operations:
          operations
            .length,

        rentals:
          rentals.filter(
            (
              item
            ) =>
              item.status ===
              "active"
          ).length,
      },

      matches:
        simpleMatches,

      operations,

      rentals,
    })
  } catch (
    error
  ) {
    console.error(
      "mi-verlo GET error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof
            Error
            ? error.message
            : "Unexpected error",
      },
      {
        status: 500,
      }
    )
  }
}
