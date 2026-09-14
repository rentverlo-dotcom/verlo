import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  createClient,
} from "@supabase/supabase-js"

import {
  sendPushToLead,
} from "@/lib/push"

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

export async function POST(
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
            "Missing configuration",
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

    const body =
      await request
        .json()
        .catch(
          () => ({})
        )

    const token =
      clean(
        body?.token
      )

    const decision =
      clean(
        body?.decision
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

    if (
      decision !== "yes" &&
      decision !== "no"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid decision",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. TOKEN DE CIERRE
    // =========================================================

    const {
      data:
        accessToken,
      error:
        tokenError,
    } =
      await supabase
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

    if (
      accessToken.role !==
        "tenant" &&
      accessToken.role !==
        "owner"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid role",
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
      data:
        contract,
      error:
        contractError,
    } =
      await supabase
        .from(
          "lead_contracts"
        )
        .select(`
          id,
          lead_match_id,
          tenant_lead_id,
          owner_lead_id,
          status
        `)
        .eq(
          "id",
          accessToken
            .contract_id
        )
        .single()

    if (
      contractError ||
      !contract
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Contract not found",
        },
        {
          status: 404,
        }
      )
    }

    const expectedLeadId =
      accessToken.role ===
      "tenant"
        ? contract
            .tenant_lead_id
        : contract
            .owner_lead_id

    if (
      accessToken
        .lead_id !==
      expectedLeadId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Token does not belong to this contract party",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 3. MATCH
    // =========================================================

    const {
      data:
        match,
      error:
        matchError,
    } =
      await supabase
        .from(
          "lead_matches"
        )
        .select(`
          id,
          tenant_lead_id,
          owner_lead_id,
          ready_to_connect_at,
          tenant_post_visit_decision,
          tenant_post_visit_decided_at,
          owner_post_visit_decision,
          owner_post_visit_decided_at,
          status
        `)
        .eq(
          "id",
          contract
            .lead_match_id
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
      match
        .tenant_lead_id !==
        contract
          .tenant_lead_id ||
      match
        .owner_lead_id !==
        contract
          .owner_lead_id
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
      !match
        .ready_to_connect_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Match is not ready for post-visit decision",
        },
        {
          status: 409,
        }
      )
    }

    const now =
      new Date()
        .toISOString()

    // =========================================================
    // 4. GUARDAR DECISIÓN
    // =========================================================

    const update =
      accessToken.role ===
      "tenant"
        ? {
            tenant_post_visit_decision:
              decision,

            tenant_post_visit_decided_at:
              now,
          }
        : {
            owner_post_visit_decision:
              decision,

            owner_post_visit_decided_at:
              now,
          }

    const {
      error:
        updateError,
    } =
      await supabase
        .from(
          "lead_matches"
        )
        .update(
          update
        )
        .eq(
          "id",
          match.id
        )

    if (
      updateError
    ) {
      throw new Error(
        updateError.message
      )
    }

    const tenantDecision =
      accessToken.role ===
      "tenant"
        ? decision
        : match
            .tenant_post_visit_decision

    const ownerDecision =
      accessToken.role ===
      "owner"
        ? decision
        : match
            .owner_post_visit_decision

    const secondDoubleOk =
      tenantDecision ===
        "yes" &&
      ownerDecision ===
        "yes"

    // =========================================================
    // 5. TOKENS DE AMBAS PARTES
    // =========================================================

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
          token,
          lead_id,
          role,
          expires_at,
          revoked_at
        `)
        .eq(
          "contract_id",
          contract.id
        )
        .is(
          "revoked_at",
          null
        )

    if (
      contractTokensError
    ) {
      console.error(
        "post-visit token lookup error:",
        contractTokensError
      )
    }

    const usableTokens =
      (
        contractTokens ||
        []
      ).filter(
        item =>
          !item.expires_at ||
          new Date(
            item.expires_at
          ).getTime() >
            Date.now()
      )

    const tenantToken =
      usableTokens.find(
        item =>
          item.role ===
            "tenant" &&
          item.lead_id ===
            contract
              .tenant_lead_id
      )

    const ownerToken =
      usableTokens.find(
        item =>
          item.role ===
            "owner" &&
          item.lead_id ===
            contract
              .owner_lead_id
      )

    let tenantPush:
      unknown =
      null

    let ownerPush:
      unknown =
      null

    // =========================================================
    // 6. UNO DIJO YES -> AVISAR AL OTRO
    // =========================================================

    if (
      decision === "yes" &&
      !secondDoubleOk
    ) {
      try {
        if (
          accessToken.role ===
            "tenant" &&
          ownerToken
            ?.token
        ) {
          ownerPush =
            await sendPushToLead(
              contract
                .owner_lead_id,
              {
                title:
                  "Verlo · Decisión después de la visita",

                body:
                  "El inquilino quiere avanzar. Falta tu decisión.",

                url:
                  `/cierre/${encodeURIComponent(
                    ownerToken
                      .token
                  )}`,
              }
            )
        }

        if (
          accessToken.role ===
            "owner" &&
          tenantToken
            ?.token
        ) {
          tenantPush =
            await sendPushToLead(
              contract
                .tenant_lead_id,
              {
                title:
                  "Verlo · Decisión después de la visita",

                body:
                  "El propietario quiere avanzar. Falta tu decisión.",

                url:
                  `/cierre/${encodeURIComponent(
                    tenantToken
                      .token
                  )}`,
              }
            )
        }
      } catch (
        pushError
      ) {
        console.error(
          "post-visit waiting push error:",
          pushError
        )
      }
    }

    // =========================================================
    // 7. SEGUNDO DOBLE OK
    // =========================================================

    if (
      secondDoubleOk
    ) {
      try {
        if (
          tenantToken
            ?.token
        ) {
          tenantPush =
            await sendPushToLead(
              contract
                .tenant_lead_id,
              {
                title:
                  "Verlo · Los dos quieren avanzar",

                body:
                  "Los dos confirmaron después de la visita. Ya pueden continuar con el contrato.",

                url:
                  `/cierre/${encodeURIComponent(
                    tenantToken
                      .token
                  )}`,
              }
            )
        }

        if (
          ownerToken
            ?.token
        ) {
          ownerPush =
            await sendPushToLead(
              contract
                .owner_lead_id,
              {
                title:
                  "Verlo · Los dos quieren avanzar",

                body:
                  "Los dos confirmaron después de la visita. Ya pueden continuar con el contrato.",

                url:
                  `/cierre/${encodeURIComponent(
                    ownerToken
                      .token
                  )}`,
              }
            )
        }
      } catch (
        pushError
      ) {
        console.error(
          "post-visit double ok push error:",
          pushError
        )
      }
    }

    // =========================================================
    // 8. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      role:
        accessToken.role,

      decision,

      match_id:
        match.id,

      tenant_decision:
        tenantDecision ||
        null,

      owner_decision:
        ownerDecision ||
        null,

      second_double_ok:
        secondDoubleOk,

      can_accept_contract:
        secondDoubleOk,

      push: {
        tenant:
          tenantPush,

        owner:
          ownerPush,
      },
    })
  } catch (
    error
  ) {
    console.error(
      "post-visit-decision error:",
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
