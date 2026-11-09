import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyLeadOnce } from '@/lib/lead-notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i

export async function POST(req: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 503 })
  }

  const payload = await req.json().catch(() => null)
  const matchId = String(payload?.match_id || '')
  if (!uuid.test(matchId)) {
    return NextResponse.json({ ok: false, error: 'INVALID_MATCH' }, { status: 400 })
  }

  const db = createClient(QA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: match, error: matchError } = await db.from('lead_matches')
    .select('id,tenant_lead_id,owner_lead_id,status,score')
    .eq('id', matchId).maybeSingle()
  if (matchError || !match || Number(match.score) < 80) {
    return NextResponse.json({ ok: false, error: 'QA_MATCH_NOT_FOUND' }, { status: 404 })
  }
  const { data: leads, error: leadError } = await db.from('lead_intake')
    .select('id,email,role,intent,source')
    .in('id', [match.tenant_lead_id, match.owner_lead_id])
  if (leadError || !leads || leads.length !== 2 ||
      !leads.every(lead => String(lead.source || '').startsWith('qa_e2e_')
        && String(lead.email || '').toLowerCase().endsWith('@example.com'))) {
    return NextResponse.json({ ok: false, error: 'NOT_SYNTHETIC' }, { status: 403 })
  }

  const participants = [
    { role: 'tenant', id: match.tenant_lead_id,
      title: 'VERLO QA - Nueva propiedad compatible',
      message: 'Encontramos una propiedad compatible con tu búsqueda de prueba.' },
    { role: 'owner', id: match.owner_lead_id,
      title: 'VERLO QA - Nuevo candidato compatible',
      message: 'Encontramos un inquilino compatible con tu publicación de prueba.' },
  ] as const

  for (const p of participants) {
    const lead = leads.find(row => row.id === p.id)
    if (!lead || lead.role !== p.role) {
      return NextResponse.json({ ok: false, error: 'ROLE_MISMATCH' }, { status: 409 })
    }
  }

  // Never claim a real delivery: the QA provider guard returns zero Push deliveries
  // and the QA-only outbox captures emails without dispatching them.
  for (const p of participants) {
    await notifyLeadOnce({
      eventKey: `qa_match_created:${p.role}:${matchId}`,
      eventType: 'match_created',
      leadId: p.id,
      entityType: 'match',
      entityId: matchId,
      title: p.title,
      body: p.message,
      url: '/mi-verlo',
      skipWhatsApp: true,
    })
  }

  const keys = participants.map(p => `qa_match_created:${p.role}:${matchId}`)
  const [eventsQuery, outboxQuery] = await Promise.all([
    db.from('lead_notification_events')
      .select('event_key,event_type,lead_id,status,title,url,last_error')
      .in('event_key', keys),
    db.from('verlo_email_outbox')
      .select('event_key,event_type,recipient_role,recipient_email,status,destination_url,notification_title')
      .in('event_key', keys),
  ])
  if (eventsQuery.error || outboxQuery.error) {
    return NextResponse.json({ ok: false, error: 'QA_AUDIT_FAILED' }, { status: 503 })
  }

  const events = eventsQuery.data || []
  const outbox = outboxQuery.data || []
  const recipientResults = participants.map(p => {
    const key = `qa_match_created:${p.role}:${matchId}`
    const event = events.find(x => x.event_key === key)
    const email = outbox.find(x => x.event_key === key)
    return {
      role: p.role,
      eventRecorded: Boolean(event),
      pushStatus: event?.status || null,
      pushDelivered: event?.status === 'sent',
      emailQueued: Boolean(email),
      emailStatus: email?.status || null,
      titleCorrect: event?.title === p.title && email?.notification_title === p.title,
      destinationCorrect: event?.url === '/mi-verlo' && email?.destination_url === '/mi-verlo',
      recipientCorrect: email?.recipient_role === p.role &&
        email.recipient_email === leads.find(l => l.id === p.id)?.email,
    }
  })

  const ok = events.length === 2 && outbox.length === 2 &&
    recipientResults.every(p => p.eventRecorded && p.emailQueued &&
      p.titleCorrect && p.destinationCorrect && p.recipientCorrect &&
      !p.pushDelivered && p.emailStatus === 'pending')

  return NextResponse.json({
    ok,
    qaOnly: true,
    noExternalDelivery: true,
    eventCount: events.length,
    emailCount: outbox.length,
    recipients: recipientResults,
  }, { status: ok ? 200 : 409, headers: { 'Cache-Control': 'no-store' } })
}
