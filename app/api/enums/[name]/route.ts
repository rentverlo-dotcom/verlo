// app/api/enums/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const { data, error } = await supabaseAdmin.rpc('get_enums')

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'enum_error' }, { status: 500 })
  }

  return NextResponse.json(data)
}

