import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  createClient,
} from "@supabase/supabase-js"

import {
  randomBytes,
} from "crypto"

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

function firstName(
  value: unknown
) {
  return (
    clean(value)
      .split(/\s+/)[0] ||
    ""
  )
}

function generateToken() {
  return randomBytes(
    32
  ).toString(
    "hex"
  )
}

async function postInternal(
  request: NextRequest,
  path: string,
  body: Record<
    string,
    unknown
  >
) {
  const response =
    await fetch(
      new URL(
        path,
        request.url
      ),
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            body
          ),
      }
    )

  const data =
    await response
      .json()
      .catch(
        () => null
      )

  return {
    ok:
      response.ok &&
      data?.ok !== false,

    status:
      response.status,

    data,
  }
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

    const matchId =
      clean(
        body?.match_id
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

    if (!matchId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing match_id",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. VALIDAR TOKEN OWNER
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

    const ownerLeadId =
      accessToken
        .owner_lead_id

    // =========================================================
    // 2. BUSCAR MATCH
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
          tenant_interest_at,
          owner_interest_at,
          ready_to_connect_at
        `)
        .eq(
          "id",
          matchId
        )
        .eq(
          "owner_lead_id",
          ownerLeadId
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

    // =========================================================
    // 3. GUARDAR OK OWNER
    //
    // NO espera al tenant.
    // NO exige validación.
    // =========================================================

    const now =
      new Date()
        .toISOString()

    if (
      !match
        .owner_interest_at
    ) {
      const {
        error:
          interestError,
      } =
        await supabase
          .from(
            "lead_matches"
          )
          .update({
            owner_interest_at:
              now,
          })
          .eq(
            "id",
            match.id
          )
          .eq(
            "owner_lead_id",
            ownerLeadId
          )

      if (
        interestError
      ) {
        throw new Error(
          interestError
            .message
        )
      }
    }

    // =========================================================
    // 4. RELEER MATCH
    // =========================================================

    const {
      data:
        currentMatch,
      error:
        currentMatchError,
    } =
      await supabase
        .from(
          "lead_matches"
        )
        .select(`
          id,
          tenant_lead_id,
          owner_lead_id,
          tenant_interest_at,
          owner_interest_at,
          ready_to_connect_at
        `)
        .eq(
          "id",
          match.id
        )
        .single()

    if (
      currentMatchError ||
      !currentMatch
    ) {
      throw new Error(
        "Could not reload match"
      )
    }

    const ready =
      Boolean(
        currentMatch
          .tenant_interest_at &&
        currentMatch
          .owner_interest_at
      )

    // =========================================================
    // 5. OWNER FUE PRIMERO
    //
    // Avisar tenant y esperar.
    // =========================================================

    if (!ready) {
      const tenantTokenResult =
        await postInternal(
          request,
          "/api/tenant-matches-token",
          {
            tenant_lead_id:
              currentMatch
                .tenant_lead_id,
          }
        )

      const matchesUrl =
        tenantTokenResult.ok &&
        tenantTokenResult
          .data
          ?.matches_url
          ? clean(
              tenantTokenResult
                .data
                .matches_url
            )
          : ""

      let tenantPush:
        unknown =
        null

      if (
        matchesUrl
      ) {
        try {
          tenantPush =
            await notifyLeadOnce({
              eventKey:
                `owner_interest_waiting_tenant:${currentMatch.id}`,

              eventType:
                "owner_interest_waiting_tenant",

              leadId:
                currentMatch
                  .tenant_lead_id,

              entityType:
                "match",

              entityId:
                currentMatch.id,

              title:
                "Verlo · Quieren avanzar",

              body:
                "El propietario quiere avanzar con vos. Entrá a Verlo para decidir.",

              url:
                matchesUrl,
            })
        } catch (
          pushError
        ) {
          console.error(
            "tenant interest push error:",
            pushError
          )
        }
      }

      return NextResponse.json({
        ok: true,

        match_id:
          currentMatch.id,

        owner_interest:
          true,

        tenant_interest:
          false,

        ready_to_connect:
          false,

        waiting_for:
          "tenant",

        tenant_push:
          tenantPush,
      })
    }

    // =========================================================
    // 6. DOBLE OK
    // =========================================================

    let becameReady =
      false

    if (
      !currentMatch
        .ready_to_connect_at
    ) {
      const {
        data:
          readyUpdate,
        error:
          readyError,
      } =
        await supabase
          .from(
            "lead_matches"
          )
          .update({
            ready_to_connect_at:
              now,
          })
          .eq(
            "id",
            currentMatch.id
          )
          .is(
            "ready_to_connect_at",
            null
          )
          .select(
            "id"
          )
          .maybeSingle()

      if (
        readyError
      ) {
        throw new Error(
          readyError
            .message
        )
      }

      becameReady =
        Boolean(
          readyUpdate
        )
    }

    // =========================================================
    // 7. CREAR / REUTILIZAR CONTRATO
    // =========================================================

    let contractId:
      string |
      null =
      null

    const {
      data:
        existingContract,
      error:
        existingContractError,
    } =
      await supabase
        .from(
          "lead_contracts"
        )
        .select(
          "id"
        )
        .eq(
          "lead_match_id",
          currentMatch.id
        )
        .maybeSingle()

    if (
      existingContractError
    ) {
      throw new Error(
        existingContractError
          .message
      )
    }

    if (
      existingContract
    ) {
      contractId =
        existingContract.id
    } else {
      const {
        data:
          newContract,
        error:
          contractError,
      } =
        await supabase
          .from(
            "lead_contracts"
          )
          .insert({
            lead_match_id:
              currentMatch.id,

            tenant_lead_id:
              currentMatch
                .tenant_lead_id,

            owner_lead_id:
              currentMatch
                .owner_lead_id,

            status:
              "draft",
          })
          .select(
            "id"
          )
          .single()

      if (
        contractError ||
        !newContract
      ) {
        const {
          data:
            racedContract,
          error:
            racedContractError,
        } =
          await supabase
            .from(
              "lead_contracts"
            )
            .select(
              "id"
            )
            .eq(
              "lead_match_id",
              currentMatch.id
            )
            .maybeSingle()

        if (
          racedContractError ||
          !racedContract
        ) {
          throw new Error(
            contractError
              ?.message ||
              "Could not create contract"
          )
        }

        contractId =
          racedContract.id
      } else {
        contractId =
          newContract.id
      }
    }

    // =========================================================
    // 8. TOKEN TENANT
    // =========================================================

    let tenantClosingToken:
      string |
      null =
      null

    const {
      data:
        existingTenantToken,
      error:
        tenantTokenError,
    } =
      await supabase
        .from(
          "lead_contract_access_tokens"
        )
        .select(
          "token"
        )
        .eq(
          "contract_id",
          contractId
        )
        .eq(
          "lead_id",
          currentMatch
            .tenant_lead_id
        )
        .eq(
          "role",
          "tenant"
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
        .limit(1)
        .maybeSingle()

    if (
      tenantTokenError
    ) {
      throw new Error(
        tenantTokenError
          .message
      )
    }

    if (
      existingTenantToken
    ) {
      tenantClosingToken =
        existingTenantToken
          .token
    } else {
      tenantClosingToken =
        generateToken()

      const {
        error:
          insertTenantTokenError,
      } =
        await supabase
          .from(
            "lead_contract_access_tokens"
          )
          .insert({
            contract_id:
              contractId,

            lead_id:
              currentMatch
                .tenant_lead_id,

            role:
              "tenant",

            token:
              tenantClosingToken,
          })

      if (
        insertTenantTokenError
      ) {
        const {
          data:
            racedTenantToken,
          error:
            racedTenantTokenError,
        } =
          await supabase
            .from(
              "lead_contract_access_tokens"
            )
            .select(
              "token"
            )
            .eq(
              "contract_id",
              contractId
            )
            .eq(
              "role",
              "tenant"
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
            .limit(1)
            .maybeSingle()

        if (
          racedTenantTokenError ||
          !racedTenantToken
        ) {
          throw new Error(
            insertTenantTokenError
              .message
          )
        }

        tenantClosingToken =
          racedTenantToken
            .token
      }
    }

    // =========================================================
    // 9. TOKEN OWNER
    // =========================================================

    let ownerClosingToken:
      string |
      null =
      null

    const {
      data:
        existingOwnerToken,
      error:
        ownerTokenError,
    } =
      await supabase
        .from(
          "lead_contract_access_tokens"
        )
        .select(
          "token"
        )
        .eq(
          "contract_id",
          contractId
        )
        .eq(
          "lead_id",
          currentMatch
            .owner_lead_id
        )
        .eq(
          "role",
          "owner"
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
        .limit(1)
        .maybeSingle()

    if (
      ownerTokenError
    ) {
      throw new Error(
        ownerTokenError
          .message
      )
    }

    if (
      existingOwnerToken
    ) {
      ownerClosingToken =
        existingOwnerToken
          .token
    } else {
      ownerClosingToken =
        generateToken()

      const {
        error:
          insertOwnerTokenError,
      } =
        await supabase
          .from(
            "lead_contract_access_tokens"
          )
          .insert({
            contract_id:
              contractId,

            lead_id:
              currentMatch
                .owner_lead_id,

            role:
              "owner",

            token:
              ownerClosingToken,
          })

      if (
        insertOwnerTokenError
      ) {
        const {
          data:
            racedOwnerToken,
          error:
            racedOwnerTokenError,
        } =
          await supabase
            .from(
              "lead_contract_access_tokens"
            )
            .select(
              "token"
            )
            .eq(
              "contract_id",
              contractId
            )
            .eq(
              "role",
              "owner"
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
            .limit(1)
            .maybeSingle()

        if (
          racedOwnerTokenError ||
          !racedOwnerToken
        ) {
          throw new Error(
            insertOwnerTokenError
              .message
          )
        }

        ownerClosingToken =
          racedOwnerToken
            .token
      }
    }

    const tenantClosingUrl =
      `/cierre/${tenantClosingToken}`

    const ownerClosingUrl =
      `/cierre/${ownerClosingToken}`

    // =========================================================
    // 10. NOMBRES
    // =========================================================

    const {
      data:
        people,
    } =
      await supabase
        .from(
          "lead_intake"
        )
        .select(`
          id,
          full_name
        `)
        .in(
          "id",
          [
            currentMatch
              .tenant_lead_id,

            currentMatch
              .owner_lead_id,
          ]
        )

    const tenant =
      (
        people ||
        []
      ).find(
        (
          person
        ) =>
          person.id ===
          currentMatch
            .tenant_lead_id
      )

    const owner =
      (
        people ||
        []
      ).find(
        (
          person
        ) =>
          person.id ===
          currentMatch
            .owner_lead_id
      )

    const tenantName =
      firstName(
        tenant
          ?.full_name
      ) ||
      "el inquilino"

    const ownerName =
      firstName(
        owner
          ?.full_name
      ) ||
      "el propietario"

    // =========================================================
    // 11. PUSH DOBLE OK
    // =========================================================

    let tenantPush:
      unknown =
      null

    let ownerPush:
      unknown =
      null

    if (
      becameReady
    ) {
      try {
        tenantPush =
          await notifyLeadOnce({
            eventKey:
              `double_ok_1:tenant:${currentMatch.id}`,

            eventType:
              "double_ok_1",

            leadId:
              currentMatch
                .tenant_lead_id,

            entityType:
              "match",

            entityId:
              currentMatch.id,

            title:
              "Verlo · Doble OK",

            body:
              `Vos y ${ownerName} quieren avanzar. Entrá para continuar.`,

            url:
              tenantClosingUrl,
          })
      } catch (
        pushError
      ) {
        console.error(
          "tenant double ok push error:",
          pushError
        )
      }

      try {
        ownerPush =
          await notifyLeadOnce({
            eventKey:
              `double_ok_1:owner:${currentMatch.id}`,

            eventType:
              "double_ok_1",

            leadId:
              currentMatch
                .owner_lead_id,

            entityType:
              "match",

            entityId:
              currentMatch.id,

            title:
              "Verlo · Doble OK",

            body:
              `Vos y ${tenantName} quieren avanzar. Entrá para continuar.`,

            url:
              ownerClosingUrl,
          })
      } catch (
        pushError
      ) {
        console.error(
          "owner double ok push error:",
          pushError
        )
      }
    }

    return NextResponse.json({
      ok: true,

      match_id:
        currentMatch.id,

      owner_interest:
        true,

      tenant_interest:
        true,

      ready_to_connect:
        true,

      became_ready:
        becameReady,

      contract_id:
        contractId,

      tenant_closing_url:
        tenantClosingUrl,

      owner_closing_url:
        ownerClosingUrl,

      tenant_push:
        tenantPush,

      owner_push:
        ownerPush,
    })
  } catch (
    error
  ) {
    console.error(
      "owner-interest error:",
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
