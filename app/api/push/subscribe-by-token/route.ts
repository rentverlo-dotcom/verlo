import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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
      const { data, error } =
        await supabaseAdmin
          .from('owner_property_access_tokens')
          .select(
            'owner_lead_id, expires_at, revoked_at'
          )
          .eq('token', token)
          .single()

      if (error || !data) {
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

    const { error } =
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

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,
      lead_id: leadId,
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
