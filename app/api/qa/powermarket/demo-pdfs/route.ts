import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { createCaucionContractPdf } from '@/lib/powermarket/contract-pdf'
import { validQaWorkflowToken } from '@/lib/qa/verify-workflow-token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'
const CASES = [
  { id: 'af0ac065-89d3-4630-8f60-053f5ae13766', email: 'demo-powermarket-20261116@example.com' },
  { id: '4e911018-6185-4beb-83ee-559c916d330c', email: 'qa-powermarket-low-income@example.com' },
  { id: 'c0c4e8ba-5be6-4f3c-b0be-44df3453cb7a', email: 'qa-powermarket-dual-income@example.com' },
] as const
const response = (status: number, json: Record<string, unknown>) =>
  NextResponse.json({ qaOnly: true, ...json }, {
    status, headers: { 'Cache-Control': 'no-store' },
  })

/**
 * Deliberately one-off demo publisher:
 * - exact GitHub Actions OIDC workflow, branch and deployed SHA
 * - exactly three synthetic applications by immutable UUID and lead email
 * - no status mutations, no offers, no payment operations
 * - checks current contract before and after signed private PDF publication
 * - idempotent; does not replace already published PDFs
 */
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview' ||
    process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
    process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return response(404, { ok: false, error: 'QA_ONLY' })
  }
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || ''
  const bearer = request.headers.get('authorization') || ''
  if (!sha || !bearer.startsWith('Bearer ') ||
    !(await validQaWorkflowToken(
      bearer.slice(7).trim(), sha, 'powermarket-demo-pdf-qa.yml',
    ))) {
    return response(403, { ok: false, error: 'QA_OIDC_REQUIRED' })
  }
  const db = createClient(QA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: bucket, error: bucketError } = await db.storage.getBucket('tenant-documents')
  if (bucketError || !bucket || bucket.public)
    return response(503, { ok: false, error: 'PRIVATE_BUCKET_UNAVAILABLE' })

  type Ready = {
    applicationId: string; contractId: string; content: string
    version: number; hash: string; key: string; already: boolean
  }
  const ready: Ready[] = []
  // Preflight EVERY case before writing ANY document.
  for (const item of CASES) {
    const { data: a, error: ae } = await db.from('caucion_applications')
      .select('id,status,tenant_lead_id').eq('id', item.id).single()
    if (ae || !a || a.status !== 'under_review') {
      return response(409, { ok: false, error: 'REQUIRES_QA_UNDER_REVIEW', case_id: item.id })
    }
    const { data: lead } = await db.from('lead_intake')
      .select('id,email,source').eq('id', a.tenant_lead_id).single()
    if (!lead || lead.email !== item.email || lead.source !== 'qa_demo_powermarket') {
      return response(409, { ok: false, error: 'NOT_DEMO_LEAD', case_id: item.id })
    }
    const { data: contracts, error: ce } = await db.from('lead_contracts')
      .select('id,status,content').eq('tenant_lead_id', lead.id).limit(2)
    if (ce || contracts?.length !== 1 ||
      contracts[0].status !== 'generated' ||
      typeof contracts[0].content !== 'string' ||
      !contracts[0].content.includes('SIN VALIDEZ COMERCIAL') ||
      !contracts[0].content.includes('VERLO QA')) {
      return response(409, { ok: false, error: 'NOT_ONE_VALID_DEMO_CONTRACT', case_id: item.id })
    }
    const c = contracts[0]
    const hash = createHash('sha256').update(c.content, 'utf8').digest('hex')
    const { data: reviews, error: re } = await db.from('caucion_contract_reviews')
      .select('id,version,contract_content_sha256,private_pdf_key,pdf_sha256,status')
      .eq('application_id', item.id).eq('lead_contract_id', c.id)
      .order('version', { ascending: false }).limit(1)
    if (re) return response(503, { ok: false, error: 'REVIEW_LOOKUP_FAILED', case_id: item.id })
    const previous = reviews?.[0]
    if (previous && previous.contract_content_sha256 !== hash)
      return response(409, { ok: false, error: 'CONTRACT_VERSION_CHANGED', case_id: item.id })
    const version = previous?.version ?? 1
    const key = `powermarket/contracts/${item.id}/${c.id}/v${version}.pdf`
    if (previous && (previous.private_pdf_key !== key || previous.status === 'superseded'))
      return response(409, { ok: false, error: 'REVIEW_NOT_CURRENT', case_id: item.id })
    ready.push({ applicationId: item.id, contractId: c.id,
      content: c.content, version, hash, key, already: Boolean(previous) })
  }

  const published: Array<{ application_id: string; contract_id: string; status: string; pdf_verified: boolean }> = []
  for (const item of ready) {
    const pdf = createCaucionContractPdf({
      documentText: item.content, version: item.version,
      sha256: item.hash, contractId: item.contractId,
    })
    const expectedPdfSha = createHash('sha256').update(pdf).digest('hex')
    if (!item.already) {
      const { error: up } = await db.storage.from('tenant-documents')
        .upload(item.key, pdf, { upsert: false, contentType: 'application/pdf' })
      // An exact previously uploaded PDF can be resumed after partial failure.
      if (up) {
        const { data: existing, error: de } = await db.storage
          .from('tenant-documents').download(item.key)
        if (de || !existing || createHash('sha256').update(
          Buffer.from(await existing.arrayBuffer())).digest('hex') !== expectedPdfSha) {
          return response(503, { ok: false, error: 'UPLOAD_FAILED', case_id: item.applicationId,
            completed: published })
        }
      }
      const { error: pe } = await db.rpc('caucion_publish_contract_review', {
        p_application_id: item.applicationId,
        p_contract_id: item.contractId,
        p_content_sha256: item.hash, p_pdf_sha256: expectedPdfSha,
        p_private_key: item.key, p_version: item.version,
      })
      if (pe) return response(503, { ok: false,
        error: 'PUBLICATION_FAILED', case_id: item.applicationId, completed: published })
    }
    const { data: current, error: currentError } = await db.from('caucion_contract_reviews')
      .select('pdf_sha256,status,private_pdf_key')
      .eq('application_id', item.applicationId)
      .eq('lead_contract_id', item.contractId)
      .eq('version', item.version).single()
    if (currentError || !current || current.private_pdf_key !== item.key ||
      current.pdf_sha256 !== expectedPdfSha || current.status === 'superseded') {
      return response(503, { ok: false, error: 'REVIEW_VERIFICATION_FAILED',
        case_id: item.applicationId, completed: published })
    }
    const { data: stored, error: downloadError } = await db.storage
      .from('tenant-documents').download(item.key)
    if (downloadError || !stored || createHash('sha256').update(
      Buffer.from(await stored.arrayBuffer())).digest('hex') !== current.pdf_sha256) {
      return response(503, { ok: false, error: 'PDF_BYTES_MISMATCH',
        case_id: item.applicationId, completed: published })
    }
    published.push({ application_id: item.applicationId, contract_id: item.contractId,
      status: item.already ? 'already_published' : 'published', pdf_verified: true })
  }
  return response(200, { ok: true, published, all_three_pdfs_verified: published.length === 3 })
}
