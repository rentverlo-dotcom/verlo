import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const leadId = String(body?.lead_id || '').trim()
    const role = String(body?.role || '').trim()

    const subscription = body?.subscription

    const endpoint = String(
      subscription?.endpoint || ''
    ).trim()

    const p256dh = String(
      subscription?.keys?.p256dh || ''
    ).trim()

    const auth = String(
      subscription?.keys?.auth || ''
    ).trim()

    if (!leadId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing lead_id',
        },
        {
          status: 400,
        }
      )
    }

    if (
      role !== 'tenant' &&
      role !== 'owner'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid role',
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
          error: 'Invalid push subscription',
        },
        {
          status: 400,
        }
      )
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from('push_subscriptions')
        .upsert(
          {
            lead_id: leadId,
            role,
            endpoint,
            p256dh,
            auth,
            user_agent:
              request.headers.get(
                'user-agent'
              ),
            updated_at:
              new Date().toISOString(),
            revoked_at: null,
          },
          {
            onConflict: 'endpoint',
          }
        )

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,
    })
  } catch (error) {
    console.error(
      'push subscribe error',
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
