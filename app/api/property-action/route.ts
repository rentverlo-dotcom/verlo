import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  // 1️⃣ Leer Authorization header
  const authHeader = req.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')

  // 2️⃣ Cliente Supabase con ANON KEY (correcto)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  // 3️⃣ Validar usuario usando EL TOKEN
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 4️⃣ Leer payload
  const { property_id, action } = await req.json()

  if (!property_id || action !== 'like') {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  // 5️⃣ Insert protegido por RLS
  const { error } = await supabase
    .from('property_likes')
    .insert({
      property_id,
      tenant_id: user.id,
      action: 'like',
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
