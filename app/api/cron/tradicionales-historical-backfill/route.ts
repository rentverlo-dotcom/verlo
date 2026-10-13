import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Only audits the staged historic matches. No event creation and no delivery.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('traditional_historical_backfill_matches')
      .select('match_id,state')
      .eq('campaign', 'oct2026_recovery')
      .limit(1000)

    if (error) {
      return NextResponse.json({
        ok: false, stage: 'staging_table', error: error.message,
        hint: 'Run the staging SQL before using this endpoint.',
      }, { status: 503 })
    }

    const rows = data || []
    return NextResponse.json({
      ok: true,
      mode: 'dry_run',
      messages_sent: 0,
      staged: rows.filter(row => row.state === 'staged').length,
      excluded: rows.filter(row => row.state === 'excluded').length,
      completed: rows.filter(row => row.state === 'completed').length,
      total: rows.length,
    })
  } catch (error) {
    console.error('historic backfill dry run failed', error)
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 })
  }
}
