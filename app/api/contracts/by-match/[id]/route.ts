import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1️⃣ Obtener usuario desde Authorization header
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2️⃣ Buscar contrato por match_id
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('match_id', params.matchId)
    .single()

  if (error || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  // 3️⃣ Autorizar acceso (tenant u owner)
  if (user.id !== contract.tenant_id && user.id !== contract.owner_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4️⃣ OK
  return NextResponse.json({ contract })
}
