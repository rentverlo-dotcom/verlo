import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function POST(
  request: Request
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    const readyWebhook =
      process.env
        .GHL_READY_TO_CONNECT_WEBHOOK_URL

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

    const {
      data: accessToken,
      error: tokenError,
    } =
      await supabase
        .from(
          "match_access_tokens"
        )
        .select(`
          id,
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

    const now =
      new Date()
        .toISOString()

    const ownerInterestAt =
      match.owner_interest_at ||
      now

    const ready =
      Boolean(
        match.tenant_interest_at &&
        ownerInterestAt
      )

    const update:
      Record<string, unknown> = {
        owner_interest_at:
          ownerInterestAt,
      }

    if (
      ready &&
      !match.ready_to_connect_at
    ) {
      update.ready_to_connect_at =
        now
    }

    const {
      error: updateError,
    } =
      await supabase
        .from(
          "lead_matches"
        )
        .update(update)
        .eq(
          "id",
          match.id
        )

    if (updateError) {
      throw new Error(
        updateError.message
      )
    }

    if (
      ready &&
      readyWebhook &&
      !match.ready_to_connect_at
    ) {
      await fetch(
        readyWebhook,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              match_id:
                match.id,

              tenant_lead_id:
                match.tenant_lead_id,

              owner_lead_id:
                match.owner_lead_id,

              event:
                "ready_to_connect",

              source:
                "verlo_double_opt_in",
            }),
        }
      )
    }

    return NextResponse.json({
      ok: true,

      owner_interest:
        true,

      tenant_interest:
        Boolean(
          match.tenant_interest_at
        ),

      ready_to_connect:
        ready,
    })
  } catch (error) {
    console.error(
      "owner-interest error:",
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
