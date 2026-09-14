import {
  NextResponse,
} from "next/server"

import {
  supabaseAdmin,
} from "@/lib/supabase/admin"

export const runtime =
  "nodejs"

export const dynamic =
  "force-dynamic"

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request
        .json()
        .catch(
          () => ({})
        )

    const leadId =
      clean(
        body?.lead_id
      )

    const endpoint =
      clean(
        body?.endpoint
      )

    if (
      !leadId ||
      !endpoint
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing lead_id or endpoint",
        },
        {
          status: 400,
        }
      )
    }

    const {
      data:
        subscription,
      error,
    } =
      await supabaseAdmin
        .from(
          "push_subscriptions"
        )
        .select(`
          id,
          lead_id,
          role,
          revoked_at
        `)
        .eq(
          "endpoint",
          endpoint
        )
        .maybeSingle()

    if (
      error
    ) {
      throw error
    }

    if (
      !subscription
    ) {
      return NextResponse.json({
        ok: true,

        registered:
          false,

        active:
          false,

        same_lead:
          false,
      })
    }

    const sameLead =
      subscription.lead_id ===
      leadId

    const active =
      sameLead &&
      !subscription.revoked_at

    return NextResponse.json({
      ok: true,

      registered:
        true,

      active,

      same_lead:
        sameLead,

      revoked:
        Boolean(
          subscription.revoked_at
        ),
    })
  } catch (
    error
  ) {
    console.error(
      "push status error:",
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
