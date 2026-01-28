import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { subject_id } = await req.json()

  if (!subject_id) {
    return NextResponse.json({ verified: false }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('identity_verifications')
    .select('status')
    .eq('subject_type', 'user')
    .eq('subject_id', subject_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return NextResponse.json({ verified: false, status: null })
  }

  return NextResponse.json({
    verified: data.status === 'verified',
    status: data.status,
  })
}
