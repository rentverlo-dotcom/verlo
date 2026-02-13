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

  // 5️⃣ Insert protegido por RLS (LIKE)
  const { error: likeError } = await supabase
    .from('property_likes')
    .insert({
      property_id,
      tenant_id: user.id,
      action: 'like',
    })

  if (likeError) {
    return NextResponse.json({ error: likeError.message }, { status: 500 })
  }

  // 6️⃣ Buscar demanda más reciente del tenant
  const { data: demand, error: demandError } = await supabase
    .from('demands')
    .select('id')
    .eq('tenant_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (demandError || !demand) {
    return NextResponse.json(
      { error: 'tenant has no active demand' },
      { status: 400 }
    )
  }

  // 7️⃣ Crear match si no existe
  const { error: matchError } = await supabase
    .from('matches')
    .insert({
      property_id,
      demand_id: demand.id,
      status: 'pending',
      created_by: 'system',
    })

  // Si falla por unique (ya existe), lo ignoramos
  if (matchError && !matchError.message.includes('duplicate')) {
    return NextResponse.json({ error: matchError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
