import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GET as getMiVerlo } from '@/app/api/mi-verlo/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'
type Lead = { id: string; email: string; role: string; intent: string; source: string }

function eligible(lead: Lead | undefined, role: string) {
  return Boolean(lead && lead.role === role &&
    lead.intent === (role === 'owner' ? 'owner_new_listing' : 'tenant_search') &&
    lead.source.startsWith('qa_e2e_') &&
    lead.email.toLowerCase().endsWith('@example.com'))
}

// Run ONLY with a private server-side CRON_SECRET in the isolated QA deployment.
// No email invitations are sent: admin.createUser(email_confirm:true) creates
// temporary synthetic Auth identities; every identity is deleted in finally.
// Production and public unauthenticated traffic must never reach this endpoint.
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.CRON_SECRET ||
      request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 403 })
  }

  const admin = createClient(QA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const client = createClient(QA_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const created: string[] = []
  try {
    const { data: matches, error: matchError } = await admin.from('lead_matches')
      .select('owner_lead_id,tenant_lead_id').limit(150)
    if (matchError) throw new Error('MATCH_LOOKUP_FAILED')
    const leadIds = [...new Set((matches || []).flatMap(m => [m.owner_lead_id, m.tenant_lead_id]))]
    if (!leadIds.length) throw new Error('NO_QA_MATCH_FIXTURES')

    const { data: leads, error: leadError } = await admin.from('lead_intake')
      .select('id,email,role,intent,source').in('id', leadIds)
    if (leadError) throw new Error('LEADS_LOOKUP_FAILED')
    const byId = new Map(((leads || []) as Lead[]).map(lead => [lead.id, lead]))
    const pair = (matches || []).map(m => ({
      owner: byId.get(m.owner_lead_id),
      tenant: byId.get(m.tenant_lead_id),
    })).find(p => eligible(p.owner, 'owner') && eligible(p.tenant, 'tenant') &&
      p.owner!.email.toLowerCase() !== p.tenant!.email.toLowerCase())
    if (!pair) throw new Error('NO_VALID_QA_PAIR')

    const run = async (lead: Lead) => {
      const password = randomBytes(32).toString('base64url')
      const { data: createdUser, error: creationError } = await admin.auth.admin.createUser({
        email: lead.email, password, email_confirm: true,
      })
      if (creationError || !createdUser.user) throw new Error('QA_AUTH_CREATE_FAILED')
      created.push(createdUser.user.id)
      const { data: signed, error: loginError } = await client.auth.signInWithPassword({
        email: lead.email, password,
      })
      if (loginError || !signed.session?.access_token) throw new Error('QA_AUTH_LOGIN_FAILED')

      const dashboardResponse = await getMiVerlo(new NextRequest(
        'https://qa.verlo.invalid/api/mi-verlo',
        { method: 'GET', headers: { Authorization: `Bearer ${signed.session.access_token}` } },
      ))
      const body = await dashboardResponse.json()
      if (dashboardResponse.status !== 200 || !body.ok) {
        throw new Error('QA_DASHBOARD_FAILED')
      }
      const ids: string[] = body.user?.lead_ids || []
      if (body.user?.email?.toLowerCase() !== lead.email.toLowerCase() ||
          !ids.includes(lead.id) ||
          (body.intakes || []).some((item: {email?: string}) =>
            item.email?.toLowerCase() !== lead.email.toLowerCase())) {
        throw new Error('QA_DASHBOARD_IDENTITY_LEAK')
      }
      return { role: lead.role, email: lead.email.toLowerCase(), id: lead.id,
        rows: ids.length, dashboard: body }
    }

    const owner = await run(pair.owner!)
    const tenant = await run(pair.tenant!)
    const ownerSeesTenant = owner.dashboard.user.lead_ids.includes(tenant.id)
    const tenantSeesOwner = tenant.dashboard.user.lead_ids.includes(owner.id)
    const ownerContainsTenant = owner.dashboard.intakes.some((x: {id: string}) => x.id === tenant.id)
    const tenantContainsOwner = tenant.dashboard.intakes.some((x: {id: string}) => x.id === owner.id)

    const isolated = !ownerSeesTenant && !tenantSeesOwner &&
      !ownerContainsTenant && !tenantContainsOwner
    return NextResponse.json({
      ok: isolated,
      qaOnly: true,
      realSupabaseAuth: true,
      twoTemporaryUsers: true,
      ownerOnlyOwnData: !ownerSeesTenant && !ownerContainsTenant,
      tenantOnlyOwnData: !tenantSeesOwner && !tenantContainsOwner,
      users: [{role:owner.role, ownLeads:owner.rows}, {role:tenant.role, ownLeads:tenant.rows}],
    }, { status: isolated ? 200 : 500, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN'
    return NextResponse.json({ ok: false, qaOnly: true, error: code },
      { status: 503, headers: { 'Cache-Control': 'no-store' } })
  } finally {
    for (const id of created) {
      await admin.from('user_profiles').delete().eq('user_id', id)
      await admin.auth.admin.deleteUser(id)
    }
  }
}
