import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validQaWorkflowToken } from '@/lib/qa/verify-workflow-token'
import { POST as createLead } from '@/app/api/lead-intake/route'
import { POST as setTenantInterest } from '@/app/api/match-interest/route'
import { POST as setOwnerInterest } from '@/app/api/owner-interest/route'
import { POST as postVisit } from '@/app/api/post-visit-decision/route'
import { POST as saveLegalData } from '@/app/api/closing-legal-data/route'
import { POST as generateContract } from '@/app/api/closing-generate/route'
import { POST as agreeContract } from '@/app/api/closing-agree/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i

function internal(body: Record<string, unknown>): NextRequest {
  return new NextRequest('https://qa.verlo.invalid/api/qa-contract-actor', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}
async function step(label: string, response: Response): Promise<Record<string, unknown>> {
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok || !data || typeof data !== 'object' || (data as Record<string,unknown>).ok === false)
    throw new Error(label + '_FAILED_' + response.status)
  return data as Record<string, unknown>
}

const geo = {
  zone: 'Olivos',
  neighborhood_labels: ['Olivos'],
  neighborhood_slugs: ['ar:06:060756:06075610'],
  neighborhood_slug: 'ar:06:060756:06075610',
  metadata: { georef: [{
    provinceId: '06', provinceName: 'Buenos Aires',
    municipalityId: '060756', municipalityName: 'Vicente López',
    localityId: '06075610', localityName: 'Olivos',
    key: 'ar:06:060756:06075610', label: 'Olivos, Vicente López, Buenos Aires',
    latitude: -34.51, longitude: -58.49,
  }] },
}

