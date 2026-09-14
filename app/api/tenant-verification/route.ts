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

    const matchIds =
      Array.isArray(
        body?.match_ids
      )
        ? body.match_ids
            .map(
              (
                value:
                  unknown
              ) =>
                clean(
                  value
                )
            )
            .filter(
              Boolean
            )
        : []

    const documentNumber =
      clean(
        body
          ?.document_number
      )

    const employmentStatus =
      clean(
        body
          ?.employment_status
      )

    const incomeRange =
      clean(
        body
          ?.income_range
      )

    const guaranteeType =
      clean(
        body
          ?.guarantee_type
      )

    const moveNotes =
      clean(
        body
          ?.move_notes
      )

    const documents =
      body?.documents &&
      typeof body.documents ===
        "object"
        ? body.documents
        : {}

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
      matchIds.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Select at least one match",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. VALIDAR TOKEN AGREGADO DEL TENANT
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
    // 2. VALIDAR MATCHES ELEGIDOS
    // =========================================================

    const {
      data:
        selectedMatches,
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
          status,
          owner_completed_at,
          owner_interest_at,
          tenant_interest_at,
          tenant_verified_at,
          ready_to_connect_at
        `)
        .in(
          "id",
          matchIds
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

    if (
      matchesError
    ) {
      throw new Error(
        matchesError
          .message
      )
    }

    if (
      !selectedMatches ||
      selectedMatches.length !==
        matchIds.length
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "One or more selected matches are invalid",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 2B. LA PROPIEDAD DEBE TENER AL MENOS UNA FOTO
    // =========================================================

    const selectedOwnerLeadIds =
      Array.from(
        new Set(
          selectedMatches.map(
            (
              match
            ) =>
              clean(
                match
                  .owner_lead_id
              )
          )
        )
      ).filter(
        Boolean
      )

    const {
      data:
        selectedOwnerMedia,
      error:
        selectedOwnerMediaError,
    } =
      await supabase
        .from(
          "owner_property_media"
        )
        .select(`
          id,
          lead_id,
          media_type
        `)
        .in(
          "lead_id",
          selectedOwnerLeadIds
        )
        .eq(
          "media_type",
          "photo"
        )

    if (
      selectedOwnerMediaError
    ) {
      throw new Error(
        selectedOwnerMediaError
          .message
      )
    }

    const ownersWithPhoto =
      new Set(
        (
          selectedOwnerMedia ||
          []
        )
          .map(
            (
              item
            ) =>
              clean(
                item.lead_id
              )
          )
          .filter(
            Boolean
          )
      )

    const allSelectedMatchesHavePhoto =
      selectedMatches.every(
        (
          match
        ) =>
          ownersWithPhoto.has(
            clean(
              match
                .owner_lead_id
            )
          )
      )

    if (
      !allSelectedMatchesHavePhoto
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "One or more selected properties are not available",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 3. GUARDAR / REUTILIZAR VERIFICACIÓN DEL TENANT
    // =========================================================

    const {
      data:
        existingVerification,
      error:
        existingVerificationError,
    } =
      await supabase
        .from(
          "tenant_verifications"
        )
        .select(`
          id,
          dni_front_path,
          dni_back_path,
          selfie_path,
          income_proof_path
        `)
        .eq(
          "lead_id",
          tenantLeadId
        )
        .is(
          "match_id",
          null
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          1
        )
        .maybeSingle()

    if (
      existingVerificationError
    ) {
      throw new Error(
        existingVerificationError
          .message
      )
    }

    const verificationPayload = {
      lead_id:
        tenantLeadId,

      match_id:
        null,

      dni_front_path:
        documents.dni_front ||
        existingVerification
          ?.dni_front_path ||
        null,

      dni_back_path:
        documents.dni_back ||
        existingVerification
          ?.dni_back_path ||
        null,

      selfie_path:
        documents.selfie ||
        existingVerification
          ?.selfie_path ||
        null,

      income_proof_path:
        documents
          .income_proof ||
        existingVerification
          ?.income_proof_path ||
        null,

      document_number:
        documentNumber ||
        null,

      employment_status:
        employmentStatus ||
        null,

      income_range:
        incomeRange ||
        null,

      guarantee_type:
        guaranteeType ||
        null,

      move_notes:
        [
          documents
            .guarantee_proof
            ? `Garantía / seguro / caución: ${documents.guarantee_proof}`
            : "",

          moveNotes,
        ]
          .filter(
            Boolean
          )
          .join(
            "\n\n"
          ) ||
        null,

      status:
        "submitted",
    }

    let verificationId:
      string | null =
      null

    if (
      existingVerification
    ) {
      const {
        data:
          updatedVerification,
        error:
          verificationError,
      } =
        await supabase
          .from(
            "tenant_verifications"
          )
          .update(
            verificationPayload
          )
          .eq(
            "id",
            existingVerification
              .id
          )
          .select(
            "id"
          )
          .single()

      if (
        verificationError ||
        !updatedVerification
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Could not update tenant verification",
          },
          {
            status: 500,
          }
        )
      }

      verificationId =
        updatedVerification
          .id
    } else {
      const {
        data:
          newVerification,
        error:
          verificationError,
      } =
        await supabase
          .from(
            "tenant_verifications"
          )
          .insert(
            verificationPayload
          )
          .select(
            "id"
          )
          .single()

      if (
        verificationError ||
        !newVerification
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Could not save tenant verification",
          },
          {
            status: 500,
          }
        )
      }

      verificationId =
        newVerification
          .id
    }

    // =========================================================
    // 4. TENANT = INTERÉS REAL + VALIDACIÓN COMPLETA
    //
    // Acá SÍ registramos:
    //
    // tenant_interest_at
    // tenant_verified_at
    //
    // NO tocamos owner_interest_at.
    // NO tocamos ready_to_connect_at.
    // =========================================================

    const now =
      new Date()
        .toISOString()

    const {
      error:
        updateMatchesError,
    } =
      await supabase
        .from(
          "lead_matches"
        )
        .update({
          tenant_interest_at:
            now,

          tenant_verified_at:
            now,
        })
        .in(
          "id",
          matchIds
        )
        .eq(
          "tenant_lead_id",
          tenantLeadId
        )

    if (
      updateMatchesError
    ) {
      throw new Error(
        updateMatchesError
          .message
      )
    }

    // =========================================================
    // 5. OWNERS INVOLUCRADOS
    // =========================================================

    const ownerLeadIds =
      Array.from(
        new Set(
          selectedMatches.map(
            (
              match
            ) =>
              clean(
                match
                  .owner_lead_id
              )
          )
        )
      ).filter(
        Boolean
      )

    // =========================================================
    // 6. SABER QUÉ OWNERS YA COMPLETARON PROPIEDAD
    // =========================================================

    const {
      data:
        completionRows,
      error:
        completionRowsError,
    } =
      await supabase
        .from(
          "owner_property_completions"
        )
        .select(`
          id,
          lead_id,
          status
        `)
        .in(
          "lead_id",
          ownerLeadIds
        )
        .eq(
          "status",
          "submitted"
        )

    if (
      completionRowsError
    ) {
      throw new Error(
        completionRowsError
          .message
      )
    }

    const completedOwners =
      new Set(
        (
          completionRows ||
          []
        )
          .map(
            (
              row
            ) =>
              clean(
                row.lead_id
              )
          )
          .filter(
            Boolean
          )
      )

    const ownerNotifications:
      Array<{
        owner_lead_id:
          string

        destination:
          "property" |
          "candidates"

        url:
          string

        candidate_count:
          number

        sent:
          boolean

        result:
          unknown
      }> = []

    // =========================================================
    // 7. PARA CADA OWNER
    //
    // REGLA DEFINITIVA:
    //
    // owner incompleto -> /propiedad/[token]
    // owner completo   -> /candidatos/[token]
    //
    // NUNCA llamamos automáticamente a /api/owner-interest.
    // =========================================================

    for (
      const ownerLeadId
      of ownerLeadIds
    ) {
      const currentCandidates =
        selectedMatches.filter(
          (
            match
          ) =>
            clean(
              match
                .owner_lead_id
            ) ===
            ownerLeadId
        )

      if (
        currentCandidates.length ===
        0
      ) {
        continue
      }

      const ownerCompleted =
        completedOwners.has(
          ownerLeadId
        )

      // =======================================================
      // 7A. OWNER TODAVÍA INCOMPLETO
      //
      // Tiene interés real del tenant, pero antes de poder
      // decidir tiene que terminar su propiedad.
      // =======================================================

      if (
        !ownerCompleted
      ) {
        const propertyTokenResult =
          await postInternal(
            request,
            "/api/owner-property-token",
            {
              owner_lead_id:
                ownerLeadId,
            }
          )

        const propertyUrl =
          propertyTokenResult.ok
            ? clean(
                propertyTokenResult
                  .data
                  ?.property_url
              )
            : ""

        if (
          !propertyUrl
        ) {
          console.error(
            "owner property token error after tenant verification:",
            ownerLeadId,
            propertyTokenResult
          )

          continue
        }

        let sent =
          false

        let pushResult:
          unknown =
          null

        try {
          pushResult =
            await sendPushToLead(
              ownerLeadId,
              {
                title:
                  "Verlo · Hay interés",

                body:
                  currentCandidates.length ===
                  1
                    ? "Una persona compatible quiere avanzar con tu propiedad. Terminá de completar tu publicación para seguir."
                    : `${currentCandidates.length} personas compatibles quieren avanzar. Terminá de completar tu propiedad para seguir.`,

                url:
                  propertyUrl,
              }
            )

          sent =
            Number(
              (
                pushResult as {
                  sent?:
                    number
                }
              )?.sent ||
                0
            ) >
            0
        } catch (
          pushError
        ) {
          console.error(
            "owner property push after tenant verification error:",
            ownerLeadId,
            pushError
          )
        }

        ownerNotifications.push({
          owner_lead_id:
            ownerLeadId,

          destination:
            "property",

          url:
            propertyUrl,

          candidate_count:
            currentCandidates.length,

          sent,

          result:
            pushResult,
        })

        continue
      }

      // =======================================================
      // 7B. OWNER YA COMPLETÓ PROPIEDAD
      //
      // Ahora sí lo mandamos a su dashboard central para que
      // ÉL decida explícitamente si quiere avanzar.
      // =======================================================

      const {
        data:
          existingOwnerToken,
        error:
          tokenLookupError,
      } =
        await supabase
          .from(
            "owner_candidates_access_tokens"
          )
          .select(`
            id,
            token,
            expires_at
          `)
          .eq(
            "owner_lead_id",
            ownerLeadId
          )
          .is(
            "revoked_at",
            null
          )
          .or(
            `expires_at.is.null,expires_at.gt.${now}`
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(
            1
          )
          .maybeSingle()

      if (
        tokenLookupError
      ) {
        throw new Error(
          tokenLookupError
            .message
        )
      }

      let ownerToken:
        string

      if (
        existingOwnerToken
      ) {
        ownerToken =
          existingOwnerToken
            .token
      } else {
        ownerToken =
          randomBytes(
            32
          ).toString(
            "hex"
          )

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
            tokenInsertError,
        } =
          await supabase
            .from(
              "owner_candidates_access_tokens"
            )
            .insert({
              owner_lead_id:
                ownerLeadId,

              token:
                ownerToken,

              expires_at:
                expiresAt,
            })

        if (
          tokenInsertError
        ) {
          throw new Error(
            tokenInsertError
              .message
          )
        }
      }

      const candidatesUrl =
        `/candidatos/${ownerToken}`

      let sent =
        false

      let pushResult:
        unknown =
        null

      try {
        pushResult =
          await sendPushToLead(
            ownerLeadId,
            {
              title:
                "Verlo · Tenés candidato",

              body:
                currentCandidates.length ===
                1
                  ? "Una persona interesada completó su validación. Revisá su perfil y decidí si querés avanzar."
                  : `${currentCandidates.length} personas interesadas completaron su validación. Revisá sus perfiles y decidí con quién querés avanzar.`,

              url:
                candidatesUrl,
            }
          )

        sent =
          Number(
            (
              pushResult as {
                sent?:
                  number
              }
            )?.sent ||
              0
          ) >
          0
      } catch (
        pushError
      ) {
        console.error(
          "owner candidates push error:",
          ownerLeadId,
          pushError
        )
      }

      ownerNotifications.push({
        owner_lead_id:
          ownerLeadId,

        destination:
          "candidates",

        url:
          candidatesUrl,

        candidate_count:
          currentCandidates.length,

        sent,

        result:
          pushResult,
      })
    }

    // =========================================================
    // 8. RESPONSE
    //
    // No existe ningún ready-to-connect automático acá.
    // El siguiente evento depende de una acción explícita
    // del owner desde /candidatos/[token].
    // =========================================================

    return NextResponse.json({
      ok: true,

      verification_id:
        verificationId,

      tenant_lead_id:
        tenantLeadId,

      matches_updated:
        matchIds.length,

      match_ids:
        matchIds,

      owners_ready:
        ownerLeadIds.length,

      owners_notified:
        ownerNotifications.filter(
          (
            item
          ) =>
            item.sent
        ).length,

      owner_notifications:
        ownerNotifications,

      ready_to_connect_attempts:
        0,

      ready_to_connect_ok:
        0,

      ready_notifications:
        [],
    })
  } catch (
    error
  ) {
    console.error(
      "tenant verification error:",
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
