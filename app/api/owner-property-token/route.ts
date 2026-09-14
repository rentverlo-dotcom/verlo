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
]

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
      ownerLead.intent !==
        "owner_new_listing" &&
      ownerLead.role !==
        "owner"
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
    // 2. DEBE TENER MATCH ACTIVO
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
        .select(
          "id"
        )
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
          80
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
            "Owner property has no active matches",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 3. REUTILIZAR / CREAR COMPLETION
    // =========================================================

    let completionId:
      string | null =
      null

    const {
      data:
        existingCompletion,
      error:
        completionLookupError,
    } =
      await supabase
        .from(
          "owner_property_completions"
        )
        .select(
          "id"
        )
        .eq(
          "lead_id",
          ownerLeadId
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
      completionLookupError
    ) {
      throw new Error(
        completionLookupError
          .message
      )
    }

    if (
      existingCompletion
    ) {
      completionId =
        existingCompletion.id
    } else {
      const {
        data:
          newCompletion,
        error:
          completionInsertError,
      } =
        await supabase
          .from(
            "owner_property_completions"
          )
          .insert({
            lead_id:
              ownerLeadId,

            match_id:
              null,

            status:
              "draft",
          })
          .select(
            "id"
          )
          .single()

      if (
        completionInsertError ||
        !newCompletion
      ) {
        /*
         * Puede haber entrado otro request
         * casi al mismo tiempo.
         * Reconsultamos antes de fallar.
         */

        const {
          data:
            racedCompletion,
          error:
            racedCompletionError,
        } =
          await supabase
            .from(
              "owner_property_completions"
            )
            .select(
              "id"
            )
            .eq(
              "lead_id",
              ownerLeadId
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
          racedCompletionError ||
          !racedCompletion
        ) {
          throw new Error(
            completionInsertError
              ?.message ||
              "Could not create property completion"
          )
        }

        completionId =
          racedCompletion.id
      } else {
        completionId =
          newCompletion.id
      }
    }

    if (
      !completionId
    ) {
      throw new Error(
        "Missing completion id"
      )
    }

    // =========================================================
    // 4. REUTILIZAR TOKEN ACTIVO
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
          "owner_property_access_tokens"
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
        .eq(
          "completion_id",
          completionId
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
        tokenLookupError
          .message
      )
    }

    if (
      existingToken
    ) {
      return NextResponse.json({
        ok: true,

        owner_lead_id:
          ownerLeadId,

        completion_id:
          completionId,

        token:
          existingToken.token,

        property_url:
          `/propiedad/${existingToken.token}`,

        match_count:
          matches.length,

        reused:
          true,
      })
    }

    // =========================================================
    // 5. CREAR TOKEN
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
        tokenInsertError,
    } =
      await supabase
        .from(
          "owner_property_access_tokens"
        )
        .insert({
          owner_lead_id:
            ownerLeadId,

          completion_id:
            completionId,

          token,

          expires_at:
            expiresAt,
        })

    if (
      tokenInsertError
    ) {
      /*
       * Si otro request creó el token
       * entre el SELECT y este INSERT,
       * reconsultamos y reutilizamos.
       */

      const {
        data:
          racedToken,
        error:
          racedTokenError,
      } =
        await supabase
          .from(
            "owner_property_access_tokens"
          )
          .select(`
            token,
            expires_at
          `)
          .eq(
            "owner_lead_id",
            ownerLeadId
          )
          .eq(
            "completion_id",
            completionId
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
          tokenInsertError
            .message
        )
      }

      return NextResponse.json({
        ok: true,

        owner_lead_id:
          ownerLeadId,

        completion_id:
          completionId,

        token:
          racedToken.token,

        property_url:
          `/propiedad/${racedToken.token}`,

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

      completion_id:
        completionId,

      token,

      property_url:
        `/propiedad/${token}`,

      match_count:
        matches.length,

      reused:
        false,
    })
  } catch (
    error
  ) {
    console.error(
      "owner-property-token error:",
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
