import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validQaWorkflowToken } from '@/lib/qa/verify-workflow-token'
import { makeIdentikElectronicClient } from '@/lib/identik/electronic-v2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'
const SANDBOX = 'https://sandbox-electronica.identik.me/api/v2'
const CONTRACT_ID = 'd27f9d3f-f806-46ef-b6f4-d8a7c08f8106'
const PROVIDER_DOCUMENT_ID = 33

function result(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status, headers: { 'Cache-Control': 'no-store' },
  })
}

// One known synthetic document. The provider API, not user input or a
// webhook, is the authority for finalization. Never creates a document,
// resends invitations or reads any production database.
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      (process.env.IDENTIK_ELECTRONIC_API_BASE_URL || SANDBOX) !== SANDBOX)
    return result({ ok: false, error: 'QA_ONLY' }, 503)

  const auth = request.headers.get('authorization') ?? ''
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? ''
  if (!sha || !auth.startsWith('Bearer ') ||
      !(await validQaWorkflowToken(auth.slice(7), sha)))
    return result({ ok: false, error: 'QA_OIDC_REQUIRED' }, 403)

  if (request.headers.get('x-qa-intent') !== 'reconcile-signed-document-33')
    return result({ ok: false, error: 'EXPLICIT_INTENT_REQUIRED' }, 400)

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key || !process.env.IDENTIK_ELECTRONIC_API_TOKEN)
    return result({ ok: false, error: 'QA_CONFIG_MISSING' }, 503)

  const db = createClient(QA_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: local, error: lookupError } = await db
    .from('identik_electronic_documents')
    .select('id,lead_contract_id,identik_document_id,status,completed_at')
    .eq('lead_contract_id', CONTRACT_ID)
    .eq('identik_document_id', PROVIDER_DOCUMENT_ID)
    .maybeSingle()
  if (lookupError || !local)
    return result({ ok: false, error: 'QA_DOCUMENT_NOT_FOUND' }, 409)
  if (!['created', 'sent', 'pending', 'completed'].includes(local.status))
    return result({ ok: false, error: 'QA_TERMINAL_STATUS' }, 409)

  let providerStatus: string
  try {
    const provider = await makeIdentikElectronicClient({ baseUrl: SANDBOX })
      .getDocument(PROVIDER_DOCUMENT_ID)
    if (provider.id !== undefined && Number(provider.id) !== PROVIDER_DOCUMENT_ID)
      return result({ ok: false, error: 'PROVIDER_ID_MISMATCH' }, 502)
    providerStatus = String(provider.status ?? '').toUpperCase()
  } catch {
    return result({ ok: false, error: 'PROVIDER_STATUS_UNAVAILABLE' }, 502)
  }

  if (providerStatus !== 'COMPLETED') {
    return result({
      ok: false, qaOnly: true, providerVerified: true,
      providerStatus, error: 'PROVIDER_NOT_COMPLETED',
    }, 409)
  }
  if (local.status === 'completed')
    return result({
      ok: true, qaOnly: true, providerVerified: true,
      providerStatus, localCompleted: true, alreadyReconciled: true,
      providerWebhookReceived: false,
    })

  const now = new Date().toISOString()
  const { data: updated, error: updateError } = await db
    .from('identik_electronic_documents')
    .update({ status: 'completed', completed_at: now,
      last_checked_at: now, updated_at: now })
    .eq('id', local.id)
    .in('status', ['created', 'sent', 'pending'])
    .select('id,status')
    .maybeSingle()
  if (updateError)
    return result({ ok: false, error: 'QA_RECONCILIATION_FAILED' }, 503)
  if (!updated) {
    const { data: raced } = await db
      .from('identik_electronic_documents')
      .select('status').eq('id', local.id).maybeSingle()
    if (raced?.status !== 'completed')
      return result({ ok: false, error: 'QA_CONCURRENT_STATUS_CHANGE' }, 409)
  }
  return result({
    ok: true, qaOnly: true, providerVerified: true,
    providerStatus, localCompleted: true,
    providerWebhookReceived: false,
    reconciliation: 'authenticated-provider-poll',
    noDuplicateDocuments: true,
  })
}
