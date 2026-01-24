import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const tenant_id = '00000000-0000-0000-0000-000000000001' // mock por ahora

  const { data, error } = await supabaseAdmin
    .from('property_likes')
    .select(`
      property_id,
      properties (
        id,
        title,
        short_description,
        address,
        price,
        cover_url
      )
    `)
    .eq('tenant_id', tenant_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const properties = data.map((row) => row.properties)

  return NextResponse.json(properties)
}
