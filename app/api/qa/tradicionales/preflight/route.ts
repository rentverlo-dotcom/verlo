import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QA_DATABASE = 'https://anptswspguyotnasoacq.supabase.co'

export async function GET() {
  const branchOk = process.env.VERCEL_GIT_COMMIT_REF === 'qa/verlo-e2e'
  const databaseOk = process.env.NEXT_PUBLIC_SUPABASE_URL === QA_DATABASE

  if (!branchOk || !databaseOk) {
    return NextResponse.json({ ok: false, reason: 'qa_isolation_mismatch' }, { status: 503 })
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    return NextResponse.json({ ok: false, reason: 'qa_key_missing' }, { status: 503 })
  }

  const db = createClient(QA_DATABASE, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Head-only requests. No records or private data leave the database.
  const tables = ['lead_intake', 'lead_matches'] as const
  const checks = await Promise.all(tables.map(async (table) => {
    const { error } = await db.from(table).select('id', { head: true, count: 'exact' })
    return { table, ok: !error, errorCode: error?.code ?? null }
  }))
  const ok = checks.every((item) => item.ok)

  return NextResponse.json({ ok, environment: 'qa', checks }, {
    status: ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
