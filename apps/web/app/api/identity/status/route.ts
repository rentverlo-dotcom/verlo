import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { user_id } = await req.json()

  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const { data } = await supabaseAdmin
    .from('identity_verifications')
    .select('status')
    .eq('user_id', user_id)
    .single()

  return NextResponse.json({
    status: data?.status ?? 'unverified',
  })
}
