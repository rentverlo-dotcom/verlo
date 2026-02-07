import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { property_id, action } = await req.json()

  if (!property_id || action !== 'like') {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
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


