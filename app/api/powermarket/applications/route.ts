
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Missing Supabase configuration")
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function authorize(request: NextRequest) {
  const authorization =
    request.headers.get("authorization") || ""

  if (!authorization.startsWith("Bearer ")) {
    return null
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) return null

  const session = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await session.auth.getUser(
    authorization.slice(7).trim()
  )

  if (error || !data.user) return null

  const db = admin()

  const { data: partner, error: partnerError } =
    await db
      .from("caucion_partner_users")
      .select("user_id,active,partner")
      .eq("user_id", data.user.id)
      .eq("partner", "powermarket")
      .maybeSingle()

  if (partnerError || !partner?.active) {
    return null
  }

  return {
    db,
    userId: data.user.id,
  }
}

type VerificationRow = {
  lead_id: string
  document_number: string | null
  status: string | null
}

type TenantLead = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

type ApplicationRow = {
  id: string
  tenant_lead_id: string
  status: string
  requested_rent_ars: number
  estimated_expenses_ars: number
  duration_months: number
  monthly_income_ars: number
  employment_type: string
  has_co_tenant: boolean
  co_tenant_income_ars: number | null
  approved_max_total_ars: number | null
  approved_max_rent_ars: number | null
  decision_expires_at: string | null
  created_at: string
  submitted_at: string | null
  decided_at: string | null
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await authorize(request)

    if (!ctx) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    const { data, error } = await ctx.db
      .from("caucion_applications")
      .select(
        [
          "id",
          "tenant_lead_id",
          "status",
          "requested_rent_ars",
          "estimated_expenses_ars",
          "duration_months",
          "monthly_income_ars",
          "employment_type",
          "has_co_tenant",
          "co_tenant_income_ars",
          "approved_max_total_ars",
          "approved_max_rent_ars",
          "decision_expires_at",
          "created_at",
          "submitted_at",
          "decided_at",
        ].join(",")
      )
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error

    const applications = (data || []) as unknown as ApplicationRow[]

    // Recuperar la identidad y contacto de cada interesado.
  const leadIds = Array.from(
  new Set<string>(
    applications.map((row) => row.tenant_lead_id)
  )
)

    let leads: TenantLead[] = []

    if (leadIds.length > 0) {
      const { data: leadData, error: leadError } =
        await ctx.db
          .from("lead_intake")
          .select("id,full_name,email,phone")
          .in("id", leadIds)

      if (leadError) throw leadError

      leads = (leadData || []) as TenantLead[]
    }

    const leadsById = new Map<string, TenantLead>(
      leads.map((lead) => [lead.id, lead])
    )

    // The product choice is stored in the existing caucion event; no schema change.
    const applicationIds = applications.map((application) => application.id)
    const choiceByApplication = new Map<string, "solo_caucion" | "caucion_con_contrato">()
    if (applicationIds.length > 0) {
      const { data: submissionEvents, error: eventError } = await ctx.db
        .from("caucion_events")
        .select("application_id,payload")
        .eq("event_type", "application_submitted")
        .in("application_id", applicationIds)
        .limit(100)
      if (eventError) throw eventError
      for (const event of submissionEvents || []) {
        const choice = event?.payload?.simulator_choice
        if (choice === "solo_caucion" || choice === "caucion_con_contrato") {
          choiceByApplication.set(event.application_id, choice)
        }
      }
    }

    // Existing verification identity is linked through the tenant lead.
    // Only authorized partner accounts reach this query; no identity data is exposed publicly.
    const identityByLead = new Map<string, { dni: string | null; status: string | null }>()
    if (leadIds.length > 0) {
      const { data: verifications, error: verificationError } = await ctx.db
        .from("tenant_verifications")
        .select("lead_id,document_number,status")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false })
        .limit(300)
      if (verificationError) {
        console.error("Partner applicant identity lookup failed", verificationError)
      } else {
        for (const row of (verifications || []) as VerificationRow[]) {
          if (!identityByLead.has(row.lead_id)) {
            identityByLead.set(row.lead_id, {
              dni: row.document_number?.trim() || null,
              status: row.status || null,
            })
          }
        }
      }
    }

    const results = applications.map((application) => ({
      identity: {
        dni: identityByLead.get(application.tenant_lead_id)?.dni || null,
        verification_status: identityByLead.get(application.tenant_lead_id)?.status || "not_available",
        cuit_cuil: null as string | null,
      },
      simulator_choice: choiceByApplication.get(application.id) || null,
      ...application,
      tenant:
        leadsById.get(application.tenant_lead_id) || null,
    }))

    return NextResponse.json(
      {
        ok: true,
        applications: results,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    console.error("PowerMarket GET failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron consultar solicitudes",
      },
      { status: 500 }
    )
  }
}

