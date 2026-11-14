import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validQaWorkflowToken } from '@/lib/qa/verify-workflow-token'
import { checkTraditionalSigningReadiness } from '@/lib/identik/traditional-signing-preflight'
import { createCaucionContractPdf } from '@/lib/powermarket/contract-pdf'
import { makeIdentikElectronicClient } from '@/lib/identik/electronic-v2'
import { identikSignatureField } from '@/lib/identik/signature-geometry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'
const SANDBOX = 'https://sandbox-electronica.identik.me/api/v2'
// An already fully agreed QA E2E contract, never a real customer's document.
const CONTRACT_ID = 'd27f9d3f-f806-46ef-b6f4-d8a7c08f8106'
const OWNER_EMAIL = 'juanoddone29@gmail.com'
const TENANT_EMAIL = 'juanmanueloddone74@gmail.com'
const EXTERNAL_ID = 'verlo-qa-identik-e2e-geometry-v2-' + CONTRACT_ID

function reply(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status, headers: { 'Cache-Control': 'no-store' },
  })
}

// This preflight is read-only: no document creation, no notifications,
// no mutation of QA Supabase. GitHub OIDC binds access to the exact QA SHA.
export async function GET(request: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      (process.env.IDENTIK_ELECTRONIC_API_BASE_URL || SANDBOX) !== SANDBOX)
    return reply({ ok: false, error: 'QA_ONLY' }, 503)

  const bearer = request.headers.get('authorization') || ''
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || ''
  if (!sha || !bearer.startsWith('Bearer ') ||
      !(await validQaWorkflowToken(bearer.slice(7), sha)))
    return reply({ ok: false, error: 'QA_OIDC_REQUIRED' }, 403)

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key || !process.env.IDENTIK_ELECTRONIC_API_TOKEN ||
      !process.env.IDENTIK_ELECTRONIC_WEBHOOK_SECRET)
    return reply({ ok: false, error: 'QA_CONFIGURATION_MISSING' }, 503)

  const db = createClient(QA_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: contract, error } = await db.from('lead_contracts')
    .select('id,status,content,tenant_agreed_at,owner_agreed_at,tenant_lead_id,owner_lead_id')
    .eq('id', CONTRACT_ID).maybeSingle()
  if (error || !contract || contract.status !== 'agreed' || !contract.content ||
      !contract.tenant_agreed_at || !contract.owner_agreed_at)
    return reply({ ok: false, error: 'QA_AGREED_CONTRACT_MISSING' }, 409)

  const { data: participants, error: participantError } = await db
    .from('lead_intake').select('id,email,source')
    .in('id', [contract.owner_lead_id, contract.tenant_lead_id])
  if (participantError || participants?.length !== 2 ||
      participants.some(row => row.source !== 'qa_e2e_contract_lifecycle' ||
        !String(row.email).endsWith('@example.com')))
    return reply({ ok: false, error: 'QA_SYNTHETIC_PARTICIPANTS_REQUIRED' }, 409)

  const signing = await checkTraditionalSigningReadiness(db, CONTRACT_ID)
  if (!signing.allowed || signing.reason !== 'no_caucion')
    return reply({ ok: false, error: 'QA_SIGNING_GATE_BLOCKED', reason: signing.reason }, 409)

  const { data: prior, error: priorError } = await db
    .from('identik_electronic_documents').select('id')
    .eq('lead_contract_id', CONTRACT_ID).maybeSingle()
  if (priorError)
    return reply({ ok: false, error: 'QA_RESERVATION_LOOKUP_FAILED' }, 503)

  // Existing QA document is a safe, expected read-only state: test it without
  // permitting a second send. Never delete or recycle the first reservation.
  return reply({ ok: true, qaOnly: true, sandboxOnly: true,
    readOnly: true, contractEligible: true,
    unreserved: !prior, existingDocument: !!prior })
}

