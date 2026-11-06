import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'
const SANDBOX_URL = 'https://sandbox-electronica.identik.me/api/v2'

export async function GET() {
  const isolated =
    process.env.VERCEL_GIT_COMMIT_REF === 'qa/verlo-e2e' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === QA_URL

  if (!isolated) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 503 })
  }

  const apiUrl = process.env.IDENTIK_ELECTRONIC_API_BASE_URL || SANDBOX_URL
  const sandboxOnly = apiUrl === SANDBOX_URL
  const tokenConfigured = Boolean(process.env.IDENTIK_ELECTRONIC_API_TOKEN)
  const webhookSecretConfigured = Boolean(process.env.IDENTIK_ELECTRONIC_WEBHOOK_SECRET)

  // Read-only. Do not expose credentials or call Identik until sandbox-only
  // credentials and a protected E2E workflow have been verified.
  return NextResponse.json({
    ok: true,
    isolated,
    sandboxOnly,
    apiTokenConfigured: tokenConfigured,
    webhookSecretConfigured,
    readyForSandboxE2E: sandboxOnly && tokenConfigured && webhookSecretConfigured,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
