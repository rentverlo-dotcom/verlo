import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'
const LEAD_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i

// QA-only metadata fixture. It NEVER calls R2 or creates actual media objects.
// This tests the Supabase owner -> media relationship, repeat submissions,
// rejection of tenant IDs, and isolation. It is NOT an R2 upload E2E.
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)
  const ownerId = typeof body?.owner_lead_id === 'string' ? body.owner_lead_id : ''
  if (!LEAD_ID.test(ownerId)) {
    return NextResponse.json({ ok: false, error: 'INVALID_OWNER_ID' }, { status: 400 })
  }

  const db = createClient(QA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: lead, error: leadError } = await db
    .from('lead_intake').select('id,role,intent,source,email')
    .eq('id', ownerId).maybeSingle()
  if (leadError) return NextResponse.json({ ok: false, error: 'QA_DB_ERROR' }, { status: 503 })
  if (!lead || lead.role !== 'owner' || lead.intent !== 'owner_new_listing' ||
      !String(lead.source || '').startsWith('qa_e2e_') ||
      !String(lead.email || '').toLowerCase().endsWith('@example.com')) {
    return NextResponse.json({ ok: false, error: 'NOT_SYNTHETIC_OWNER' }, { status: 403 })
  }

  const key = `qa-fixture-only/owner-media/${ownerId}/photo.png`
  const { data: prior, error: checkError } = await db
    .from('owner_property_media').select('id')
    .eq('lead_id', ownerId).eq('r2_key', key).limit(1)
  if (checkError) return NextResponse.json({ ok: false, error: 'QA_DB_ERROR' }, { status: 503 })

  let inserted = false
  if (!prior?.length) {
    const { error } = await db.from('owner_property_media').insert({
      lead_id: ownerId,
      completion_id: null,
      owner_prospect_id: null,
      match_id: null,
      media_type: 'photo',
      r2_bucket: 'qa-fixture-only-not-a-real-bucket',
      r2_key: key,
      public_url: null,
      original_filename: 'photo-qa-fixture.png',
      content_type: 'image/png',
      size_bytes: 67,
      position: 0,
    })
    if (error) return NextResponse.json({ ok: false, error: 'QA_INSERT_FAILED' }, { status: 503 })
    inserted = true
  }

  const { data: stored, error: verifyError } = await db
    .from('owner_property_media').select('id,r2_bucket,r2_key,media_type')
    .eq('lead_id', ownerId).eq('r2_key', key)
  if (verifyError || !stored || stored.length !== 1 ||
      stored[0].r2_bucket !== 'qa-fixture-only-not-a-real-bucket') {
    return NextResponse.json({ ok: false, error: 'QA_VERIFY_FAILED' }, { status: 503 })
  }

  return NextResponse.json({
    ok: true, qaOnly: true, noExternalR2: true,
    inserted, rows: stored.length, ownerVerified: true, photoType: stored[0].media_type,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
