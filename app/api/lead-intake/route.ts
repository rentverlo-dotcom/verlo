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

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "")
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 15
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
    const phone = normalizePhone(clean(body.phone))
    const role = clean(body.role)
    const intent = clean(body.intent)

    if (full_name.length < 3) {
      return NextResponse.json(
        { ok: false, error: "Ingresá tu nombre" },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Ingresá un email válido" },
        { status: 400 }
      )
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { ok: false, error: "Ingresá un WhatsApp válido" },
        { status: 400 }
      )
    }

    if (!["owner", "tenant", "both"].includes(role)) {
      return NextResponse.json(
        { ok: false, error: "Rol inválido" },
        { status: 400 }
      )
    }

    if (!["owner_new_listing", "tenant_search", "contract_renewal"].includes(intent)) {
      return NextResponse.json(
        { ok: false, error: "Intención inválida" },
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { error } = await supabaseAdmin.from("lead_intake").insert({
      full_name,
      email,
      phone,
      role,
      intent,

      zone: clean(body.zone) || null,
      property_type: clean(body.property_type) || null,
      availability_status: clean(body.availability_status) || null,
      approx_price: clean(body.approx_price) || null,

      desired_property_type: clean(body.desired_property_type) || null,
      budget_range: clean(body.budget_range) || null,
      move_timing: clean(body.move_timing) || null,

      renewal_role: clean(body.renewal_role) || null,
      contract_expiration: clean(body.contract_expiration) || null,
      other_party_status: clean(body.other_party_status) || null,
      renewal_need: clean(body.renewal_need) || null,

      source: "test_captacion",
      metadata: body.metadata || null,
    })

    if (error) {
      console.error("lead_intake insert error:", error)

      return NextResponse.json(
        { ok: false, error: "No pudimos guardar tus datos" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("lead_intake api error:", err)

    return NextResponse.json(
      { ok: false, error: "Error inesperado" },
      { status: 500 }
    )
  }
}
