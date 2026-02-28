import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json()

    if (!user_id) {
      return NextResponse.json({ error: 'missing user_id' }, { status: 400 })
    }

    // 🔐 1. Crear proceso en Truora
    const truoraRes = await fetch(
      'https://api.truora.com/v1/identity-verifications',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TRUORA_API_KEY}`,
        },
        body: JSON.stringify({
          type: 'document-validation',
          metadata: {
            user_id,
          },
        }),
      }
    )

    const truoraData = await truoraRes.json()

    if (!truoraRes.ok) {
      return NextResponse.json(
        { error: truoraData },
        { status: 500 }
      )
    }

    // 🧠 2. Guardar registro en DB
    await supabase.from('identity_verifications').insert({
      subject_type: 'user',
      subject_id: user_id,
      provider: 'truora',
      status: 'pending',
      metadata: truoraData,
    })

    // 🔁 3. Devolver URL para redirigir
    return NextResponse.json({
      verification_url: truoraData.verification_url,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
