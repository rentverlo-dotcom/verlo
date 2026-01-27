import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { user_id } = await req.json()

  if (!user_id) {
    return NextResponse.json({ error: 'missing user' }, { status: 400 })
  }

  // crea registro si no existe
  await supabaseAdmin
    .from('identity_verifications')
    .upsert({
      user_id,
      status: 'pending',
    })

  // por ahora simulamos proveedor externo
  // después acá conectás Renaper / Mi Argentina
  return NextResponse.json({
    ok: true,
    redirect_url: '/verificacion/en-proceso',
  })
}
