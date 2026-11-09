import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signCaucionLead } from '@/lib/powermarket/lead-token'
import { validQaWorkflowToken } from '@/lib/qa/verify-workflow-token'
import { POST as createLead } from '@/app/api/lead-intake/route'
import { POST as applyCaucion } from '@/app/api/powermarket/apply/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'
const fail = (reason: string) => NextResponse.json(
  { ok: false, qaOnly: true, error: reason },
  { status: 503, headers: { 'Cache-Control': 'no-store' } },
)

function input(path: string, data: Record<string, unknown>) {
  return new NextRequest('https://qa.verlo.invalid/api/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

// Protected by short-lived GitHub Actions OIDC, exact SHA, and QA-only database.
// Calls the actual intake and caucion handlers, not mock objects or live partners.
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY) return fail('QA_ONLY')
  const bearer = request.headers.get('authorization') || ''
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || ''
  if (!bearer.startsWith('Bearer ') || !sha ||
      !(await validQaWorkflowToken(bearer.slice(7), sha))) return fail('QA_AUTH_FAILED')

  try {
    const run = randomBytes(10).toString('hex')
    const leadResponse = await createLead(input('lead-intake', {
      full_name: 'QA Caucion Submission',
      email: 'qa-caucion-submit-' + run + '@example.com',
      phone: '1155550002',
      role: 'tenant',
      intent: 'tenant_search',
      source: 'qa_e2e_caucion_submission',
      zone: 'Palermo, CABA',
      neighborhood_labels: ['Palermo, CABA'],
      neighborhood_slugs: ['ar:02:caba:palermo'],
      neighborhood_slug: 'ar:02:caba:palermo',
      desired_property_type: 'Departamento',
      desired_rooms: '2 ambientes',
      budget_max: 900000,
      budget_range: '700001-900000',
      move_timing: 'En 1 a 3 meses',
      income_proof_type: 'salary_receipt',
      income_range: '2000001-3000000',
      income_max: 3000000,
      guarantee_types: ['surety_insurance'],
    }))
    const lead = await leadResponse.json().catch(() => null)
    const leadId = String(lead?.lead_id || '')
    if (!leadResponse.ok || !/^[a-f0-9-]{36}$/i.test(leadId)) throw Error('QA_LEAD_INTAKE_FAILED')

    const access = signCaucionLead(leadId)
    const body = {
      access, rent: 800000, expenses: 120000, income: 2800000,
      months: 24, employment: 'salary_receipt', hasCo: false,
      consent: true,
    }
    const noConsent = await applyCaucion(input('powermarket/apply', { ...body, consent: false }))
    if (noConsent.status !== 400) throw Error('CONSENT_GUARD_FAILED')
    const invalid = await applyCaucion(input('powermarket/apply', { ...body, access: 'invalid' }))
    if (invalid.status !== 401) throw Error('TOKEN_GUARD_FAILED')

    // Real concurrent inserts race through the production handler; unique QA
    // index must guarantee exactly one durable application.
    const requests = await Promise.all([
      applyCaucion(input('powermarket/apply', body)),
      applyCaucion(input('powermarket/apply', body)),
    ])
    const replies = await Promise.all(requests.map(async response => ({
      status: response.status, body: await response.json().catch(() => null),
    })))
    if (replies.some(r => r.status !== 200 || r.body?.ok !== true)) {
      throw Error('CONCURRENT_SUBMISSION_FAILED')
    }
    const applicationId = String(replies[0].body?.application_id || '')
    if (!applicationId || String(replies[1].body?.application_id || '') !== applicationId) {
      throw Error('CONCURRENT_APPLICATION_IDS_DIFFER')
    }

    const repeated = await applyCaucion(input('powermarket/apply', body))
    const repeatedBody = await repeated.json().catch(() => null)
    if (repeated.status !== 200 || repeatedBody?.already_submitted !== true ||
        repeatedBody?.application_id !== applicationId) throw Error('REPLAY_NOT_IDEMPOTENT')

    const db = createClient(QA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: applications, error: appError } = await db.from('caucion_applications')
      .select('id,status,requested_rent_ars,estimated_expenses_ars,duration_months,monthly_income_ars,employment_type,consent_at,consent_version')
      .eq('tenant_lead_id', leadId)
    if (appError || applications?.length !== 1) throw Error('APPLICATION_NOT_UNIQUE')
    const record = applications[0]
    if (record.id !== applicationId || record.status !== 'submitted' ||
        Number(record.requested_rent_ars) !== 800000 ||
        Number(record.estimated_expenses_ars) !== 120000 ||
        Number(record.duration_months) !== 24 ||
        Number(record.monthly_income_ars) !== 2800000 ||
        record.employment_type !== 'salary_receipt' ||
        !record.consent_at || record.consent_version !== 'powermarket-v1') {
      throw Error('APPLICATION_PERSISTENCE_MISMATCH')
    }

    const { data: events, error: eventError } = await db.from('caucion_events')
      .select('id,event_type').eq('application_id', applicationId)
      .eq('event_type', 'application_submitted')
    if (eventError || events?.length !== 1) throw Error('AUDIT_EVENT_MISSING_OR_DUPLICATE')

    return NextResponse.json({
      ok: true, qaOnly: true, actualHandlers: true,
      consentDenied: true, invalidTokenDenied: true,
      concurrentSameApplication: true, replayIdempotent: true,
      exactlyOneStoredApplication: true, matchingEconomicFields: true,
      exactlyOneAuditEvent: true, noExternalPartner: true,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('QA caucion submission lifecycle failure', error)
    return fail(error instanceof Error ? error.message : 'QA_CAUCION_FAILED')
  }
}
