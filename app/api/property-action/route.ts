import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { property_id, tenant_id } = await req.json()

  if (!property_id || !tenant_id) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('property_likes')
    .insert({
      property_id,
      tenant_id,
      action: 'like',
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
