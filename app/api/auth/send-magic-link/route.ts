import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Faltan variables de Supabase" },
        { status: 500 }
      )
    }

    const body = await req.json()

    const email = clean(body.email).toLowerCase()
    const full_name = clean(body.full_name)
    const phone = clean(body.phone)
    const role = clean(body.role)
    const intent = clean(body.intent)
    const zone = clean(body.zone)
    const lead_id = clean(body.lead_id)

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Email inválido" },
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const auth = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "https://verlo.lat/auth/callback",
        data: {
          full_name,
          phone,
          role,
          intent,
          zone,
          source: "test_captacion",
          lead_id: lead_id || null,
        },
      },
    })

    if (auth.error) {
      console.error("send magic link error:", auth.error)

      return NextResponse.json(
        { ok: false, error: auth.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      email,
    })
  } catch (err) {
    console.error("send magic link api error:", err)

    return NextResponse.json(
      { ok: false, error: "Error inesperado" },
      { status: 500 }
    )
  }
}
