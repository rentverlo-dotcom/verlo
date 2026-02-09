import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
  } = await supabase.auth.getUser(token)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('match_id', params.id)
    .single()

  if (!contract) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (
    contract.tenant_id !== user.id &&
    contract.owner_id !== user.id
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ contract })
}
