import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { POST as tenantInterest } from '@/app/api/match-interest/route'
import { POST as ownerInterest } from '@/app/api/owner-interest/route'
import { POST as postVisitDecision } from '@/app/api/post-visit-decision/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'
const FAKE_MATCH = '00000000-0000-4000-8000-000000000001'

async function denial(handler: (req: NextRequest) => Promise<Response>, body: Record<string, string>) {
  const response = await handler(new NextRequest('https://qa.verlo.invalid/api/security-probe', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }))
  const payload = await response.json().catch(() => ({}))
  return {
    status: response.status,
    safe: response.status === 404 && payload?.error === 'Invalid token',
  }
}

// Calls actual API handlers using a non-existent token and never changes
// states, creates contracts or dispatches notifications.
export async function GET() {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 503 })
  }

  const db = createClient(QA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const [matches, contracts, tenant, owner, decision] = await Promise.all([
    db.from('lead_matches').select('id', { count: 'exact', head: true }).gte('score', 80),
    db.from('lead_contracts').select('id', { count: 'exact', head: true }),
    denial(tenantInterest, {token: 'invalid-qa-tenant-token', match_id: FAKE_MATCH}),
    denial(ownerInterest, {token: 'invalid-qa-owner-token', match_id: FAKE_MATCH}),
    denial(postVisitDecision, {token: 'invalid-qa-contract-token', decision: 'yes'}),
  ])
  const ok = !matches.error && !contracts.error &&
    tenant.safe && owner.safe && decision.safe &&
    (matches.count || 0) > 0

  return NextResponse.json({
    ok, qaOnly: true, readOnly: true, noProviderCalls: true,
    compatibleMatches: matches.count || 0,
    contractRecords: contracts.count || 0,
    invalidTenantTokenRejected: tenant.safe,
    invalidOwnerTokenRejected: owner.safe,
    invalidContractTokenRejected: decision.safe,
  }, { status: ok ? 200 : 409, headers: { 'Cache-Control': 'no-store' } })
}
