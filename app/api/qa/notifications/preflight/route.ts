import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'

// Read-only verification of notification pipeline in isolated QA.
// Counters only: do not expose email addresses, tokens, or internal event IDs.
export async function GET() {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 503 })
  }
  const db = createClient(QA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const [events, emails, deliveredEvents, dispatchedEmails] = await Promise.all([
    db.from('lead_notification_events').select('id', { count: 'exact', head: true })
      .like('event_key', 'qa_match_created:%'),
    db.from('verlo_email_outbox').select('id', { count: 'exact', head: true })
      .like('event_key', 'qa_match_created:%'),
    db.from('lead_notification_events').select('id', { count: 'exact', head: true })
      .like('event_key', 'qa_match_created:%').eq('status', 'sent'),
    db.from('verlo_email_outbox').select('id', { count: 'exact', head: true })
      .like('event_key', 'qa_match_created:%').neq('status', 'pending'),
  ])
  if ([events, emails, deliveredEvents, dispatchedEmails].some(r => r.error)) {
    return NextResponse.json({ ok: false, error: 'QA_NOTIFICATION_AUDIT_FAILED' }, { status: 503 })
  }
  const recorded = events.count || 0
  const queued = emails.count || 0
  const pushed = deliveredEvents.count || 0
  const changed = dispatchedEmails.count || 0
  const ok = recorded > 0 && recorded === queued && pushed === 0 && changed === 0
  return NextResponse.json({
    ok, qaOnly: true, noExternalDelivery: pushed === 0 && changed === 0,
    matchedNotificationEvents: recorded,
    matchedEmailIntents: queued,
    sentPushEvents: pushed,
    nonPendingEmailIntents: changed,
  }, { status: ok ? 200 : 409, headers: { 'Cache-Control': 'no-store' } })
}
