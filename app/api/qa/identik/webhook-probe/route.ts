import { NextRequest, NextResponse } from 'next/server'
import { validQaWorkflowToken } from '@/lib/qa/verify-workflow-token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QA_DB = 'https://anptswspguyotnasoacq.supabase.co'
const SANDBOX = 'https://sandbox-electronica.identik.me/api/v2'
const QA_BASE = 'https://verlopunto0-git-qa-verlo-e2e-verlos-projects-b9e9c595.vercel.app'

// This makes a real, outbound HTTP POST through Vercel's public QA alias.
// The document ID is deliberately unknown to VERLO. Nothing is signed or sent.
// OIDC signed GitHub Actions identity is mandatory; never return a secret.
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_DB ||
      (process.env.IDENTIK_ELECTRONIC_API_BASE_URL || SANDBOX) !== SANDBOX) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 503 })
  }
  const secret = process.env.IDENTIK_ELECTRONIC_WEBHOOK_SECRET
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || ''
  const authorization = request.headers.get('authorization') || ''
  if (!secret || !sha || !authorization.startsWith('Bearer ') ||
      !(await validQaWorkflowToken(authorization.slice(7), sha))) {
    return NextResponse.json({ ok: false, error: 'QA_AUTH_REQUIRED' }, { status: 403 })
  }

  // Unknown document: webhook must authenticate, reach the handler and
  // explicitly ignore it. A 401/403/503 is an actionable failure.
  let response: Response
  try {
    response = await fetch(QA_BASE + '/api/webhooks/identik-electronic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-identik-secret': secret,
      },
      body: JSON.stringify({
        type: 'document.created',
        documentId: 2147483647,
        qaProbe: true,
      }),
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'QA_WEBHOOK_UNREACHABLE' }, { status: 502 })
  }
  let result: { ok?: boolean; ignored?: boolean } | null = null
  try { result = await response.json() } catch { /* auth page or HTML */ }
  const accepted = response.status === 200 &&
    result?.ok === true && result?.ignored === true
  return NextResponse.json({
    ok: accepted,
    qaOnly: true,
    externalNetworkRoundTrip: true,
    webhookStatus: response.status,
    unknownDocumentIgnored: result?.ignored === true,
    noProviderDocumentsCreated: true,
  }, {
    status: accepted ? 200 : 502,
    headers: { 'Cache-Control': 'no-store' },
  })
}
