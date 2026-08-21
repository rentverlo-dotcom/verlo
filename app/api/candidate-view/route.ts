import {
  NextRequest,
  NextResponse,
} from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function GET(
  req: NextRequest
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
            "Missing configuration",
        },
        {
          status: 500,
        }
      )
    }

    const token =
      clean(
        req.nextUrl
          .searchParams
          .get("token")
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

    const {
      data: accessToken,
      error: tokenError,
    } =
      await supabase
        .from(
          "match_access_tokens"
        )
        .select(`
          match_id,
          lead_id,
          expires_at
        `)
        .eq(
          "token",
          token
        )
        .eq(
          "audience",
          "owner"
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

    const {
      data: match,
      error: matchError,
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
          reasons,
          tenant_interest_at,
          owner_interest_at,
          ready_to_connect_at
        `)
        .eq(
          "id",
          accessToken.match_id
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

    if (
      match.owner_lead_id !==
      accessToken.lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Unauthorized",
        },
        {
          status: 403,
        }
      )
    }

    const {
      data: tenant,
      error: tenantError,
    } =
      await supabase
        .from("lead_intake")
        .select(`
          id,
          full_name,
          budget_max,
          move_timing,
          desired_property_type,
          desired_rooms,
          income_proof_type,
          income_range,
          income_max,
          guarantee_types
        `)
        .eq(
          "id",
          match.tenant_lead_id
        )
        .single()

    if (
      tenantError ||
      !tenant
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Tenant not found",
        },
        {
          status: 404,
        }
      )
    }

    return NextResponse.json({
      ok: true,

      match: {
        id:
          match.id,

        score:
          Number(
            match.score || 0
          ),

        reasons:
          match.reasons || {},

        tenant_interest:
          Boolean(
            match
              .tenant_interest_at
          ),

        owner_interest:
          Boolean(
            match
              .owner_interest_at
          ),

        ready_to_connect:
          Boolean(
            match
              .ready_to_connect_at
          ),
      },

      tenant: {
        first_name:
          clean(
            tenant.full_name
          ).split(/\s+/)[0] ||
          "Persona interesada",

        budget_max:
          tenant.budget_max,

        move_timing:
          tenant.move_timing,

        property_type:
          tenant
            .desired_property_type,

        rooms:
          tenant.desired_rooms,

        income_proof_type:
          tenant
            .income_proof_type,

        income_range:
          tenant.income_range,

        income_max:
          tenant.income_max,

        guarantee_types:
          tenant
            .guarantee_types ||
          [],
      },
    })
  } catch (error) {
    console.error(
      "candidate-view error:",
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
