import { NextResponse } from 'next/server'
import { IdentikApiError, makeIdentikElectronicClient } from '@/lib/identik/electronic-v2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'
const SANDBOX_URL = 'https://sandbox-electronica.identik.me/api/v2'

// Read-only sandbox authentication check. Does not create a document or spend credits.
export async function GET() {
  const isolated = process.env.VERCEL_GIT_COMMIT_REF === 'qa/verlo-e2e' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === QA_URL
  const sandboxOnly = (process.env.IDENTIK_ELECTRONIC_API_BASE_URL || SANDBOX_URL) === SANDBOX_URL

  if (!isolated || !sandboxOnly) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 503 })
  }
  if (!process.env.IDENTIK_ELECTRONIC_API_TOKEN) {
    return NextResponse.json({ ok: false, error: 'SANDBOX_TOKEN_MISSING' }, { status: 503 })
  }

  try {
    // Deliberately nonexistent ID. HTTP 404 demonstrates token acceptance
    // only if Identik authenticates before resolving document IDs.
    await makeIdentikElectronicClient({ baseUrl: SANDBOX_URL }).getDocument(2147483647)
    return NextResponse.json({ ok: false, providerStatus: 200, error: 'UNEXPECTED_DOCUMENT' }, { status: 502 })
  } catch (error) {
    if (error instanceof IdentikApiError) {
      const accepted = error.status === 404
      return NextResponse.json({
        ok: accepted,
        providerStatus: error.status,
        credentialLikelyAccepted: accepted,
      }, {
        status: accepted ? 200 : 502,
        headers: { 'Cache-Control': 'no-store' },
      })
    }
    return NextResponse.json({ ok: false, error: 'CONNECTIVITY_FAILED' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
