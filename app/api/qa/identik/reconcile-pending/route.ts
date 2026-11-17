import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validQaWorkflowToken } from '@/lib/qa/verify-workflow-token'
import { reconcilePendingIdentikDocuments } from '@/lib/identik/reconcile-pending'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'
const SANDBOX = 'https://sandbox-electronica.identik.me/api/v2'

// No document ID, emails, or signing URLs are accepted or returned.
// Only an authorized GitHub QA run may inspect/advance a bounded batch.
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      (process.env.IDENTIK_ELECTRONIC_API_BASE_URL || SANDBOX) !== SANDBOX) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 503 })
  }
  const token = request.headers.get('authorization') || ''
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || ''
  if (!sha || !token.startsWith('Bearer ') ||
      !(await validQaWorkflowToken(token.slice(7), sha))) {
    return NextResponse.json({ ok: false, error: 'QA_OIDC_REQUIRED' }, { status: 403 })
  }
  if (request.headers.get('x-qa-intent') !== 'reconcile-pending-documents') {
    return NextResponse.json({ ok: false, error: 'EXPLICIT_INTENT_REQUIRED' }, { status: 400 })
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key || !process.env.IDENTIK_ELECTRONIC_API_TOKEN) {
    return NextResponse.json({ ok: false, error: 'QA_CONFIGURATION_MISSING' }, { status: 503 })
  }
  const db = createClient(QA_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  try {
    const result = await reconcilePendingIdentikDocuments(db, { baseUrl: SANDBOX })
    return NextResponse.json({ ok: result.failed === 0, qaOnly: true,
      providerReadsOnly: true, noExternalDelivery: true, ...result }, {
      status: result.failed ? 503 : 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'QA_RECONCILIATION_FAILED' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
