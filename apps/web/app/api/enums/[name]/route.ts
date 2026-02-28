import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  _: Request,
  { params }: { params: { name: string } }
) {
  const { name } = params

  if (!['property_type', 'contract_duration'].includes(name)) {
    return NextResponse.json({ error: 'Invalid enum' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('enum_values', {
    enum_name: name,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
