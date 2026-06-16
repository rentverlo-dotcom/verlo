import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function clean(value: unknown) {
  return String(value || "").trim()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server env vars")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/waitlist",
    message: "Use POST",
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await req.json()

    const full_name = clean(body.full_name)
    const email = clean(body.email).toLowerCase()
    const phone = clean(body.phone)
    const role = clean(body.role)
    const need = clean(body.need)

    if (!full_name || full_name.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Nombre inválido" },
        { status: 400 }
      )
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Email inválido" },
        { status: 400 }
      )
    }

    if (!phone || phone.length < 6) {
      return NextResponse.json(
        { ok: false, error: "WhatsApp inválido" },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.from("waitlist_leads").insert({
      full_name,
      email,
      phone,
      role,
      need,
      source: "pagedeprueba",
    })

    if (error) {
      console.error("waitlist insert error:", error)

      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("waitlist api error:", err)

    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Error inesperado",
      },
      { status: 500 }
    )
  }
}
