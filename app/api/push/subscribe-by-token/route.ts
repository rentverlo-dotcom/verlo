import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  notifyLeadOnce,
  retryFailedLeadNotifications,
} from '@/lib/lead-notifications'

export const runtime = 'nodejs'

function clean(value: unknown) {
  return String(value || '').trim()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const token = clean(body?.token)
    const role = clean(body?.role)
    const subscription = body?.subscription

    const endpoint = clean(subscription?.endpoint)
    const p256dh = clean(subscription?.keys?.p256dh)
    const auth = clean(subscription?.keys?.auth)

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Missing token' },
        { status: 400 }
      )
    }

    if (role !== 'owner' && role !== 'tenant') {
      return NextResponse.json(
        { ok: false, error: 'Invalid role' },
        { status: 400 }
      )
    }

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { ok: false, error: 'Invalid push subscription' },
        { status: 400 }
      )
    }

    let leadId: string | null = null
    let expiresAt: string | null = null
    let revokedAt: string | null = null

    if (role === 'owner') {
      const candidateToken =
        await supabaseAdmin
          .from('owner_candidates_access_tokens')
          .select(
            'owner_lead_id, expires_at, revoked_at'
          )
          .eq('token', token)
          .maybeSingle()

      const propertyToken =
        candidateToken.data
          ? null
          : await supabaseAdmin
              .from('owner_property_access_tokens')
              .select(
                'owner_lead_id, expires_at, revoked_at'
              )
              .eq('token', token)
              .maybeSingle()

      const data =
        candidateToken.data ||
        propertyToken?.data ||
        null

      const lookupError =
        candidateToken.error ||
        propertyToken?.error ||
        null

      if (lookupError || !data) {
        return NextResponse.json(
          { ok: false, error: 'Invalid owner token' },
          { status: 404 }
        )
      }

      leadId = data.owner_lead_id
      expiresAt = data.expires_at
      revokedAt = data.revoked_at
    }

    if (role === 'tenant') {
      const { data, error } =
        await supabaseAdmin
          .from('tenant_matches_access_tokens')
          .select(
            'tenant_lead_id, expires_at, revoked_at'
          )
          .eq('token', token)
          .single()

      if (error || !data) {
        return NextResponse.json(
          { ok: false, error: 'Invalid tenant token' },
          { status: 404 }
        )
      }

      leadId = data.tenant_lead_id
      expiresAt = data.expires_at
      revokedAt = data.revoked_at
    }

    if (!leadId) {
      return NextResponse.json(
        { ok: false, error: 'Lead not found' },
        { status: 404 }
      )
    }

    if (revokedAt) {
      return NextResponse.json(
        { ok: false, error: 'Token revoked' },
        { status: 403 }
      )
    }

    if (
      expiresAt &&
      new Date(expiresAt).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { ok: false, error: 'Token expired' },
        { status: 403 }
      )
    }

    const {
      data: savedSubscription,
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
              request.headers.get('user-agent'),
            updated_at:
              new Date().toISOString(),
            revoked_at: null,
          },
          {
            onConflict: 'endpoint',
          }
        )
        .select('id')
        .single()

    if (
      error ||
      !savedSubscription
    ) {
      throw (
        error ||
        new Error(
          'Could not save push subscription'
        )
      )
    }

    let welcomeResult: unknown = null

    try {
      welcomeResult =
        await notifyLeadOnce({
          eventKey:
            `push_welcome:${role}:${savedSubscription.id}`,
          eventType:
            'push_welcome',
          leadId,
          entityType:
            'push_subscription',
          entityId:
            savedSubscription.id,
          title:
            'Verlo · Notificaciones activadas',
          body:
            'Listo. Te vamos a avisar por acá cuando haya novedades importantes.',
          url:
            '/mi-verlo',
          skipWhatsApp:
            true,
        })
    } catch (welcomeError) {
      console.error(
        'push welcome by token error',
        welcomeError
      )
    }

    let retryResult: unknown = null

    try {
      retryResult =
        await retryFailedLeadNotifications(
          leadId
        )
    } catch (retryError) {
      console.error(
        'push failed-event retry by token error',
        retryError
      )
    }

    return NextResponse.json({
      ok: true,
      lead_id: leadId,
      welcome: welcomeResult,
      retries: retryResult,
    })
  } catch (error) {
    console.error(
      'push subscribe by token error',
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
      { status: 500 }
    )
  }
}
