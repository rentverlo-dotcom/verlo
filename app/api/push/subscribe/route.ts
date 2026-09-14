import {
  NextResponse,
} from 'next/server'

import {
  supabaseAdmin,
} from '@/lib/supabase/admin'

import {
  retryFailedLeadNotifications,
} from '@/lib/lead-notifications'

export const runtime =
  'nodejs'

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
      String(
        body?.lead_id ||
        ''
      ).trim()

    const role =
      String(
        body?.role ||
        ''
      ).trim()

    const subscription =
      body?.subscription

    const endpoint =
      String(
        subscription
          ?.endpoint ||
        ''
      ).trim()

    const p256dh =
      String(
        subscription
          ?.keys
          ?.p256dh ||
        ''
      ).trim()

    const auth =
      String(
        subscription
          ?.keys
          ?.auth ||
        ''
      ).trim()

    if (
      !leadId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing lead_id',
        },
        {
          status: 400,
        }
      )
    }

    if (
      role !==
        'tenant' &&
      role !==
        'owner'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Invalid role',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Invalid push subscription',
        },
        {
          status: 400,
        }
      )
    }

    const {
      data:
        lead,

      error:
        leadError,
    } =
      await supabaseAdmin
        .from(
          'lead_intake'
        )
        .select(
          'id, role'
        )
        .eq(
          'id',
          leadId
        )
        .maybeSingle()

    if (
      leadError
    ) {
      throw leadError
    }

    if (
      !lead
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Lead not found',
        },
        {
          status: 404,
        }
      )
    }

    const leadRole =
      String(
        lead.role ||
        ''
      ).trim()

    const roleAllowed =
      leadRole ===
        role ||
      leadRole ===
        'both'

    if (
      !roleAllowed
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Role does not match lead',
        },
        {
          status: 403,
        }
      )
    }

    const now =
      new Date()
        .toISOString()

    const {
      error:
        subscriptionError,
    } =
      await supabaseAdmin
        .from(
          'push_subscriptions'
        )
        .upsert(
          {
            lead_id:
              leadId,

            role,

            endpoint,

            p256dh,

            auth,

            user_agent:
              request
                .headers
                .get(
                  'user-agent'
                ),

            updated_at:
              now,

            revoked_at:
              null,
          },
          {
            onConflict:
              'endpoint',
          }
        )

    if (
      subscriptionError
    ) {
      throw subscriptionError
    }

    let retryResult:
      unknown = null

    try {
      retryResult =
        await retryFailedLeadNotifications(
          leadId
        )
    } catch (
      retryError
    ) {
      console.error(
        'push failed-event retry error:',
        retryError
      )
    }

    return NextResponse.json({
      ok: true,

      lead_id:
        leadId,

      role,

      registered:
        true,

      retries:
        retryResult,
    })
  } catch (
    error
  ) {
    console.error(
      'push subscribe error:',
      error
    )

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof
          Error
            ? error.message
            : 'Unknown error',
      },
      {
        status: 500,
      }
    )
  }
}
