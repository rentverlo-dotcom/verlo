import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANTE
)

export async function GET() {
  // 1️⃣ Incrementar sesiones
  const { data: sessionData } = await supabase
    .rpc('increment_session')

  // 2️⃣ Obtener valor actual
  const { data } = await supabase
    .from('site_stats')
    .select('value')
    .eq('key', 'properties_count')
    .single()

  return NextResponse.json({ count: data?.value })
}

