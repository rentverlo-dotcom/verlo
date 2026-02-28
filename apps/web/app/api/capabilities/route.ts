import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const [{ data: properties }, { data: demands }] = await Promise.all([
    supabase.from('properties').select('id').eq('owner_id', userId).limit(1),
    supabase.from('demands').select('id').eq('tenant_id', userId).limit(1),
  ])

  return NextResponse.json({
    isOwner: !!properties?.length,
    isTenant: !!demands?.length,
  })
}
