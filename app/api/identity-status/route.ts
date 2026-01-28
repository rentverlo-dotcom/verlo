import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { user_id } = await req.json()

  if (!user_id) {
    return NextResponse.json({ verified: false }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('identity_verifications')
    .select('status')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return NextResponse.json({ verified: false })
  }

  return NextResponse.json({
    verified: data.status === 'verified',
    status: data.status,
  })
}
