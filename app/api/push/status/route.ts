import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(
  request: Request
) {
  try {
    const body =
      await request
        .json()
        .catch(() => ({}))

    const leadId =
      String(
        body?.lead_id || ''
      ).trim()

    const endpoint =
      String(
        body?.endpoint || ''
      ).trim()

    if (
      !leadId ||
      !endpoint
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing lead_id or endpoint',
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
          'push_subscriptions'
        )
        .select(
          'id, lead_id, role, endpoint, revoked_at, updated_at'
        )
        .eq(
          'endpoint',
          endpoint
        )
        .maybeSingle()

    if (error) {
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
      revoked_at:
        subscription.revoked_at,
    })
  } catch (error) {
    console.error(
      'push status error',
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      {
        status: 500,
      }
    )
  }
}
