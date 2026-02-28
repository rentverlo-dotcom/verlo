import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 🔐 IMPORTANTE:
    // Acá vamos a validar signature de Truora cuando nos pasen la doc oficial
    console.log('Truora webhook received:', body)

    const { contract_id, status, signature_hash } = body

    if (status === 'signed') {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          contract_hash: signature_hash ?? null,
        })
        .eq('id', contract_id)

      if (error) {
        console.error(error)
        return NextResponse.json({ error: 'db error' }, { status: 500 })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }
}
