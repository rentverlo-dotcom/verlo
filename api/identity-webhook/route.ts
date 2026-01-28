import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const payload = await req.json()

  const {
    verification_id,
    status, // approved | rejected | inconclusive
    raw,
  } = payload

  const mappedStatus =
    status === 'approved'
      ? 'verified'
      : status === 'rejected'
      ? 'failed'
      : 'failed'

  await supabaseAdmin
    .from('identity_verifications')
    .update({
      status: mappedStatus,
      verified_at: mappedStatus === 'verified' ? new Date().toISOString() : null,
      metadata: raw,
    })
    .eq('id', verification_id)

  return NextResponse.json({ ok: true })
}
