import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

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

function normalizePhone(value: unknown) {
  return clean(value).replace(/\D/g, "")
}

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    const ownerCandidatesWebhook =
      process.env
        .GHL_OWNER_CANDIDATES_READY_WEBHOOK_URL

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
          error:
            "Missing token",
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
          error:
            "Invalid token",
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
          error:
            "Token revoked",
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
          error:
            "Expired token",
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
    //
    // REGLA:
    //
    // El tenant sólo puede avanzar con un match que:
    //
    // - pertenece a este tenant
    // - score >= 80
    // - está activo
    // - el owner tiene al menos una foto
    //
    // IMPORTANTE:
    //
    // NO exigimos owner_completed_at.
    //
    // Esta es la misma lógica funcional usada para mostrar
    // propiedades en tenant-matches-view.
    //
    // Si Verlo se la mostró como propiedad disponible,
    // Verlo también tiene que dejarlo avanzar.
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
        tenant_verified_at
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
    // 2.B VALIDAR QUE LOS OWNERS TENGAN FOTO
    //
    // tenant-matches-view muestra solamente owners que ya tienen
    // al menos una foto asociada a su lead_id.
    //
    // Validamos la misma condición acá para que ambos endpoints
    // tengan una única lógica coherente.
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
    // 4. MARCAR INTERÉS + VERIFICACIÓN
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
        full_name,
        phone,
        phone_normalized,
        email
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
      }> = []

    // =========================================================
    // 6. PARA CADA OWNER:
    // TOKEN AGREGADO + URL PERMANENTE
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
        `https://verlo.lat/candidatos/${ownerToken}`

      let sent =
        false

      // =======================================================
      // 7. AVISAR AL OWNER MEDIANTE VERLO / GHL
      // =======================================================

      if (
        ownerCandidatesWebhook
      ) {
        try {
          const response =
            await fetch(
              ownerCandidatesWebhook,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    lead_id:
                      owner.id,

                    full_name:
                      owner.full_name,

                    first_name:
                      clean(
                        owner.full_name
                      ).split(
                        /\s+/
                      )[0] ||
                      "",

                    phone:
                      normalizePhone(
                        owner
                          .phone_normalized ||
                          owner.phone
                      ),

                    email:
                      clean(
                        owner.email
                      ).toLowerCase(),

                    role:
                      "owner",

                    verlo_candidates_token:
                      ownerToken,

                    verlo_candidates_url:
                      candidatesUrl,

                    verlo_candidate_count:
                      currentCandidates.length,

                    source:
                      "verlo_candidates_ready",

                    tags: [
                      "verlo_lead",
                      "verlo_owner",
                      "verlo_candidates_ready",
                    ],
                  }),
              }
            )

          sent =
            response.ok

          if (
            !response.ok
          ) {
            console.error(
              "GHL owner candidates notify failed",
              ownerLeadId,
              response.status
            )
          }
        } catch (
          webhookError
        ) {
          console.error(
            "GHL owner candidates webhook error",
            ownerLeadId,
            webhookError
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
      })
    }

    // =========================================================
    // 8. RESPONSE
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
          "Unexpected server error",
      },
      {
        status: 500,
      }
    )
  }
}