export async function POST(request: NextRequest) {
  const verified = process.env.VERCEL_GIT_COMMIT_REF === 'qa/verlo-e2e' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === QA_URL &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (!verified) return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 403 })
  const h = request.headers.get('authorization') || ''
  const authToken = h.startsWith('Bearer ') ? h.substring(7) : ''
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || ''
  if (!commit || !(await validQaWorkflowToken(authToken, commit))) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 403 })
  }

  const db = createClient(QA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  try {
    const run = randomBytes(8).toString('hex')
    const common = { ...geo, source: 'qa_e2e_contract_lifecycle' }
    const owner = await step('OWNER', await createLead(internal({
      ...common, full_name: 'QA Contract Owner', email: 'qa-contract-owner-' + run + '@example.com',
      phone: '1155550001', role: 'owner', intent: 'owner_new_listing',
      property_type: 'Departamento', property_rooms: '2 ambientes',
      approx_price: '800000', approx_price_number: 800000,
      availability_status: 'En 1 a 3 meses',
      accepted_income_proof_types: ['salary_receipt'], min_income_ratio: 2,
      accepted_guarantee_types: ['surety_insurance'],
    })))
    const tenant = await step('TENANT', await createLead(internal({
      ...common, full_name: 'QA Contract Tenant', email: 'qa-contract-tenant-' + run + '@example.com',
      phone: '1155550002', role: 'tenant', intent: 'tenant_search',
      desired_property_type: 'Departamento', desired_rooms: '2 ambientes',
      budget_max: 900000, budget_range: '700001-900000',
      move_timing: 'En 1 a 3 meses', income_proof_type: 'salary_receipt',
      income_range: '2000001-3000000', income_max: 3000000,
      guarantee_types: ['surety_insurance'],
    })))
    const ownerId = String(owner.lead_id || '')
    const tenantId = String(tenant.lead_id || '')
    if (!UUID.test(ownerId) || !UUID.test(tenantId)) throw Error('INVALID_FIXTURE_LEAD')

    const { data: match, error: matchErr } = await db.from('lead_matches')
      .select('id,score,tenant_interest_at,owner_interest_at,ready_to_connect_at')
      .eq('owner_lead_id', ownerId).eq('tenant_lead_id', tenantId)
      .gte('score', 80).limit(1).maybeSingle()
    if (matchErr || !match) throw Error('MATCH_NOT_GENERATED')

    const tenantToken = randomBytes(32).toString('hex')
    const ownerToken = randomBytes(32).toString('hex')
    const tenantAccess = await db.from('tenant_matches_access_tokens').insert({
      tenant_lead_id: tenantId, token: tenantToken,
    })
    const ownerAccess = await db.from('owner_candidates_access_tokens').insert({
      owner_lead_id: ownerId, token: ownerToken,
    })
    if (tenantAccess.error || ownerAccess.error) throw Error('MATCH_TOKEN_CREATE_FAILED')

    const tenantFirst = await step('TENANT_INTEREST', await setTenantInterest(internal({
      token: tenantToken, match_id: match.id,
    })))
    if (tenantFirst.tenant_interest !== true || tenantFirst.ready_to_connect !== false ||
        tenantFirst.waiting_for !== 'tenant_verification') {
      throw Error('TENANT_INTEREST_TRANSITION_INVALID')
    }

    // Namirial has not supplied test access: this is a controlled QA-only
    // stand-in for a successful verification, NOT an identity E2E approval.
    const verification = await db.from('lead_matches').update({
      tenant_verified_at: new Date().toISOString(),
    }).eq('id', match.id).eq('tenant_lead_id', tenantId)
    if (verification.error) throw Error('QA_IDENTITY_STANDIN_FAILED')

    const ownerFirst = await step('OWNER_INTEREST', await setOwnerInterest(internal({
      token: ownerToken, match_id: match.id,
    })))
    if (ownerFirst.ready_to_connect !== true || ownerFirst.tenant_interest !== true ||
        ownerFirst.owner_interest !== true || !UUID.test(String(ownerFirst.contract_id || ''))) {
      throw Error('DOUBLE_OK_DRAFT_INVALID')
    }

    const { data: draft, error: draftError } = await db.from('lead_contracts')
      .select('id,lead_match_id,tenant_lead_id,owner_lead_id,status')
      .eq('lead_match_id', match.id).maybeSingle()
    if (draftError || !draft || draft.id !== ownerFirst.contract_id ||
        draft.tenant_lead_id !== tenantId || draft.owner_lead_id !== ownerId ||
        draft.status !== 'draft') throw Error('CONTRACT_NOT_PERSISTED')

    const tenantDecisionToken = await db.from('lead_contract_access_tokens')
      .select('token').eq('contract_id', draft.id).eq('lead_id', tenantId)
      .eq('role', 'tenant').maybeSingle()
    const ownerDecisionToken = await db.from('lead_contract_access_tokens')
      .select('token').eq('contract_id', draft.id).eq('lead_id', ownerId)
      .eq('role', 'owner').maybeSingle()
    if (!tenantDecisionToken.data?.token || !ownerDecisionToken.data?.token)
      throw Error('CONTRACT_TOKENS_MISSING')

    const visitTenant = await step('POST_VISIT_TENANT', await postVisit(internal({
      token: tenantDecisionToken.data.token, decision: 'yes',
    })))
    if (visitTenant.second_double_ok !== false) throw Error('POST_VISIT_FIRST_DECISION_INVALID')
    const visitOwner = await step('POST_VISIT_OWNER', await postVisit(internal({
      token: ownerDecisionToken.data.token, decision: 'yes',
    })))
    if (visitOwner.second_double_ok !== true || visitOwner.can_accept_contract !== true)
      throw Error('POST_VISIT_DOUBLE_OK_INVALID')

    const repeat = await step('POST_VISIT_IDEMPOTENCY', await postVisit(internal({
      token: ownerDecisionToken.data.token, decision: 'yes',
    })))
    if (repeat.decision_changed !== false || repeat.became_second_double_ok !== false)
      throw Error('POST_VISIT_DUPLICATE_TRIGGER')

    // Actual contract handlers: validate each party's own legal data.
    // No external provider is called, and no real identity is claimed.
    const tenantLegal = {
      token: tenantDecisionToken.data.token,
      tenant: { dni: '30123456', civil_status: 'soltero',
        legal_address: 'Calle QA 100', city: 'Olivos',
        province: 'Buenos Aires', country: 'Argentina', postal_code: '1636' },
      // A tenant must never overwrite the owner's legal data.
      owner: { dni: '99999999' },
    }
    const tenantSave = await step('TENANT_LEGAL', await saveLegalData(internal(tenantLegal)))
    if (tenantSave.changed !== true || tenantSave.role !== 'tenant')
      throw Error('TENANT_LEGAL_NOT_PERSISTED')
    const tenantRepeat = await step('TENANT_LEGAL_REPEAT', await saveLegalData(internal(tenantLegal)))
    if (tenantRepeat.changed !== false) throw Error('TENANT_LEGAL_NOT_IDEMPOTENT')

    const ownerLegal = {
      token: ownerDecisionToken.data.token,
      owner: { dni: '25123456', civil_status: 'casado',
        legal_address: 'Calle QA 200', city: 'Olivos',
        province: 'Buenos Aires', country: 'Argentina' },
      property: { street: 'Calle QA', number: '500',
        city: 'Olivos', province: 'Buenos Aires', country: 'Argentina' },
      signing_place: { city: 'Olivos', province: 'Buenos Aires', country: 'Argentina' },
      furnishing: { status: 'unfurnished' },
      tenant: { dni: '99999999' },
    }
    const ownerSave = await step('OWNER_LEGAL', await saveLegalData(internal(ownerLegal)))
    if (ownerSave.changed !== true || ownerSave.role !== 'owner')
      throw Error('OWNER_LEGAL_NOT_PERSISTED')
    const ownerRepeat = await step('OWNER_LEGAL_REPEAT', await saveLegalData(internal(ownerLegal)))
    if (ownerRepeat.changed !== false) throw Error('OWNER_LEGAL_NOT_IDEMPOTENT')

    const contractTerms = await db.from('lead_contracts')
      .select('status,content,terms_json,tenant_agreed_at,owner_agreed_at')
      .eq('id', draft.id).single()
    const terms = contractTerms.data?.terms_json || {}
    if (contractTerms.error || contractTerms.data?.status !== 'draft' ||
        contractTerms.data?.content || contractTerms.data?.tenant_agreed_at ||
        contractTerms.data?.owner_agreed_at ||
        terms.tenant_dni !== '30123456' || terms.owner_dni !== '25123456' ||
        terms.property_number !== '500' || terms.signing_city !== 'Olivos')
      throw Error('CONTRACT_LEGAL_ROLES_OR_STATE_INVALID')

    // No premature acceptance: a contract must be generated first.
    const premature = await agreeContract(internal({token: tenantDecisionToken.data.token}))
    if (premature.status !== 409) throw Error('PREMATURE_AGREEMENT_ALLOWED')
    // Invalid economic terms cannot generate a contract.
    const badGenerate = await generateContract(internal({
      token: ownerDecisionToken.data.token, monthly_price: -100,
      deposit: 0, start_date: '2027-01-01', end_date: '2028-01-01',
      adjustment_method: 'IPC',
    }))
    if (badGenerate.status !== 400) throw Error('INVALID_RENT_ALLOWED')

    const { data: final, error: finalError } = await db.from('lead_matches')
      .select('tenant_interest_at,tenant_verified_at,owner_interest_at,ready_to_connect_at,tenant_post_visit_decision,owner_post_visit_decision')
      .eq('id', match.id).single()
    if (finalError || !final || !final.tenant_interest_at || !final.tenant_verified_at ||
        !final.owner_interest_at || !final.ready_to_connect_at ||
        final.tenant_post_visit_decision !== 'yes' || final.owner_post_visit_decision !== 'yes')
      throw Error('MATCH_FINAL_STATE_INVALID')

    return NextResponse.json({
      ok: true, qaOnly: true, realApiHandlers: true, noExternalDelivery: true,
      identityVerificationSimulated: true, twoInterests: true,
      firstDoubleOk: true, draftPersisted: true,
      contractTokenRoles: 2, secondDoubleOk: true,
      repeatIdempotent: true,
      bothLegalPartiesSaved: true, ownDataProtected: true,
      legalUpdateIdempotent: true, prematureAgreementDenied: true,
      invalidRentalPriceDenied: true,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json({
      ok: false, qaOnly: true,
      error: error instanceof Error ? error.message : 'UNKNOWN_QA_LIFECYCLE_ERROR',
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
