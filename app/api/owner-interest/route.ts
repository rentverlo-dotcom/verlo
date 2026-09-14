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
  return randomBytes(32)
    .toString("hex")
}

async function ensureMatchAccessToken({
  supabase,
  matchId,
  leadId,
  audience,
}: {
  supabase: ReturnType<
    typeof createClient
  >
  matchId: string
  leadId: string
  audience:
    | "tenant"
    | "owner"
}) {
  const now =
    Date.now()

  const {
    data:
      existingToken,
    error:
      lookupError,
  } =
    await supabase
      .from(
        "match_access_tokens"
      )
      .select(`
        id,
        token,
        expires_at
      `)
      .eq(
        "match_id",
        matchId
      )
      .eq(
        "lead_id",
        leadId
      )
      .eq(
        "audience",
        audience
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
    lookupError
  ) {
    throw new Error(
      lookupError.message
    )
  }

  const existingStillValid =
    Boolean(
      existingToken &&
        (
          !existingToken
            .expires_at ||
          new Date(
            existingToken
              .expires_at
          ).getTime() >
            now
        )
    )

  if (
    existingToken &&
    existingStillValid
  ) {
    return existingToken
      .token
  }

  const token =
    generateToken()

  const expiresAt =
    new Date(
      Date.now() +
        30 *
          24 *
          60 *
          60 *
          1000
    ).toISOString()

  const {
    error:
      insertError,
  } =
    await supabase
      .from(
        "match_access_tokens"
      )
      .insert({
        match_id:
          matchId,

        lead_id:
          leadId,

        owner_prospect_id:
          null,

        token,

        audience,

        expires_at:
          expiresAt,
      })

  if (
    insertError
  ) {
    throw new Error(
      insertError.message
    )
  }

  return token
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
    // 1. VALIDAR TOKEN AGREGADO DEL OWNER
    //
    // El owner llega desde:
    //
    // /candidatos/[token]
    //
    // Este token representa su dashboard general.
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
      clean(
        accessToken
          .owner_lead_id
      )

    if (
      !ownerLeadId
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Owner missing",
        },
        {
          status: 403,
        }
      )
    }

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
          status,
          tenant_interest_at,
          tenant_verified_at,
          owner_completed_at,
          owner_interest_at,
          ready_to_connect_at,
          introduced_at,
          tenant_post_visit_decision,
          tenant_post_visit_decided_at,
          owner_post_visit_decision,
          owner_post_visit_decided_at
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
    // 3. VALIDAR ESTADO DE NEGOCIO
    //
    // Para que el owner pueda decir "Quiero avanzar":
    //
    // - el tenant ya mostró interés
    // - el tenant ya completó validación
    // - el owner ya completó su propiedad
    //
    // Completar propiedad NO equivale a aceptar candidato.
    // Esta llamada es la aceptación explícita del owner.
    // =========================================================

    if (
      !match
        .tenant_interest_at ||
      !match
        .tenant_verified_at
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Tenant has not completed the candidate flow",
        },
        {
          status: 409,
        }
      )
    }

    if (
      !match
        .owner_completed_at
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Owner property is not completed",
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
    // 4. REGISTRAR OK EXPLÍCITO DEL OWNER
    //
    // Este es el primer momento donde owner_interest_at
    // debe existir.
    //
    // Si ambos ya dieron OK:
    //
    // ready_to_connect_at = DOBLE OK #1
    //
    // TODAVÍA:
    //
    // - NO hay contrato
    // - NO hay firma
    // - NO hay alquiler
    //
    // Solo empieza el tramo:
    //
    // contacto -> visita -> decisión post-visita
    // =========================================================

    const ownerInterestAt =
      match
        .owner_interest_at ||
      now

    const ready =
      Boolean(
        match
          .tenant_interest_at &&
        match
          .tenant_verified_at &&
        ownerInterestAt
      )

    const update:
      Record<
        string,
        string
      > = {
        owner_interest_at:
          ownerInterestAt,
      }

    if (
      ready &&
      !match
        .ready_to_connect_at
    ) {
      update
        .ready_to_connect_at =
        now
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
        .eq(
          "owner_lead_id",
          ownerLeadId
        )

    if (
      updateError
    ) {
      throw new Error(
        updateError.message
      )
    }

    const becameReady =
      ready &&
      !match
        .ready_to_connect_at

    // =========================================================
    // 5. CREAR / REUTILIZAR TOKENS DEL MATCH
    //
    // IMPORTANTE:
    //
    // Usamos match_access_tokens porque todavía estamos
    // trabajando sobre un MATCH, no sobre un contrato.
    //
    // Estos tokens permiten que cada parte entre a:
    //
    // /operacion/[token]
    //
    // Ahí después mostraremos:
    //
    // - contraparte
    // - teléfono
    // - dirección
    // - condiciones de visita
    // - CTA post-visita
    //
    // NO creamos lead_contracts acá.
    // NO creamos lead_contract_access_tokens acá.
    // =========================================================

    let tenantOperationToken:
      string | null =
      null

    let ownerOperationToken:
      string | null =
      null

    if (
      ready
    ) {
      tenantOperationToken =
        await ensureMatchAccessToken({
          supabase,

          matchId:
            match.id,

          leadId:
            match
              .tenant_lead_id,

          audience:
            "tenant",
        })

      ownerOperationToken =
        await ensureMatchAccessToken({
          supabase,

          matchId:
            match.id,

          leadId:
            match
              .owner_lead_id,

          audience:
            "owner",
        })
    }

    const tenantOperationUrl =
      tenantOperationToken
        ? `/operacion/${tenantOperationToken}`
        : null

    const ownerOperationUrl =
      ownerOperationToken
        ? `/operacion/${ownerOperationToken}`
        : null

    // =========================================================
    // 6. OBTENER NOMBRES PARA PUSH
    // =========================================================

    let tenantName =
      "tu inquilino"

    let ownerName =
      "tu propietario"

    if (
      becameReady
    ) {
      const {
        data:
          people,
        error:
          peopleError,
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
              match
                .tenant_lead_id,

              match
                .owner_lead_id,
            ]
          )

      if (
        peopleError
      ) {
        console.error(
          "ready people lookup error:",
          peopleError
        )
      }

      const tenant =
        (
          people ||
          []
        ).find(
          (
            person
          ) =>
            person.id ===
            match
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
            match
              .owner_lead_id
        )

      tenantName =
        firstName(
          tenant
            ?.full_name
        ) ||
        "tu inquilino"

      ownerName =
        firstName(
          owner
            ?.full_name
        ) ||
        "tu propietario"
    }

    // =========================================================
    // 7. DOBLE OK #1 -> PUSH A AMBOS
    //
    // Este push NO manda a contrato.
    //
    // Manda a /operacion/[token].
    //
    // Ahí empieza el tramo de visita.
    // =========================================================

    let tenantPush:
      unknown =
      null

    let ownerPush:
      unknown =
      null

    if (
      becameReady &&
      tenantOperationUrl &&
      ownerOperationUrl
    ) {
      try {
        tenantPush =
          await sendPushToLead(
            match
              .tenant_lead_id,
            {
              title:
                "Verlo · Doble OK",

              body:
                `Vos y ${ownerName} quieren avanzar. Ya pueden coordinar la visita.`,

              url:
                tenantOperationUrl,
            }
          )
      } catch (
        pushError
      ) {
        console.error(
          "tenant ready push error:",
          pushError
        )
      }

      try {
        ownerPush =
          await sendPushToLead(
            match
              .owner_lead_id,
            {
              title:
                "Verlo · Doble OK",

              body:
                `Vos y ${tenantName} quieren avanzar. Ya pueden coordinar la visita.`,

              url:
                ownerOperationUrl,
            }
          )
      } catch (
        pushError
      ) {
        console.error(
          "owner ready push error:",
          pushError
        )
      }
    }

    // =========================================================
    // 8. RESPONSE
    //
    // owner_closing_url se conserva TEMPORALMENTE como alias
    // para no romper /candidatos/[token], que todavía espera
    // ese nombre.
    //
    // Pero su valor YA NO apunta a /cierre.
    // Apunta a /operacion.
    //
    // Cuando actualicemos candidatos eliminaremos este alias.
    // =========================================================

    return NextResponse.json({
      ok: true,

      match_id:
        match.id,

      owner_interest:
        true,

      tenant_interest:
        Boolean(
          match
            .tenant_interest_at
        ),

      tenant_verified:
        Boolean(
          match
            .tenant_verified_at
        ),

      owner_completed:
        Boolean(
          match
            .owner_completed_at
        ),

      ready_to_connect:
        ready,

      became_ready:
        becameReady,

      tenant_operation_url:
        tenantOperationUrl,

      owner_operation_url:
        ownerOperationUrl,

      // Compatibilidad temporal con el frontend actual.
      owner_closing_url:
        ownerOperationUrl,

      // Ya NO existe contrato en DOBLE OK #1.
      contract_id:
        null,

      tenant_closing_url:
        null,

      tenant_push:
        tenantPush,

      owner_push:
        ownerPush,

      post_visit: {
        tenant_decision:
          match
            .tenant_post_visit_decision ||
          null,

        tenant_decided_at:
          match
            .tenant_post_visit_decided_at ||
          null,

        owner_decision:
          match
            .owner_post_visit_decision ||
          null,

        owner_decided_at:
          match
            .owner_post_visit_decided_at ||
          null,
      },
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
