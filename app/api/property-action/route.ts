import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const cookieStore = cookies()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Cookie: cookieStore
            .getAll()
            .map(c => `${c.name}=${c.value}`)
            .join('; '),
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { property_id, action } = await req.json()

  if (!property_id || action !== 'like') {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const { error } = await supabase
    .from('property_likes')
    .insert({
      property_id,
      tenant_id: user.id,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
