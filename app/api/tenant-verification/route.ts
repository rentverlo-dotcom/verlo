import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"
import { sendPushToLead } from "@/lib/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ACTIVE_MATCH_STATUSES = [
  "new",
  "reviewed",
  "contacted",
]

const MIN_MATCH_SCORE = 80

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

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
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )

    const body =
      await request
        .json()
        .catch(() => ({}))

    const token =
      clean(body?.token)

    const matchIds =
      Array.isArray(
        body?.match_ids
      )
        ? body.match_ids
            .map(
              (
                value: unknown
              ) =>
                clean(value)
            )
            .filter(Boolean)
        : []

    const documentNumber =
      clean(
        body?.document_number
      )

    const employmentStatus =
      clean(
        body?.employment_status
      )

    const incomeRange =
      clean(
        body?.income_range
      )

    const guaranteeType =
      clean(
        body?.guarantee_type
      )

    const moveNotes =
      clean(
        body?.move_notes
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
          error: "Missing token",
        },
        {
          status: 400,
        }
      )
    }

    if (
      matchIds.length === 0
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
      data: accessToken,
      error: tokenError,
    } = await supabase
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
          error: "Invalid token",
        },
        {
          status: 404,
        }
      )
    }

    if (
      accessToken.revoked_at
    ) {
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
      new Date(
        accessToken.expires_at
      ).getTime() <
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

    const tenantLeadId =
      accessToken.tenant_lead_id

    // =========================================================
    // 2. VALIDAR MATCHES ELEGIDOS
    // =========================================================

    const {
      data: selectedMatches,
      error: matchesError,
    } = await supabase
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
        matchesError.message
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
    // 2B. MISMA REGLA DE tenant-matches-view:
    //     EL OWNER DEBE TENER AL MENOS UNA FOTO
    // =========================================================

    const selectedOwnerLeadIds =
      Array.from(
        new Set(
          selectedMatches.map(
            (match) =>
              clean(
                match.owner_lead_id
              )
          )
        )
      ).filter(Boolean)

    const {
      data: selectedOwnerMedia,
      error:
        selectedOwnerMediaError,
    } = await supabase
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
        selectedOwnerMediaError.message
      )
    }

    const ownersWithPhoto =
      new Set(
        (
          selectedOwnerMedia ||
          []
        )
          .map(
            (item) =>
              clean(
                item.lead_id
              )
          )
          .filter(Boolean)
      )

    const allSelectedMatchesHavePhoto =
      selectedMatches.every(
        (match) =>
          ownersWithPhoto.has(
            clean(
              match.owner_lead_id
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
    // 3. GUARDAR / REUTILIZAR VERIFICACIÓN
    // =========================================================

    const {
      data:
        existingVerification,
      error:
        existingVerificationError,
    } = await supabase
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
          ascending: false,
        }
      )
      .limit(1)
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
        documents.income_proof ||
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
          .filter(Boolean)
          .join("\n\n") ||
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
      } = await supabase
        .from(
          "tenant_verifications"
        )
        .update(
          verificationPayload
        )
        .eq(
          "id",
          existingVerification.id
        )
        .select("id")
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
        updatedVerification.id
    } else {
      const {
        data:
          newVerification,
        error:
          verificationError,
      } = await supabase
        .from(
          "tenant_verifications"
        )
        .insert(
          verificationPayload
        )
        .select("id")
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
        newVerification.id
    }

    // =========================================================
    // 4. TENANT = INTERÉS + VALIDACIÓN COMPLETA
    // =========================================================

    const now =
      new Date()
        .toISOString()

    const {
      error:
        updateMatchesError,
    } = await supabase
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
        updateMatchesError.message
      )
    }

    // =========================================================
    // 5. OWNERS INVOLUCRADOS
    // =========================================================

    const ownerLeadIds =
      Array.from(
        new Set(
          selectedMatches.map(
            (match) =>
              match.owner_lead_id
          )
        )
      )

    const {
      data: owners,
      error: ownersError,
    } = await supabase
      .from(
        "lead_intake"
      )
      .select(`
        id,
        full_name
      `)
      .in(
        "id",
        ownerLeadIds
      )

    if (
      ownersError
    ) {
      throw new Error(
        ownersError.message
      )
    }

    const ownersById =
      new Map(
        (
          owners ||
          []
        ).map(
          (owner) => [
            owner.id,
            owner,
          ]
        )
      )

    const ownerNotifications:
      Array<{
        owner_lead_id:
          string

        candidates_url:
          string

        candidate_count:
          number

        sent:
          boolean

        result:
          unknown
      }> = []

    const readyNotifications:
      Array<{
        match_id:
          string

        owner_lead_id:
          string

        attempted:
          boolean

        ok:
          boolean

        status:
          number | null

        response:
          unknown
      }> = []

    // =========================================================
    // 6. PARA CADA OWNER:
    //    TOKEN AGREGADO + URL PERMANENTE
    // =========================================================

    for (
      const ownerLeadId
      of ownerLeadIds
    ) {
      const owner =
        ownersById.get(
          ownerLeadId
        )

      if (!owner) {
        continue
      }

      const {
        data:
          currentCandidates,
        error:
          candidatesError,
      } = await supabase
        .from(
          "lead_matches"
        )
        .select(`
          id,
          score,
          tenant_lead_id
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
        .not(
          "tenant_interest_at",
          "is",
          null
        )
        .not(
          "tenant_verified_at",
          "is",
          null
        )
        .order(
          "score",
          {
            ascending: false,
          }
        )

      if (
        candidatesError
      ) {
        throw new Error(
          candidatesError.message
        )
      }

      if (
        !currentCandidates ||
        currentCandidates.length ===
          0
      ) {
        continue
      }

      const {
        data:
          existingOwnerToken,
        error:
          tokenLookupError,
      } = await supabase
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
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle()

      if (
        tokenLookupError
      ) {
        throw new Error(
          tokenLookupError.message
        )
      }

      let ownerToken:
        string

      if (
        existingOwnerToken
      ) {
        ownerToken =
          existingOwnerToken.token
      } else {
        ownerToken =
          randomBytes(32)
            .toString(
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
        } = await supabase
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
            tokenInsertError.message
          )
        }
      }

      const candidatesUrl =
        `/candidatos/${ownerToken}`

      // =======================================================
      // 7. SI OWNER YA HABÍA COMPLETADO SU LADO:
      //    EL TENANT TERMINÓ SEGUNDO -> DISPARAR DOBLE OK
      //
      // owner-interest es la única fuente de verdad para:
      // - owner_interest_at
      // - ready_to_connect_at
      // - lead_contracts
      // - tokens de cierre/conexión
      // - PUSH del doble OK
      // =======================================================

      const selectedMatchesForOwner =
        selectedMatches.filter(
          (match) =>
            match.owner_lead_id ===
            ownerLeadId
        )

      let readyTriggeredForOwner =
        false

      for (
        const selectedMatch
        of selectedMatchesForOwner
      ) {
        if (
          !selectedMatch.owner_completed_at ||
          selectedMatch.ready_to_connect_at
        ) {
          continue
        }

        let readyStatus:
          number | null =
          null

        let readyResponse:
          unknown =
          null

        let readyOk =
          false

        try {
          const readyResponseHttp =
            await fetch(
              new URL(
                "/api/owner-interest",
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
                  JSON.stringify({
                    token:
                      ownerToken,

                    match_id:
                      selectedMatch.id,
                  }),
              }
            )

          readyStatus =
            readyResponseHttp.status

          readyResponse =
            await readyResponseHttp
              .json()
              .catch(
                async () => ({
                  raw:
                    await readyResponseHttp
                      .text()
                      .catch(
                        () => ""
                      ),
                })
              )

          readyOk =
            readyResponseHttp.ok &&
            (
              !readyResponse ||
              typeof readyResponse !==
                "object" ||
              !(
                "ok" in
                readyResponse
              ) ||
              (
                readyResponse as {
                  ok?: boolean
                }
              ).ok !==
                false
            )

          if (
            readyOk
          ) {
            readyTriggeredForOwner =
              true
          } else {
            console.error(
              "automatic ready-to-connect after tenant verification failed:",
              {
                ownerLeadId,
                matchId:
                  selectedMatch.id,
                status:
                  readyStatus,
                response:
                  readyResponse,
              }
            )
          }
        } catch (
          readyError
        ) {
          readyResponse =
            readyError instanceof
            Error
              ? readyError.message
              : String(
                  readyError
                )

          console.error(
            "automatic ready-to-connect after tenant verification error:",
            {
              ownerLeadId,
              matchId:
                selectedMatch.id,
              error:
                readyResponse,
            }
          )
        }

        readyNotifications.push({
          match_id:
            selectedMatch.id,

          owner_lead_id:
            ownerLeadId,

          attempted:
            true,

          ok:
            readyOk,

          status:
            readyStatus,

          response:
            readyResponse,
        })
      }

      // =======================================================
      // 8. SI TODAVÍA NO HUBO DOBLE OK:
      //    PUSH AL OWNER PARA QUE VEA SUS CANDIDATOS
      //
      // Texto provisorio. La lógica queda fija; el copy se
      // define después.
      // =======================================================

      let sent =
        false

      let pushResult:
        unknown =
        null

      if (
        !readyTriggeredForOwner
      ) {
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
                    ? "Tenés una persona interesada en tu propiedad. Revisá su perfil para avanzar."
                    : `Tenés ${currentCandidates.length} personas interesadas en tu propiedad. Revisá sus perfiles para avanzar.`,

                url:
                  candidatesUrl,
              }
            )

          sent =
            true
        } catch (
          pushError
        ) {
          console.error(
            "owner candidates push error:",
            ownerLeadId,
            pushError
          )
        }
      }

      ownerNotifications.push({
        owner_lead_id:
          ownerLeadId,

        candidates_url:
          candidatesUrl,

        candidate_count:
          currentCandidates.length,

        sent,

        result:
          pushResult,
      })
    }

    // =========================================================
    // 9. RESPONSE
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
          (item) =>
            item.sent
        ).length,

      owner_notifications:
        ownerNotifications,

      ready_to_connect_attempts:
        readyNotifications.length,

      ready_to_connect_ok:
        readyNotifications.filter(
          (item) =>
            item.ok
        ).length,

      ready_notifications:
        readyNotifications,
    })
  } catch (error) {
    console.error(
      "tenant verification error:",
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
