import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  const { property_id, demand_id } = body

  if (!property_id || !demand_id) {
    return NextResponse.json(
      { error: 'property_id and demand_id required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('matches')
    .insert({
      property_id,
      demand_id,
      status: 'pending',
      created_by: 'system',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ match: data })
}
