import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function clean(value: unknown) {
  return String(value || "").trim()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function verifyTurnstile(token: string, ip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    return false
  }

  const formData = new FormData()
  formData.append("secret", secret)
  formData.append("response", token)

  if (ip) {
    formData.append("remoteip", ip)
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  })

  const data = await res.json().catch(() => null)

  return Boolean(data?.success)
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

    const body = await req.json()

    const full_name = clean(body.full_name)
    const email = clean(body.email).toLowerCase()
    const phone = clean(body.phone)
    const role = clean(body.role)
    const need = clean(body.need)
    const turnstile_token = clean(body.turnstile_token)

    if (!turnstile_token) {
      return NextResponse.json(
        { ok: false, error: "Falta validar seguridad" },
        { status: 400 }
      )
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      null

    const captchaOk = await verifyTurnstile(turnstile_token, ip)

    if (!captchaOk) {
      return NextResponse.json(
        { ok: false, error: "Validación de seguridad inválida" },
        { status: 403 }
      )
    }

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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { error } = await supabaseAdmin.from("waitlist_leads").insert({
      full_name,
      email,
      phone,
      role,
      need,
      source: "home",
    })

    if (error) {
      return NextResponse.json(
        { ok: false, error: "No pudimos guardar el lead" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Error inesperado" },
      { status: 500 }
    )
  }
}
