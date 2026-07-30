import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendMetaCapiLead } from "@/lib/meta/capi"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "")
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 15
}

function getLeadTags(data: {
  role: string
  intent: string
  availability_status?: string | null
  move_timing?: string | null
  renewal_role?: string | null
}) {
  const tags = new Set<string>()

  tags.add("verlo_lead")
  tags.add("verlo_test_captacion")

  if (data.role === "owner") tags.add("verlo_owner")
  if (data.role === "tenant") tags.add("verlo_tenant")
  if (data.role === "both") {
    tags.add("verlo_owner")
    tags.add("verlo_tenant")
  }

  if (data.intent === "owner_new_listing") tags.add("verlo_owner_new_listing")
  if (data.intent === "tenant_search") tags.add("verlo_tenant_search")
  if (data.intent === "contract_renewal") tags.add("verlo_contract_renewal")

  if (data.availability_status === "Disponible ahora") tags.add("owner_available_now")
  if (data.availability_status === "Disponible pronto") tags.add("owner_available_soon")
  if (data.availability_status === "Estoy evaluando alquilar") tags.add("owner_evaluating")

  if (data.move_timing === "Estoy buscando ahora") tags.add("tenant_searching_now")
  if (data.move_timing === "Me quiero mudar en 1-3 meses") tags.add("tenant_move_1_3_months")
  if (data.move_timing === "Solo quiero enterarme de novedades") tags.add("tenant_news_only")

  if (data.intent === "contract_renewal" && data.renewal_role === "owner") tags.add("renewal_owner")
  if (data.intent === "contract_renewal" && data.renewal_role === "tenant") tags.add("renewal_tenant")

  return Array.from(tags)
}

async function sendToGhlWebhook(payload: Record<string, unknown>) {
  const webhookUrl = process.env.GHL_LEAD_WEBHOOK_URL

  if (!webhookUrl) {
    return {
      ok: false,
      skipped: true,
      error: "Falta GHL_LEAD_WEBHOOK_URL",
    }
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return {
        ok: false,
        skipped: false,
        error: `GHL ${res.status}: ${text}`,
      }
    }

    return {
      ok: true,
      skipped: false,
      error: null,
    }
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      error: err instanceof Error ? err.message : "Error enviando a GHL",
    }
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "ghl-lead-webhook",
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
    const phone = normalizePhone(clean(body.phone))
    const role = clean(body.role)
    const intent = clean(body.intent)

    const zone = clean(body.zone) || null
    const property_type = clean(body.property_type) || null
    const availability_status = clean(body.availability_status) || null
    const approx_price = clean(body.approx_price) || null

    const desired_property_type = clean(body.desired_property_type) || null
    const budget_range = clean(body.budget_range) || null
    const move_timing = clean(body.move_timing) || null

    const renewal_role = clean(body.renewal_role) || null
    const contract_expiration = clean(body.contract_expiration) || null
    const other_party_status = clean(body.other_party_status) || null
    const renewal_need = clean(body.renewal_need) || null

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

    const tags = getLeadTags({
      role,
      intent,
      availability_status,
      move_timing,
      renewal_role,
    })

    const leadPayload = {
      full_name,
      email,
      phone,
      role,
      intent,
      zone,
      property_type,
      availability_status,
      approx_price,
      desired_property_type,
      budget_range,
      move_timing,
      renewal_role,
      contract_expiration,
      other_party_status,
      renewal_need,
      source: "test_captacion",
      tags,
      metadata: body.metadata || null,
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
      zone,
      property_type,
      availability_status,
      approx_price,
      desired_property_type,
      budget_range,
      move_timing,
      renewal_role,
      contract_expiration,
      other_party_status,
      renewal_need,
      source: "test_captacion",
      metadata: {
        ...(body.metadata || {}),
        tags,
      },
    })

    if (error) {
      console.error("ghl lead webhook insert error:", error)

      return NextResponse.json(
        { ok: false, error: "No pudimos guardar tus datos" },
        { status: 500 }
      )
    }

    const ghl = await sendToGhlWebhook(leadPayload)

    if (!ghl.ok) {
      console.error("ghl webhook error:", ghl.error)
    }

    return NextResponse.json({
      ok: true,
      ghl,
      tags,
    })
  } catch (err) {
    console.error("ghl lead webhook api error:", err)

    return NextResponse.json(
      { ok: false, error: "Error inesperado" },
      { status: 500 }
    )
  }
}
