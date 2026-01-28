import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { subject_id } = await req.json()

  if (!subject_id) {
    return NextResponse.json({ error: 'subject_id required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('identity_verifications')
    .insert({
      subject_type: 'user',
      subject_id,
      provider: 'truora',
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({
    verification_id: data.id,
  })
}
