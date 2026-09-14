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
  req: NextRequest
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
      await req
        .json()
        .catch(
          () => ({})
        )

    const ownerLeadId =
      clean(
        body?.owner_lead_id
      )

    if (
      !ownerLeadId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing owner_lead_id",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. VALIDAR OWNER
    // =========================================================

    const {
      data:
        ownerLead,
      error:
        ownerError,
    } =
      await supabase
        .from(
          "lead_intake"
        )
        .select(`
          id,
          role,
          intent
        `)
        .eq(
          "id",
          ownerLeadId
        )
        .single()

    if (
      ownerError ||
      !ownerLead
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Owner lead not found",
        },
        {
          status: 404,
        }
      )
    }

    if (
      ownerLead.role !==
        "owner" &&
      ownerLead.intent !==
        "owner_new_listing"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Lead is not an owner property",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 2. MATCHES ACTIVOS DEL OWNER
    //
    // El dashboard /candidatos existe desde el primer match.
    // Ver candidatos NO equivale a aceptar candidatos.
    // =========================================================

    const {
      data:
        matches,
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
          score,
          status,
          tenant_interest_at,
          tenant_verified_at,
          owner_interest_at,
          ready_to_connect_at
        `)
        .eq(
          "owner_lead_id",
          ownerLeadId
        )
        .in(
          "status",
          ACTIVE_MATCH_STATUSES
        )
        .gte(
          "score",
          MIN_MATCH_SCORE
        )
        .order(
          "score",
          {
            ascending:
              false,
          }
        )

    if (
      matchesError
    ) {
      throw new Error(
        matchesError.message
      )
    }

    if (
      !matches ||
      matches.length ===
        0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Property has no active matches",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 3. REUTILIZAR TOKEN ACTIVO
    // =========================================================

    const nowIso =
      new Date()
        .toISOString()

    const {
      data:
        existingToken,
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
          `expires_at.is.null,expires_at.gt.${nowIso}`
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
      tokenLookupError
    ) {
      throw new Error(
        tokenLookupError.message
      )
    }

    if (
      existingToken
    ) {
      return NextResponse.json({
        ok: true,

        owner_lead_id:
          ownerLeadId,

        token:
          existingToken.token,

        candidates_url:
          `/candidatos/${existingToken.token}`,

        match_count:
          matches.length,

        reused:
          true,
      })
    }

    // =========================================================
    // 4. CREAR TOKEN
    // =========================================================

    const token =
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
        insertError,
    } =
      await supabase
        .from(
          "owner_candidates_access_tokens"
        )
        .insert({
          owner_lead_id:
            ownerLeadId,

          token,

          expires_at:
            expiresAt,
        })

    // =========================================================
    // 5. SI HUBO CARRERA, RECONSULTAR
    // =========================================================

    if (
      insertError
    ) {
      const {
        data:
          racedToken,
        error:
          racedTokenError,
      } =
        await supabase
          .from(
            "owner_candidates_access_tokens"
          )
          .select(`
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
            `expires_at.is.null,expires_at.gt.${nowIso}`
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
        racedTokenError ||
        !racedToken
      ) {
        throw new Error(
          insertError.message
        )
      }

      return NextResponse.json({
        ok: true,

        owner_lead_id:
          ownerLeadId,

        token:
          racedToken.token,

        candidates_url:
          `/candidatos/${racedToken.token}`,

        match_count:
          matches.length,

        reused:
          true,
      })
    }

    // =========================================================
    // 6. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      owner_lead_id:
        ownerLeadId,

      token,

      candidates_url:
        `/candidatos/${token}`,

      match_count:
        matches.length,

      reused:
        false,
    })
  } catch (
    error
  ) {
    console.error(
      "owner-candidates-token error:",
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
