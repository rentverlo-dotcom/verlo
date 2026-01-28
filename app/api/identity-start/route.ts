import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { user_id } = await req.json()

  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  // Crear intento local (antes de Truora)
  const { data, error } = await supabaseAdmin
    .from('identity_verifications')
    .insert({
      user_id,
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
