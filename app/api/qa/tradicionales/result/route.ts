import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const expected = 'https://anptswspguyotnasoacq.supabase.co'
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== expected ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 503 })
  }
  const owner = request.nextUrl.searchParams.get('owner') || ''
  const tenant = request.nextUrl.searchParams.get('tenant') || ''
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i
  if (!uuid.test(owner) || !uuid.test(tenant)) {
    return NextResponse.json({ ok: false, error: 'INVALID_IDS' }, { status: 400 })
  }
  const db = createClient(expected, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: leads, error: leadError } = await db.from('lead_intake')
    .select('id,role,intent,source').in('id', [owner, tenant])
  if (leadError || !leads || leads.length !== 2 ||
    !leads.every(x => String(x.source || '').startsWith('qa_e2e_'))) {
    return NextResponse.json({ ok: false, error: 'NOT_QA_TEST_LEADS' }, { status: 404 })
  }
  const ownerOk = leads.some(x => x.id === owner && x.role === 'owner' && x.intent === 'owner_new_listing')
  const tenantOk = leads.some(x => x.id === tenant && x.role === 'tenant' && x.intent === 'tenant_search')
  if (!ownerOk || !tenantOk) {
    return NextResponse.json({ ok: false, error: 'ROLE_MISMATCH' }, { status: 400 })
  }
  const { data: matches, error } = await db.from('lead_matches')
    .select('id,status,score,prequalified,reasons')
    .eq('owner_lead_id', owner).eq('tenant_lead_id', tenant)
  if (error) return NextResponse.json({ ok: false, error: 'MATCH_LOOKUP_FAILED' }, { status: 503 })
  const notificationResult = await db.from('lead_notification_events').select('id', { count: 'exact', head: true }).in('lead_id', [owner, tenant])
  if (notificationResult.error) return NextResponse.json({ ok: false, error: 'NOTIFICATION_AUDIT_FAILED' }, { status: 503 })
  return NextResponse.json({
    ok: true,
    qaLeadsPersisted: true,
    notificationEvents: notificationResult.count ?? 0,
    matches: (matches || []).map(m => ({
      id: m.id, exists: true, status: m.status, score: Number(m.score), prequalified: m.prequalified,
      neighborhoodMatchType: m.reasons?.neighborhood_match_type || null,
      neighborhoodDistanceKm: m.reasons?.neighborhood_distance_km ?? null,
    })),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
