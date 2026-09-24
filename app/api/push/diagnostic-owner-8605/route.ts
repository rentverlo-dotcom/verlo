import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendPushToLead } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Temporary, one-time production diagnostic. Delete this route after the test.
const OWNER_LEAD_ID = '950e4228-e50f-4c29-85c0-615032044525'
const EVENT_KEY = 'push_diagnostic:owner:950e4228-e50f-4c29-85c0-615032044525'

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    const { data: owner, error: ownerError } = await supabaseAdmin
      .from('lead_intake')
      .select('id, role')
      .eq('id', OWNER_LEAD_ID)
      .maybeSingle()
    if (ownerError) throw ownerError
    if (!owner || owner.role !== 'owner') {
      return NextResponse.json({ ok: false, error: 'Owner not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const { data: existing, error: tokenError } = await supabaseAdmin
      .from('owner_candidates_access_tokens')
      .select('token')
      .eq('owner_lead_id', OWNER_LEAD_ID)
      .is('revoked_at', null)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (tokenError) throw tokenError

    let token = existing?.token
    if (!token) {
      token = randomBytes(32).toString('hex')
      const { error } = await supabaseAdmin
        .from('owner_candidates_access_tokens')
        .insert({
          owner_lead_id: OWNER_LEAD_ID,
          token,
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        })
      if (error) throw error
    }

    const url = `/candidatos/${token}`
    const title = 'Verlo · Prueba de acceso'
    const body = 'Tocá este aviso para abrir tus candidatos en Verlo.'
    // The unique event key prevents accidental repeats of this diagnostic.
    const { data: event, error: eventError } = await supabaseAdmin
      .from('lead_notification_events')
      .insert({
        event_key: EVENT_KEY,
        event_type: 'push_diagnostic',
        lead_id: OWNER_LEAD_ID,
        entity_type: 'lead',
        entity_id: OWNER_LEAD_ID,
        title,
        body,
        url,
        status: 'pending',
        updated_at: now,
      })
      .select('id')
      .single()
    if (eventError?.code === '23505') {
      return NextResponse.json({ ok: false, error: 'Test already requested' }, { status: 409 })
    }
    if (eventError || !event) throw eventError || new Error('Could not record test')

    let sent = 0
    let failed = 0
    let errorMessage: string | null = null
    try {
      const delivery = await sendPushToLead(OWNER_LEAD_ID, { title, body, url })
      sent = delivery.sent
      failed = delivery.failed
      if (!sent) errorMessage = failed ? 'Delivery failed' : 'No active subscriptions'
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Delivery failed'
    }

    const { error: updateError } = await supabaseAdmin
      .from('lead_notification_events')
      .update({
        status: sent ? 'sent' : 'failed',
        sent_at: sent ? new Date().toISOString() : null,
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', event.id)
    if (updateError) throw updateError

    return NextResponse.json({
      ok: sent > 0,
      event_id: event.id,
      devices_sent: sent,
      devices_failed: failed,
      error: errorMessage,
    }, { status: sent ? 200 : 503 })
  } catch (error) {
    console.error('Protected owner push diagnostic failed', error)
    return NextResponse.json({ ok: false, error: 'Diagnostic failed' }, { status: 500 })
  }
}
