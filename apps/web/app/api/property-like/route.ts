// app/api/property-like/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json()

  const { tenant_id, property_id, match_id } = body

  if (!tenant_id || !property_id) {
    return NextResponse.json({ error: 'missing data' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('property_likes')
    .insert({
      tenant_id,
      property_id,
      match_id: match_id ?? null,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