// Only the deliberately gated QA GitHub Actions job can create/distribute
// this one Sandbox document after QA E2E and read-only preflight pass.
// Once a local record exists, the route will not create another provider copy.
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      (process.env.IDENTIK_ELECTRONIC_API_BASE_URL || SANDBOX) !== SANDBOX)
    return reply({ ok: false, error: 'QA_ONLY' }, 503)

  const bearer = request.headers.get('authorization') || ''
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || ''
  if (!sha || !bearer.startsWith('Bearer ') ||
      !(await validQaWorkflowToken(bearer.slice(7), sha)))
    return reply({ ok: false, error: 'QA_OIDC_REQUIRED' }, 403)

  if (request.headers.get('x-qa-identik-intent') !== 'create-sandbox-signing-without-provider-email')
    return reply({ ok: false, error: 'EXPLICIT_INTENT_REQUIRED' }, 400)

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key || !process.env.IDENTIK_ELECTRONIC_API_TOKEN)
    return reply({ ok: false, error: 'QA_CONFIGURATION_MISSING' }, 503)

  const db = createClient(QA_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: contract, error } = await db.from('lead_contracts')
    .select('id,status,content,tenant_agreed_at,owner_agreed_at,tenant_lead_id,owner_lead_id')
    .eq('id', CONTRACT_ID).maybeSingle()
  if (error || !contract || contract.status !== 'agreed' || !contract.content ||
      !contract.tenant_agreed_at || !contract.owner_agreed_at)
    return reply({ ok: false, error: 'QA_AGREED_CONTRACT_MISSING' }, 409)

  const { data: participants, error: participantError } = await db
    .from('lead_intake').select('id,email,source')
    .in('id', [contract.owner_lead_id, contract.tenant_lead_id])
  if (participantError || participants?.length !== 2 ||
      participants.some(row => row.source !== 'qa_e2e_contract_lifecycle' ||
        !String(row.email).endsWith('@example.com')))
    return reply({ ok: false, error: 'QA_SYNTHETIC_PARTICIPANTS_REQUIRED' }, 409)

  const preflight = await checkTraditionalSigningReadiness(db, CONTRACT_ID)
  if (!preflight.allowed || preflight.reason !== 'no_caucion')
    return reply({ ok: false, error: 'SIGNING_NOT_ALLOWED', reason: preflight.reason }, 409)

  const text = contract.content as string
  const pdf = createCaucionContractPdf({
    documentText: text, version: 1,
    sha256: createHash('sha256').update(text, 'utf8').digest('hex'),
    contractId: CONTRACT_ID,
  })
  if (!pdf.subarray(0, 8).toString('ascii').startsWith('%PDF-1.') ||
      pdf.includes(Buffer.from('C2PA')) || pdf.length > 50 * 1024 * 1024)
    return reply({ ok: false, error: 'QA_PDF_NOT_COMPATIBLE' }, 409)
  const pages = (pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length
  if (pages < 2 || pages > 80)
    return reply({ ok: false, error: 'QA_PDF_PAGE_COUNT_INVALID' }, 409)

  // Unique lead_contract_id and external_id enforce at-most-once creation.
  const { data: reserved, error: reserveError } = await db
    .from('identik_electronic_documents')
    .insert({
      lead_contract_id: CONTRACT_ID, external_id: EXTERNAL_ID,
      owner_email: OWNER_EMAIL, tenant_email: TENANT_EMAIL, status: 'creating',
    }).select('id').single()
  if (reserveError || !reserved)
    return reply({ ok: false, error: 'QA_DOCUMENT_ALREADY_RESERVED_OR_DB_ERROR' }, 409)

  try {
    const client = makeIdentikElectronicClient({ baseUrl: SANDBOX })
    // Convert PDF A4 points to the percentages expected by Identik v2.
    // Validate both signer fields before any provider document is created.
    const ownerField = identikSignatureField('owner', pages)
    const tenantField = identikSignatureField('tenant', pages)
    const created = await client.createDocument(
      new Blob([new Uint8Array(pdf)], { type: 'application/pdf' }),
      {
        title: 'VERLO QA V2 - Contrato de prueba - SIN VALIDEZ COMERCIAL',
        externalId: EXTERNAL_ID, includeSigningUrls: true,
        recipients: [
          { email: OWNER_EMAIL, name: 'VERLO QA Propietario',
            role: 'SIGNER', signingOrder: 1, fields: [ownerField] },
          { email: TENANT_EMAIL, name: 'VERLO QA Inquilino',
            role: 'SIGNER', signingOrder: 2, fields: [tenantField] },
        ],
        meta: { distributionMethod: 'NONE', signingOrder: 'SEQUENTIAL',
          language: 'es', subject: 'VERLO QA: firma de contrato de prueba',
          message: 'Documento exclusivamente de prueba. No representa una operación de alquiler.',
          requireBiometricId: false,
          sendViaWhatsapp: false, sendViaSms: false },
      }, 'verlo-contrato-prueba.pdf')

    const saved = await db.from('identik_electronic_documents')
      .update({ identik_document_id: created.id, status: 'created',
        updated_at: new Date().toISOString() })
      .eq('id', reserved.id).eq('status', 'creating').select('id').single()
    if (saved.error || !saved.data)
      return reply({ ok: false, error: 'PROVIDER_CREATED_LOCAL_PERSIST_FAILED',
        manualRecoveryRequired: true }, 503)

    await client.distributeDocument({
      documentId: created.id,
      includeSigningUrls: true,
      meta: { distributionMethod: 'NONE', language: 'es',
        subject: 'VERLO QA: firma de contrato de prueba',
        emailSettings: { recipientSigningRequest: false } },
    })
    const sent = await db.from('identik_electronic_documents')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', reserved.id).eq('status', 'created')
    if (sent.error)
      return reply({ ok: false, error: 'PROVIDER_DISTRIBUTED_LOCAL_STATUS_FAILED',
        manualRecoveryRequired: true }, 503)

    return reply({ ok: true, qaOnly: true, providerDocumentCreated: true,
      invitationsRequested: false, providerEmailsDisabled: true, twoSigners: true, documentId: created.id,
      externalId: EXTERNAL_ID, contractId: CONTRACT_ID })
  } catch (e) {
    // Do NOT retry automatically: the provider may have already created a
    // document despite a timeout. Keep the reservation for reconciliation.
    console.error('QA_IDENTIK_SANDBOX_SIGNING_FAILED',
      e instanceof Error ? e.name : 'UNKNOWN')
    return reply({ ok: false, error: 'PROVIDER_ACTION_UNCONFIRMED',
      manualRecoveryRequired: true }, 502)
  }
}
