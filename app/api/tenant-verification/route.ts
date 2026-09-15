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
    // 2. VALIDAR MATCHES
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
          status
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
    // 3. VALIDAR QUE LAS PROPIEDADES TENGAN FOTO
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
    // 4. BUSCAR VERIFICACIÓN REUTILIZABLE
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

    // =========================================================
    // 5. GUARDAR VALIDACIÓN
    // =========================================================

    const verificationPayload = {
      lead_id:
        tenantLeadId,

      match_id:
        null,

      dni_front_path:
        documents
          .dni_front ||
        existingVerification
          ?.dni_front_path ||
        null,

      dni_back_path:
        documents
          .dni_back ||
        existingVerification
          ?.dni_back_path ||
        null,

      selfie_path:
        documents
          .selfie ||
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
    // 6. MARCAR VALIDACIÓN COMPLETA
    //
    // IMPORTANTE:
    // tenant_interest_at NO se toca acá.
    // El interés se registra en /api/match-interest.
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
    // 7. RESPONSE
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
