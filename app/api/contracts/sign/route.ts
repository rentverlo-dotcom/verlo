import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    data: { user },
  } = await anonClient.auth.getUser(token)

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { contract_id, signature } = await req.json()

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contract_id)
    .single()

  if (!contract) {
    return NextResponse.json({ error: 'contract not found' }, { status: 404 })
  }

  // Generar hash del contrato
  const hash = crypto
    .createHash('sha256')
    .update(contract.content || '')
    .digest('hex')

  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  let updateData: any = {
    contract_hash: hash,
  }

  if (user.id === contract.tenant_id) {
    updateData.tenant_signature = signature
    updateData.tenant_signed_ip = ip
    updateData.tenant_signed_user_agent = userAgent
  }

  if (user.id === contract.owner_id) {
    updateData.owner_signature = signature
    updateData.owner_signed_ip = ip
    updateData.owner_signed_user_agent = userAgent
  }

  const bothSigned =
    (contract.tenant_signature || user.id === contract.tenant_id) &&
    (contract.owner_signature || user.id === contract.owner_id)

  if (bothSigned) {
    updateData.status = 'signed'
    updateData.signed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('contracts')
    .update(updateData)
    .eq('id', contract_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
