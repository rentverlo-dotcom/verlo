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

const DEFAULT_LIMIT =
  25

const MAX_LIMIT =
  200

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

export async function GET() {
  return NextResponse.json({
    ok: true,

    endpoint:
      "pilot-matches",

    mode:
      "audit_only",

    push_enabled:
      false,

    reason:
      "Match notifications are emitted by the canonical match-created event flow.",

    canonical_flow:
      "lead-intake -> push/match-created -> notifyLeadOnce",

    min_score:
      MIN_MATCH_SCORE,

    active_statuses:
      ACTIVE_MATCH_STATUSES,
  })
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
            "Faltan variables de Supabase",
        },
        {
          status: 500,
        }
      )
    }

    const body =
      await req
        .json()
        .catch(
          () => ({})
        )

    if (
      body?.send ===
      true
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "pilot-matches no longer sends Push notifications",

          reason:
            "Use the canonical match-created event flow",

          canonical_endpoint:
            "/api/push/match-created",
        },
        {
          status: 409,
        }
      )
    }

    const requestedLeadIds =
      Array.isArray(
        body?.lead_ids
      )
        ? body.lead_ids
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

    const requestedLimit =
      Number(
        body?.limit ||
          DEFAULT_LIMIT
      )

    const limit =
      Math.min(
        Math.max(
          Number.isFinite(
            requestedLimit
          )
            ? requestedLimit
            : DEFAULT_LIMIT,
          1
        ),
        MAX_LIMIT
      )

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

    const {
      data:
        matchesRaw,

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
          created_at,
          tenant_interest_at,
          tenant_verified_at,
          owner_interest_at,
          ready_to_connect_at
        `)
        .gte(
          "score",
          MIN_MATCH_SCORE
        )
        .in(
          "status",
          ACTIVE_MATCH_STATUSES
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          limit
        )

    if (
      matchesError
    ) {
      throw new Error(
        matchesError.message
      )
    }

    let matches =
      matchesRaw ||
      []

    if (
      requestedLeadIds
        .length >
      0
    ) {
      const wanted =
        new Set(
          requestedLeadIds
        )

      matches =
        matches.filter(
          (
            match
          ) =>
            wanted.has(
              clean(
                match
                  .tenant_lead_id
              )
            ) ||
            wanted.has(
              clean(
                match
                  .owner_lead_id
              )
            )
        )
    }

    return NextResponse.json({
      ok: true,

      mode:
        "audit_only",

      push_enabled:
        false,

      matches_found:
        matches.length,

      matches:
        matches.map(
          (
            match
          ) => ({
            id:
              match.id,

            tenant_lead_id:
              match
                .tenant_lead_id,

            owner_lead_id:
              match
                .owner_lead_id,

            score:
              match.score,

            status:
              match.status,

            created_at:
              match.created_at,

            tenant_interest_at:
              match
                .tenant_interest_at,

            tenant_verified_at:
              match
                .tenant_verified_at,

            owner_interest_at:
              match
                .owner_interest_at,

            ready_to_connect_at:
              match
                .ready_to_connect_at,
          })
        ),
    })
  } catch (
    error
  ) {
    console.error(
      "pilot-matches error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof
          Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    )
  }
}
