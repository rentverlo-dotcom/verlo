import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'

export async function GET() {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 503 })
  }

  const db = createClient(QA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: matches, error: matchError } = await db.from('lead_matches')
    .select('owner_lead_id,tenant_lead_id').limit(150)
  if (matchError || !matches) {
    return NextResponse.json({ ok: false, error: 'QA_MATCHES_UNAVAILABLE' }, { status: 503 })
  }

  const leadIds = Array.from(new Set(matches.flatMap(m =>
    [m.owner_lead_id, m.tenant_lead_id])))
  if (!leadIds.length) {
    return NextResponse.json({ ok: false, error: 'QA_NO_MATCH_FIXTURES' }, { status: 503 })
  }

  const { data: leads, error: leadsError } = await db.from('lead_intake')
    .select('id,email,role,intent,source').in('id', leadIds)
  if (leadsError || !leads) {
    return NextResponse.json({ ok: false, error: 'QA_LEADS_UNAVAILABLE' }, { status: 503 })
  }

  const byId = new Map(leads.map(lead => [lead.id, lead]))
  const eligible = (id: string, role: 'owner' | 'tenant') => {
    const lead = byId.get(id)
    return Boolean(lead && lead.role === role &&
      lead.intent === (role === 'owner' ? 'owner_new_listing' : 'tenant_search') &&
      String(lead.source || '').startsWith('qa_e2e_') &&
      String(lead.email || '').toLowerCase().endsWith('@example.com'))
  }
  const hasPair = matches.some(m => eligible(m.owner_lead_id, 'owner') &&
    eligible(m.tenant_lead_id, 'tenant') &&
    byId.get(m.owner_lead_id)?.email?.toLowerCase() !==
      byId.get(m.tenant_lead_id)?.email?.toLowerCase())

  return NextResponse.json({
    ok: hasPair, isolated: true, matchingFixturesAvailable: hasPair,
    realAuthRunStatus: 'NOT_EXECUTED_BY_PREFLIGHT',
  }, {
    status: hasPair ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
