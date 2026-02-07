import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  const { property_id, action } = await req.json()

  if (!property_id || action !== 'like') {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  // 🔐 usuario desde sesión (AUTH REAL, SIN INVENTAR IDS)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { error } = await supabase.from('property_likes').insert({
    property_id,
    tenant_id: user.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

