import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  createClient,
} from "@supabase/supabase-js"

import {
  notifyLeadOnce,
} from "@/lib/lead-notifications"

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

    if (
      !token
    ) {
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
      decision !==
        "yes" &&
      decision !==
        "no"
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

    // =========================================================
    // 4. DECISIÓN ACTUAL / CAMBIO REAL
    // =========================================================

    const previousDecision =
      accessToken.role ===
      "tenant"
        ? match
            .tenant_post_visit_decision
        : match
            .owner_post_visit_decision

    const decisionChanged =
      previousDecision !==
      decision

    const now =
      new Date()
        .toISOString()

    if (
      decisionChanged
    ) {
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
          updateError
            .message
        )
      }
    }

    // =========================================================
    // 5. ESTADO RESULTANTE
    // =========================================================

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

    const previousSecondDoubleOk =
      match
        .tenant_post_visit_decision ===
        "yes" &&
      match
        .owner_post_visit_decision ===
        "yes"

    const secondDoubleOk =
      tenantDecision ===
        "yes" &&
      ownerDecision ===
        "yes"

    const becameSecondDoubleOk =
      secondDoubleOk &&
      !previousSecondDoubleOk &&
      decisionChanged

    // =========================================================
    // 6. TOKENS DE AMBAS PARTES
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
      throw new Error(
        contractTokensError
          .message
      )
    }

    const usableTokens =
      (
        contractTokens ||
        []
      ).filter(
        (
          item
        ) =>
          !item
            .expires_at ||
          new Date(
            item
              .expires_at
          ).getTime() >
            Date.now()
      )

    const tenantToken =
      usableTokens.find(
        (
          item
        ) =>
          item.role ===
            "tenant" &&
          item.lead_id ===
            contract
              .tenant_lead_id
      )

    const ownerToken =
      usableTokens.find(
        (
          item
        ) =>
          item.role ===
            "owner" &&
          item.lead_id ===
            contract
              .owner_lead_id
      )

    const tenantUrl =
      tenantToken?.token
        ? `/cierre/${encodeURIComponent(
            tenantToken.token
          )}`
        : null

    const ownerUrl =
      ownerToken?.token
        ? `/cierre/${encodeURIComponent(
            ownerToken.token
          )}`
        : null

    let tenantPush:
      unknown =
      null

    let ownerPush:
      unknown =
      null

    // =========================================================
    // 7. UNO DIJO YES -> AVISAR AL OTRO
    //
    // Solo si fue un CAMBIO REAL de decisión.
    // Repetir el mismo YES no vuelve a notificar.
    // =========================================================

    if (
      decisionChanged &&
      decision ===
        "yes" &&
      !secondDoubleOk
    ) {
      if (
        accessToken.role ===
          "tenant" &&
        ownerUrl
      ) {
        try {
          ownerPush =
            await notifyLeadOnce({
              eventKey:
                `post_visit_waiting:owner:${match.id}:tenant_yes:${now}`,

              eventType:
                "post_visit_waiting",

              leadId:
                contract
                  .owner_lead_id,

              entityType:
                "match",

              entityId:
                match.id,

              title:
                "Verlo · Decisión después de la visita",

              body:
                "El inquilino quiere avanzar. Falta tu decisión.",

              url:
                ownerUrl,
            })
        } catch (
          pushError
        ) {
          console.error(
            "post-visit owner waiting push error:",
            pushError
          )
        }
      }

      if (
        accessToken.role ===
          "owner" &&
        tenantUrl
      ) {
        try {
          tenantPush =
            await notifyLeadOnce({
              eventKey:
                `post_visit_waiting:tenant:${match.id}:owner_yes:${now}`,

              eventType:
                "post_visit_waiting",

              leadId:
                contract
                  .tenant_lead_id,

              entityType:
                "match",

              entityId:
                match.id,

              title:
                "Verlo · Decisión después de la visita",

              body:
                "El propietario quiere avanzar. Falta tu decisión.",

              url:
                tenantUrl,
            })
        } catch (
          pushError
        ) {
          console.error(
            "post-visit tenant waiting push error:",
            pushError
          )
        }
      }
    }

    // =========================================================
    // 8. DOBLE OK #2
    //
    // Se notifica SOLO cuando se alcanza/re-alcanza.
    // Si alguien cambia NO y después vuelve a YES,
    // puede generarse un nuevo DOBLE OK válido.
    // =========================================================

    if (
      becameSecondDoubleOk
    ) {
      if (
        tenantUrl
      ) {
        try {
          tenantPush =
            await notifyLeadOnce({
              eventKey:
                `double_ok_2:tenant:${match.id}:${now}`,

              eventType:
                "double_ok_2",

              leadId:
                contract
                  .tenant_lead_id,

              entityType:
                "match",

              entityId:
                match.id,

              title:
                "Verlo · Los dos quieren avanzar",

              body:
                "Los dos confirmaron después de la visita. Ya pueden continuar con el acuerdo final.",

              url:
                tenantUrl,
            })
        } catch (
          pushError
        ) {
          console.error(
            "post-visit tenant double ok push error:",
            pushError
          )
        }
      }

      if (
        ownerUrl
      ) {
        try {
          ownerPush =
            await notifyLeadOnce({
              eventKey:
                `double_ok_2:owner:${match.id}:${now}`,

              eventType:
                "double_ok_2",

              leadId:
                contract
                  .owner_lead_id,

              entityType:
                "match",

              entityId:
                match.id,

              title:
                "Verlo · Los dos quieren avanzar",

              body:
                "Los dos confirmaron después de la visita. Ya pueden continuar con el acuerdo final.",

              url:
                ownerUrl,
            })
        } catch (
          pushError
        ) {
          console.error(
            "post-visit owner double ok push error:",
            pushError
          )
        }
      }
    }

    // =========================================================
    // 9. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      role:
        accessToken.role,

      decision,

      decision_changed:
        decisionChanged,

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

      became_second_double_ok:
        becameSecondDoubleOk,

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
          error instanceof
          Error
            ? error.message
            : "Unexpected server error",
      },
      {
        status: 500,
      }
    )
  }
}
