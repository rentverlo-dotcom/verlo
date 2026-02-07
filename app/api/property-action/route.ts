import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { property_id, action } = await req.json()

  if (!property_id || !action) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from('property_likes')
    .insert({
      property_id,
      tenant_id: user.id, // ✅ UUID REAL
      action,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
