import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function clean(value: unknown) {
  return String(value || "").trim()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/verlo-waitlist",
  })
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

    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.replace("Bearer ", "").trim()

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Falta confirmar el email" },
        { status: 401 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user?.email) {
      return NextResponse.json(
        { ok: false, error: "Email no verificado" },
        { status: 401 }
      )
    }

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

    if (clean(user.email).toLowerCase() !== email) {
      return NextResponse.json(
        { ok: false, error: "El email confirmado no coincide" },
        { status: 403 }
      )
    }

    if (!phone || phone.length < 6) {
      return NextResponse.json(
        { ok: false, error: "WhatsApp inválido" },
        { status: 400 }
      )
    }

    if (!role) {
      return NextResponse.json(
        { ok: false, error: "Perfil inválido" },
        { status: 400 }
      )
    }

    if (!need) {
      return NextResponse.json(
        { ok: false, error: "Necesidad inválida" },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.from("waitlist_leads").insert({
      full_name,
      email,
      phone,
      role,
      need,
      source: "home_magic_link",
    })

    if (error) {
      return NextResponse.json(
        { ok: false, error: "No pudimos guardar el lead" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("verlo waitlist api error:", err)

    return NextResponse.json(
      { ok: false, error: "Error inesperado" },
      { status: 500 }
    )
  }
}
