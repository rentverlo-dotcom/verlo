import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Truora normalmente envía:
    // {
    //   "event": "verification.completed",
    //   "data": {
    //      "verification_id": "...",
    //      "status": "approved",
    //      "metadata": { "user_id": "uuid" }
    //   }
    // }

    const event = body.event
    const verification = body.data

    if (event !== 'verification.completed') {
      return NextResponse.json({ ignored: true })
    }

    const userId = verification?.metadata?.user_id
    const status = verification?.status

    if (!userId) {
      return NextResponse.json(
        { error: 'missing user_id' },
        { status: 400 }
      )
    }

    if (status === 'approved') {
      const { error } = await supabase
        .from('identity_verifications')
        .upsert({
          subject_type: 'user',
          subject_id: userId,
          status: 'verified',
          verified_at: new Date().toISOString(),
        }, { onConflict: 'subject_id' })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
    }

    if (status === 'rejected') {
      await supabase
        .from('identity_verifications')
        .upsert({
          subject_type: 'user',
          subject_id: userId,
          status: 'rejected',
        }, { onConflict: 'subject_id' })
    }

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
