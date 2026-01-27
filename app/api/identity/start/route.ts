import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { user_id } = await req.json()

  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  await supabaseAdmin
    .from('identity_verifications')
    .upsert({
      user_id,
      status: 'pending',
      provider: 'manual',
    })

  return NextResponse.json({ ok: true })
}
