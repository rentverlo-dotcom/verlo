import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const matchId = params.id

  if (!matchId) {
    return NextResponse.json({ error: 'match id required' }, { status: 400 })
  }

  // Crear o actualizar aprobación
  const { error } = await supabase
    .from('match_guarantee_reviews')
    .upsert(
      {
        match_id: matchId,
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      },
      { onConflict: 'match_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
