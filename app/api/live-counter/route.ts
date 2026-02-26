import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { error: rpcErr } = await supabase.rpc('increment_session')
  if (rpcErr) {
    return NextResponse.json(
      { error: rpcErr.message, details: rpcErr.details, hint: rpcErr.hint },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from('site_stats')
    .select('value')
    .eq('key', 'properties_count')
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message, details: error.details, hint: error.hint },
      { status: 500 }
    )
  }

  return NextResponse.json({ count: data?.value })
}
