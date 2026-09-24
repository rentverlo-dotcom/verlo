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

const ACTIVE_MATCH_STATUSES = [
  "new",
  "reviewed",
  "contacted",
  "converted",
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

    let matchIds =
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
        ? body.documents as {
            dni_front?: string
            dni_back?: string
            selfie?: string
            income_proof?: string
            guarantee_proof?: string
          }
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

    // =========================================================
    // 1. RESOLVER TOKEN DEL TENANT
    //
    // Puede venir desde:
    // - panel de matches
    // - cierre
    // =========================================================

    let tenantLeadId =
      ""

    let tokenSource:
      | "matches"
      | "closing"
      | null =
      null

    let closingContractId =
      ""

    // =========================================================
    // 1A. TOKEN PANEL MATCHES
    // =========================================================

    const {
      data:
        matchesAccessToken,

      error:
        matchesTokenError,
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
        .maybeSingle()

    if (
      matchesTokenError
    ) {
      console.error(
        "tenant matches token lookup error:",
        matchesTokenError
      )
    }

    if (
      matchesAccessToken
    ) {
      if (
        matchesAccessToken
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
        matchesAccessToken
          .expires_at &&
        new Date(
          matchesAccessToken
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

      tenantLeadId =
        clean(
          matchesAccessToken
            .tenant_lead_id
        )

      tokenSource =
        "matches"
    }

    // =========================================================
    // 1B. TOKEN DE CIERRE
    // =========================================================

    if (
      !tenantLeadId
    ) {
      const {
        data:
          closingAccessToken,

        error:
          closingTokenError,
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
          .eq(
            "role",
            "tenant"
          )
          .maybeSingle()

      if (
        closingTokenError
      ) {
        console.error(
          "tenant closing token lookup error:",
          closingTokenError
        )
      }

      if (
        closingAccessToken
      ) {
        if (
          closingAccessToken
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
          closingAccessToken
            .expires_at &&
          new Date(
            closingAccessToken
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

        tenantLeadId =
          clean(
            closingAccessToken
              .lead_id
          )

        closingContractId =
          clean(
            closingAccessToken
              .contract_id
          )

        tokenSource =
          "closing"
      }
    }

    if (
      !tenantLeadId
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

    // =========================================================
    // 2. SI VIENE DE CIERRE, RESOLVER MATCH DESDE CONTRATO
    // =========================================================

    if (
      tokenSource ===
        "closing"
    ) {
      if (
        !closingContractId
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Closing contract missing",
          },
          {
            status: 400,
          }
        )
      }

      const {
        data:
          closingContract,

        error:
          closingContractError,
      } =
        await supabase
          .from(
            "lead_contracts"
          )
          .select(`
            id,
            lead_match_id,
            tenant_lead_id,
            owner_lead_id
          `)
          .eq(
            "id",
            closingContractId
          )
          .eq(
            "tenant_lead_id",
            tenantLeadId
          )
          .single()

      if (
        closingContractError ||
        !closingContract
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

      const closingMatchId =
        clean(
          closingContract
            .lead_match_id
        )

      if (
        !closingMatchId
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Contract has no match",
          },
          {
            status: 400,
          }
        )
      }

      matchIds = [
        closingMatchId,
      ]
    }

    // =========================================================
    // 3. NECESITAMOS MATCH
    // =========================================================

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
    // 4. VALIDAR MATCHES
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
          tenant_interest_at,
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

    // The UI records interest before opening verification. Enforce the
    // same order for direct API requests.
    if (
      tokenSource === "matches" &&
      selectedMatches.some(
        match => !match.tenant_interest_at
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Select each property with ME INTERESA before verification",
        },
        { status: 409 }
      )
    }

    // =========================================================
    // 4B. SI VIENE DE CIERRE, EL MATCH DEBE ESTAR EN DOBLE OK #1
    // =========================================================

    if (
      tokenSource ===
      "closing"
    ) {
      const closingMatch =
        selectedMatches[0]

      if (
        !closingMatch
          ?.ready_to_connect_at
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Match is not ready for closing",
          },
          {
            status: 409,
          }
        )
      }
    }

    // =========================================================
    // 5. VALIDAR PROPIEDAD
    // =========================================================

    const selectedOwnerLeadIds =
      Array.from(
        new Set(
          selectedMatches.map(
            match =>
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
            item =>
              clean(
                item
                  .lead_id
              )
          )
          .filter(
            Boolean
          )
      )

    const allSelectedMatchesHavePhoto =
      selectedMatches.every(
        match =>
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
    // 6. BUSCAR VERIFICACIÓN REUTILIZABLE
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
          document_number,
          dni_front_path,
          dni_back_path,
          selfie_path,
          income_proof_path,
          employment_status,
          income_range,
          guarantee_type,
          move_notes,
          status
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

    // =========================================================
    // 7. RESOLVER VALORES FINALES
    // =========================================================

    const finalDocumentNumber =
      documentNumber ||
      clean(
        existingVerification
          ?.document_number
      )

    const finalDniFront =
      clean(
        documents
          .dni_front
      ) ||
      clean(
        existingVerification
          ?.dni_front_path
      )

    const finalDniBack =
      clean(
        documents
          .dni_back
      ) ||
      clean(
        existingVerification
          ?.dni_back_path
      )

    const finalSelfie =
      clean(
        documents
          .selfie
      ) ||
      clean(
        existingVerification
          ?.selfie_path
      )

    const finalIncomeProof =
      clean(
        documents
          .income_proof
      ) ||
      clean(
        existingVerification
          ?.income_proof_path
      )

    const finalEmploymentStatus =
      employmentStatus ||
      clean(
        existingVerification
          ?.employment_status
      )

    const finalIncomeRange =
      incomeRange ||
      clean(
        existingVerification
          ?.income_range
      )

    const finalGuaranteeType =
      guaranteeType ||
      clean(
        existingVerification
          ?.guarantee_type
      )

    // =========================================================
    // 7B. DOCUMENTACIÓN OBLIGATORIA
    // =========================================================

    if (
      !finalDocumentNumber
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "DNI number is required",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !finalDniFront ||
      !finalDniBack ||
      !finalSelfie
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "DNI front, DNI back and selfie are required",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 7C. MOVE NOTES + GARANTÍA
    // =========================================================

    const existingMoveNotes =
      clean(
        existingVerification
          ?.move_notes
      )

    const guaranteeProofLine =
      documents
        .guarantee_proof
        ? `Garantía / seguro / caución: ${documents.guarantee_proof}`
        : ""

    const previousHumanNotes =
      existingMoveNotes
        .split(
          /\r?\n/
        )
        .filter(
          line =>
            !line
              .trim()
              .toLowerCase()
              .startsWith(
                "garantía / seguro / caución:"
              )
        )
        .join(
          "\n"
        )
        .trim()

    const previousGuaranteeLine =
      existingMoveNotes
        .split(
          /\r?\n/
        )
        .find(
          line =>
            line
              .trim()
              .toLowerCase()
              .startsWith(
                "garantía / seguro / caución:"
              )
        ) ||
      ""

    const finalMoveNotes =
      [
        guaranteeProofLine ||
          previousGuaranteeLine,

        moveNotes ||
          previousHumanNotes,
      ]
        .filter(
          Boolean
        )
        .join(
          "\n\n"
        ) ||
      null

    // =========================================================
    // 8. GUARDAR VERIFICACIÓN
    // =========================================================

    const verificationPayload = {
      lead_id:
        tenantLeadId,

      match_id:
        null,

      dni_front_path:
        finalDniFront,

      dni_back_path:
        finalDniBack,

      selfie_path:
        finalSelfie,

      income_proof_path:
        finalIncomeProof ||
        null,

      document_number:
        finalDocumentNumber,

      employment_status:
        finalEmploymentStatus ||
        null,

      income_range:
        finalIncomeRange ||
        null,

      guarantee_type:
        finalGuaranteeType ||
        null,

      move_notes:
        finalMoveNotes,

      status:
        "submitted",
    }

    let verificationId:
      string |
      null =
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
    // 9. MARCAR TENANT VERIFIED
    //
    // IMPORTANTE:
    // NO toca tenant_interest_at.
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
    // 10. NOTIFICAR OWNERS DESDE VALIDACIÓN PREVIA
    // =========================================================

    const ownerNotifications: Array<{
      owner_lead_id: string
      candidates_url: string
      push: unknown
    }> = []

    if (
      tokenSource ===
        "matches" &&
      verificationId
    ) {
      const uniqueOwnerLeadIds =
        Array.from(
          new Set(
            selectedMatches
              .map(
                (
                  match
                ) =>
                  clean(
                    match
                      .owner_lead_id
                  )
              )
              .filter(
                Boolean
              )
          )
        )

      for (
        const ownerLeadId
        of uniqueOwnerLeadIds
      ) {
        const tokenResponse =
          await fetch(
            new URL(
              "/api/owner-candidates-token",
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
                  owner_lead_id:
                    ownerLeadId,
                }),
            }
          )

        const tokenData =
          await tokenResponse
            .json()
            .catch(
              () => null
            )

        const candidatesUrl =
          tokenResponse.ok &&
          tokenData?.ok &&
          tokenData
            ?.candidates_url
            ? clean(
                tokenData
                  .candidates_url
              )
            : ""

        if (
          !candidatesUrl
        ) {
          continue
        }

        let push:
          unknown =
          null

        try {
          push =
            await notifyLeadOnce({
              eventKey:
                `tenant_verification_submitted:owner:${ownerLeadId}:${verificationId}`,

              eventType:
                "tenant_verification_submitted",

              leadId:
                ownerLeadId,

              entityType:
                "verification",

              entityId:
                verificationId,

              title:
                "Verlo · Candidato validado",

              body:
                "Una persona interesada completó su validación. Ya podés revisar el perfil.",

              url:
                candidatesUrl,
            })
        } catch (
          pushError
        ) {
          console.error(
            "tenant verification owner candidates push error:",
            pushError
          )
        }

        ownerNotifications.push({
          owner_lead_id:
            ownerLeadId,

          candidates_url:
            candidatesUrl,

          push,
        })
      }
    }

    // =========================================================
    // 10. PUSH AL OWNER
    //
    // SOLO corresponde cuando la documentación se completa
    // dentro de una operación que ya está en /cierre.
    // =========================================================

    let ownerPush:
      unknown =
      null

    if (
      tokenSource ===
        "closing" &&
      closingContractId &&
      verificationId
    ) {
      const closingMatch =
        selectedMatches[0]

      const ownerLeadId =
        clean(
          closingMatch
            ?.owner_lead_id
        )

      if (
        ownerLeadId
      ) {
        const {
          data:
            ownerClosingToken,

          error:
            ownerTokenError,
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
              closingContractId
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
            .maybeSingle()

        if (
          ownerTokenError
        ) {
          console.error(
            "owner closing token lookup error:",
            ownerTokenError
          )
        }

        const ownerTokenUsable =
          ownerClosingToken &&
          (
            !ownerClosingToken
              .expires_at ||
            new Date(
              ownerClosingToken
                .expires_at
            ).getTime() >
              Date.now()
          )

        const ownerClosingUrl =
          ownerTokenUsable &&
          ownerClosingToken
            ?.token
            ? `/cierre/${encodeURIComponent(
                ownerClosingToken
                  .token
              )}`
            : null

        if (
          ownerClosingUrl
        ) {
          try {
            ownerPush =
              await notifyLeadOnce({
                eventKey:
                  `tenant_verification_submitted:owner:${closingContractId}:${verificationId}`,

                eventType:
                  "tenant_verification_submitted",

                leadId:
                  ownerLeadId,

                entityType:
                  "contract",

                entityId:
                  closingContractId,

                title:
                  "Verlo · Documentación disponible",

                body:
                  "El inquilino cargó su documentación. Ya podés revisarla desde el cierre.",

                url:
                  ownerClosingUrl,
              })
          } catch (
            pushError
          ) {
            console.error(
              "tenant verification owner push error:",
              pushError
            )
          }
        }
      }
    }

    // =========================================================
    // 11. RESPONSE
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

      verified:
        true,

      token_source:
        tokenSource,

      owner_notifications:
        ownerNotifications,

      push: {
        owner:
          ownerPush,
      },
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