const ALLOWED_STATUSES = [
  "under_review",
  "more_info_required",
  "prequalified",
  "not_eligible",
  "alternative_offered",
] as const

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await authorize(request)

    if (!ctx) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => null)

    const id =
      typeof body?.id === "string" ? body.id : ""

    const status =
      typeof body?.status === "string" ? body.status : ""

    if (
      !/^[0-9a-f-]{36}$/i.test(id) ||
      !ALLOWED_STATUSES.includes(
        status as (typeof ALLOWED_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Solicitud o estado inválido",
        },
        { status: 400 }
      )
    }

    const { data: current, error: readError } =
      await ctx.db
        .from("caucion_applications")
        .select(
          "id,status,approved_max_total_ars,approved_max_rent_ars"
        )
        .eq("id", id)
        .single()

    if (readError || !current) {
      return NextResponse.json(
        {
          ok: false,
          error: "Solicitud inexistente",
        },
        { status: 404 }
      )
    }

    const editableStatuses = [
      "submitted",
      "under_review",
      "more_info_required",
      "prequalified",
      "alternative_offered",
      "not_eligible",
    ]

    if (!editableStatuses.includes(current.status)) {
      return NextResponse.json(
        {
          ok: false,
          error: "La solicitud no admite cambios",
        },
        { status: 409 }
      )
    }

    const amount =
      body?.approved_max_total_ars === "" ||
      body?.approved_max_total_ars == null
        ? null
        : Number(body.approved_max_total_ars)

    const rent =
      body?.approved_max_rent_ars === "" ||
      body?.approved_max_rent_ars == null
        ? null
        : Number(body.approved_max_rent_ars)

    if (
      [amount, rent].some(
        (value) =>
          value !== null &&
          (!Number.isFinite(value) || value < 0)
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Montos inválidos",
        },
        { status: 400 }
      )
    }

    const isApproval =
      status === "prequalified" ||
      status === "alternative_offered"

    if (
      isApproval &&
      amount === null &&
      rent === null
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Indicá un límite aprobado",
        },
        { status: 400 }
      )
    }

    const note = String(body?.note || "")
      .slice(0, 1500)
      .trim()

    // One Postgres transaction: status update and audit event cannot diverge.
    const { data: changed, error: decisionError } = await ctx.db.rpc(
      "caucion_record_partner_decision",
      {
        p_application_id: id,
        p_expected_status: current.status,
        p_new_status: status,
        p_actor_user_id: ctx.userId,
        p_approved_max_total_ars: isApproval ? amount : null,
        p_approved_max_rent_ars: isApproval ? rent : null,
        p_note: note,
      }
    )

    if (decisionError) {
      if (decisionError.code === "42883" || decisionError.code === "PGRST202") {
        return NextResponse.json(
          { ok: false, error: "Auditoría transaccional no instalada. La decisión no fue guardada." },
          { status: 503 }
        )
      }
      if (decisionError.code === "40001") {
        return NextResponse.json(
          { ok: false, error: "Otro operador modificó la solicitud. Actualizá la página." },
          { status: 409 }
        )
      }
      console.error("PowerMarket atomic decision failed:", decisionError)
      return NextResponse.json(
        { ok: false, error: "No se pudo guardar la decisión y su auditoría." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      application: changed,
    })
  } catch (error) {
    console.error("PowerMarket PATCH failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo guardar la decisión",
      },
      { status: 500 }
    )
  }
}

