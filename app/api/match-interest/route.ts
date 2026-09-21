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

const ACTIVE_MATCH_STATUSES = [
  "new",
  "reviewed",
  "contacted",
]

const MIN_MATCH_SCORE =
  80

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
      data?.ok !==
        false,

    status:
      response.status,

    data,
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok:
        false,

      error:
        "Use POST",
    },
    {
      status: 405,
    }
  )
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
    // 1. VALIDAR TOKEN DEL TENANT
    // =========================================================

    const {
      data:
        accessToken,
      error:
        tokenError,
    } =
      await supabase
        .from(
          "tenant_matches_access_tokens"
        )
        .select(`
          id,
          tenant_lead_id,
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

    const tenantLeadId =
      accessToken
        .tenant_lead_id

    // =========================================================
    // 2. VALIDAR MATCH
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
          score,
          status,
          tenant_interest_at,
          owner_interest_at,
          ready_to_connect_at
        `)
        .eq(
          "id",
          matchId
        )
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
    // 3. GUARDAR OK DEL TENANT
    //
    // NO validación
    // NO DNI
    // NO documentos
    // SOLO "ME INTERESA"
    // =========================================================

    const now =
      new Date()
        .toISOString()

    if (
      !match
        .tenant_interest_at
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
            tenant_interest_at:
              now,
          })
          .eq(
            "id",
            match.id
          )
          .eq(
            "tenant_lead_id",
            tenantLeadId
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
    // 4. RELEER ESTADO
    //
    // Esto evita problemas si owner y tenant hacen click
    // prácticamente al mismo tiempo.
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
    // 5. SI OWNER TODAVÍA NO DIO OK
    // AVISARLE PARA QUE ENTRE A /candidatos
    // =========================================================

    if (!ready) {
      const verificationUrl =
        `/tenant/validacion/${encodeURIComponent(
          token
        )}?matches=${encodeURIComponent(
          currentMatch.id
        )}`

      return NextResponse.json({
        ok: true,

        match_id:
          currentMatch.id,

        tenant_interest:
          true,

        owner_interest:
          false,

        ready_to_connect:
          false,

        waiting_for:
          "tenant_verification",

        verification_url:
          verificationUrl,
      })
    }

    // =========================================================
    // 6. DOBLE OK
    //
    // Ambos ya dijeron ME INTERESA.
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
    // 7. CREAR / REUTILIZAR CONTRATO DRAFT
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
        // Puede existir una carrera con el OK del owner.
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
    // 8. TOKEN CIERRE TENANT
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
    // 9. TOKEN CIERRE OWNER
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
        error
      ) {
        console.error(
          "tenant double ok push error:",
          error
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
        error
      ) {
        console.error(
          "owner double ok push error:",
          error
        )
      }
    }

    return NextResponse.json({
      ok: true,

      match_id:
        currentMatch.id,

      tenant_interest:
        true,

      owner_interest:
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
      "match-interest error:",
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
