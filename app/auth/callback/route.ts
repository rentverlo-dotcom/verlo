import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await supabase.auth.exchangeCodeForSession(code)
  }

  // 🔁 SI HABÍA FORM PENDIENTE → VOLVEMOS A PUBLICAR
  const redirectTo =
    url.searchParams.get('redirect') ?? '/propietario/publicar'

  return NextResponse.redirect(new URL(redirectTo, request.url))
}
