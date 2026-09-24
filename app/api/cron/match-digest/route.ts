import { createHash, randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyLeadOnce } from '@/lib/lead-notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ACTIVE_STATUSES = ['new', 'reviewed', 'contacted', 'converted']

type Role = 'tenant' | 'owner'
type Match = {
  id: string
  tenant_lead_id: string
  owner_lead_id: string
  created_at: string
}
type Lead = {
  id: string
  email: string | null
  phone_normalized: string | null
}

function identity(lead: Lead) {
  const phone = (lead.phone_normalized || '').trim()
  const email = (lead.email || '').trim().toLowerCase()
  return phone ? `phone:${phone}` : email ? `email:${email}` : `lead:${lead.id}`
}

async function destination(role: Role, leadId: string) {
  const table = role === 'tenant'
    ? 'tenant_matches_access_tokens'
    : 'owner_candidates_access_tokens'
  const column = role === 'tenant' ? 'tenant_lead_id' : 'owner_lead_id'
  const now = new Date().toISOString()

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from(table)
    .select('token')
    .eq(column, leadId)
    .is('revoked_at', null)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lookupError) throw lookupError

  let token = existing?.token
  if (!token) {
    token = randomBytes(32).toString('hex')
    const { error } = await supabaseAdmin.from(table).insert({
      [column]: leadId,
      token,
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    })
    if (error) throw error
  }
  return `${role === 'tenant' ? '/matches' : '/candidatos'}/${token}`
}

async function recentMatches(since: string): Promise<Match[]> {
  const matches: Match[] = []
  for (let start = 0; start < 5000; start += 500) {
    const { data, error } = await supabaseAdmin
      .from('lead_matches')
      .select('id, tenant_lead_id, owner_lead_id, created_at')
      .gte('created_at', since)
      .gte('score', 80)
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(start, start + 499)
    if (error) throw error
    matches.push(...(data || []))
    if (!data || data.length < 500) return matches
  }
  throw new Error('More than 5000 new matches; digest needs pagination capacity')
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    // Vercel runs at 21:00 UTC = 18:00 Argentina. The window begins
    // at the previous scheduled run, so 5 today and 15 tomorrow yield
    // one notice on each day, with the current total in each notice.
    const today = new Date(Date.now() - 3 * 3600000)
      .toISOString().slice(0, 10)
    const since = new Date(
      new Date(`${today}T21:00:00.000Z`).getTime() - 86400000
    ).toISOString()
    const matches = await recentMatches(since)
    const ids = Array.from(new Set(matches.flatMap(
      (m) => [m.tenant_lead_id, m.owner_lead_id]
    )))
    const leads = new Map<string, Lead>()
    for (let i = 0; i < ids.length; i += 300) {
      const { data, error } = await supabaseAdmin
        .from('lead_intake')
        .select('id, email, phone_normalized')
        .in('id', ids.slice(i, i + 300))
      if (error) throw error
      for (const lead of data || []) leads.set(lead.id, lead)
    }

    // One discovery notice per person and role per Argentina calendar day.
    // The first recent match chooses a representative lead and its private list.
    const recipients = new Map<string, { role: Role; leadId: string }>()
    for (const match of matches) {
      for (const role of ['tenant', 'owner'] as const) {
        const leadId = role === 'tenant'
          ? match.tenant_lead_id : match.owner_lead_id
        const lead = leads.get(leadId)
        if (!lead) continue
        const key = `${role}:${identity(lead)}`
        if (!recipients.has(key)) recipients.set(key, { role, leadId })
      }
    }

    async function sendRecipient(recipient: string, role: Role, leadId: string) {
      try {
        const column = role === 'tenant' ? 'tenant_lead_id' : 'owner_lead_id'
        const { count, error } = await supabaseAdmin
          .from('lead_matches')
          .select('id', { count: 'exact', head: true })
          .eq(column, leadId)
          .gte('score', 80)
          .in('status', ACTIVE_STATUSES)
        if (error) throw error
        if (!count) return true

        const url = await destination(role, leadId)
        const key = createHash('sha256').update(recipient).digest('hex')
        const result = await notifyLeadOnce({
          eventKey: `match_digest:${today}:${key}`,
          eventType: role === 'tenant' ? 'match_created' : 'owner_match_digest',
          leadId,
          entityType: 'lead',
          entityId: leadId,
          title: role === 'tenant'
            ? 'Verlo · Tus propiedades compatibles'
            : 'Verlo · Tus candidatos compatibles',
          body: role === 'tenant'
            ? `En esta búsqueda tenés ${count} propiedades compatibles para revisar.`
            : `En esta publicación tenés ${count} candidatos compatibles. Pueden estar pendientes de validación.`,
          url,
          // The current GHL match workflow is for tenants only.
          skipWhatsApp: role === 'owner',
        })
        return Boolean(result.ok)
      } catch (error) {
        console.error('Daily match digest recipient failed', { role, leadId, error })
        return false
      }
    }

    let sent = 0
    let failed = 0
    const entries = Array.from(recipients)
    for (let i = 0; i < entries.length; i += 8) {
      const outcomes = await Promise.all(entries.slice(i, i + 8)
        .map(([key, value]) => sendRecipient(key, value.role, value.leadId)))
      sent += outcomes.filter(Boolean).length
      failed += outcomes.filter((ok) => !ok).length
    }

    return NextResponse.json({ ok: failed === 0, date: today,
      recipients: recipients.size, sent, failed },
    { status: failed ? 500 : 200 })
  } catch (error) {
    console.error('Daily match digest failed', error)
    return NextResponse.json({ ok: false, error: 'Daily digest failed' },
      { status: 500 })
  }
}
