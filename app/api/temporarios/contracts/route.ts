
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHash } from "node:crypto"
import { authorizeTemporaryWrite } from "@/lib/temporarios/write-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const reply = (status: number, value: object) =>
  NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  })

const hash = (text: string) =>
  createHash("sha256").update(text, "utf8").digest("hex")

type Party = {
  fullName: string
  document: string
  address: string
}

function party(v: unknown): Party | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null

  const o = v as Record<string, unknown>

  const fullName = String(o.fullName || "").trim()
  const document = String(o.document || "").trim()
  const address = String(o.address || "").trim()

  if (
    fullName.length < 5 ||
    fullName.length > 140 ||
    document.length < 6 ||
    document.length > 30 ||
    address.length < 8 ||
    address.length > 230
  ) return null

  return { fullName, document, address }
}

async function context(request: Request, matchId: string) {
  const auth = await authorizeTemporaryWrite(request, "owner")

  if ("status" in auth) {
    return {
      error: reply(auth.status, {
        ok: false,
        error: auth.error,
      }),
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return {
      error: reply(503, {
        ok: false,
        error: "Servicio no disponible",
      }),
    }
  }

  const db = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const m = await db
    .from("temporary_matches")
    .select(
      "id,status,check_in,check_out,agreed_total_ars,property_id,demand_id,temporary_properties!inner(owner_user_id,locality_label,title,public_location_reference,max_guests),temporary_demands!inner(tenant_user_id)"
    )
    .eq("id", matchId)
    .maybeSingle()

  if (m.error || !m.data) {
    return {
      error: reply(404, {
        ok: false,
        error: "Coincidencia no encontrada",
      }),
    }
  }

  const match = m.data

  const prop = Array.isArray(match.temporary_properties)
    ? match.temporary_properties[0]
    : match.temporary_properties

  const demand = Array.isArray(match.temporary_demands)
    ? match.temporary_demands[0]
    : match.temporary_demands

  const ownerId = (prop as { owner_user_id: string }).owner_user_id
  const tenantId = (demand as { tenant_user_id: string }).tenant_user_id

  if (auth.userId !== ownerId && auth.userId !== tenantId) {
    return {
      error: reply(403, {
        ok: false,
        error: "Sin acceso a este expediente",
      }),
    }
  }

  const role = auth.userId === ownerId ? "owner" : "tenant"

  const res = await db
    .from("temporary_reservations")
    .select("id,status,agreed_terms_owner_at,agreed_terms_tenant_at")
    .eq("match_id", matchId)
    .maybeSingle()

  if (res.error) {
    return {
      error: reply(503, {
        ok: false,
        error: "No se pudo consultar la reserva",
      }),
    }
  }

  if (!res.data) {
    return {
      error: reply(409, {
        ok: false,
        error: "Primero iniciá la reserva",
      }),
    }
  }

  return {
    db,
    match,
    prop: prop as {
      title: string | null
      locality_label: string
      public_location_reference: string | null
      max_guests: number | null
    },
    reservation: res.data,
    role,
    userId: auth.userId,
    ownerId,
    tenantId,
  }
}

export async function GET(request: Request) {
  const matchId = new URL(request.url).searchParams.get("matchId") || ""

  if (!valid.test(matchId)) {
    return reply(400, {
      ok: false,
      error: "Coincidencia inválida",
    })
  }

  const c = await context(request, matchId)
  if ("error" in c) return c.error

  const r = await c.db
    .from("temporary_contracts")
    .select(
      "id,status,version,document_text,document_sha256,ready_at,owner_agreed_at,tenant_agreed_at,legal_data"
    )
    .eq("reservation_id", c.reservation.id)
    .maybeSingle()

  if (r.error) {
    return reply(503, {
      ok: false,
      error: "El esquema de contratos todavía no está disponible",
    })
  }

  return reply(200, {
    ok: true,
    role: c.role,
    contract: r.data,
    reservationStatus: c.reservation.status,
  })
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 4096) {
    return reply(413, {
      ok: false,
      error: "Solicitud demasiado grande",
    })
  }

  let body: {
    matchId?: unknown
    action?: unknown
    owner?: unknown
    tenant?: unknown
    houseRules?: unknown
  }

  try {
    body = await request.json()
  } catch {
    return reply(400, {
      ok: false,
      error: "Solicitud inválida",
    })
  }

  if (typeof body?.matchId !== "string" || !valid.test(body.matchId)) {
    return reply(400, {
      ok: false,
      error: "Coincidencia inválida",
    })
  }

  const c = await context(request, body.matchId)
  if ("error" in c) return c.error

  const r = c.reservation

  if (!r.agreed_terms_owner_at || !r.agreed_terms_tenant_at) {
    return reply(409, {
      ok: false,
      error: "Primero deben aceptar las condiciones de la estadía",
    })
  }

  if (
    !["fee_paid", "deposit_pending", "ready_to_block", "confirmed"].includes(
      r.status
    )
  ) {
    return reply(409, {
      ok: false,
      error: "El pago del servicio contractual todavía no está acreditado",
    })
  }

  const lookup = await c.db
    .from("temporary_contracts")
    .select("*")
    .eq("reservation_id", r.id)
    .maybeSingle()

  if (lookup.error) {
    return reply(503, {
      ok: false,
      error: "Falta habilitar las tablas de contratos en Supabase",
    })
  }

  const current = lookup.data

  // GENERACIÓN DEL DOCUMENTO

  if (body.action === "generate") {
    if (c.role !== "owner") {
      return reply(403, {
        ok: false,
        error: "La persona propietaria prepara el contrato",
      })
    }

    if (current?.status === "ready" || current?.status === "agreed") {
      return reply(409, {
        ok: false,
        error: "El documento ya fue emitido; no se puede modificar",
      })
    }

    const owner = party(body.owner)
    const tenant = party(body.tenant)

    if (!owner || !tenant) {
      return reply(400, {
        ok: false,
        error: "Completá los nombres, documentos y domicilios de ambas partes",
      })
    }

    const rules = String(body.houseRules || "").trim()

    if (rules.length > 1000) {
      return reply(400, {
        ok: false,
        error: "Condiciones demasiado extensas",
      })
    }

    const start = Date.parse(c.match.check_in + "T00:00:00Z")
    const end = Date.parse(c.match.check_out + "T00:00:00Z")
    const nights = Math.round((end - start) / 86400000)

    if (!Number.isInteger(nights) || nights < 1 || nights > 90) {
      return reply(409, {
        ok: false,
        error: "Fechas inválidas",
      })
    }

    const text = [
      "VERLO | ACUERDO DE ESTADÍA TEMPORARIA",
      "Versión 1. Expediente de reserva " + r.id,
      "Propietario/a: " + owner.fullName +
        " | Documento: " + owner.document +
        " | Domicilio: " + owner.address,
      "Huésped contratante: " + tenant.fullName +
        " | Documento: " + tenant.document +
        " | Domicilio: " + tenant.address,
      "Alojamiento: " + (c.prop.title || "Alojamiento temporario") +
        " | Localidad: " + c.prop.locality_label +
        " | Referencia: " +
        (c.prop.public_location_reference || "No informada"),
      "Ingreso: " + c.match.check_in +
        " | Egreso: " + c.match.check_out +
        " | Noches: " + nights,
      "Precio total pactado entre las partes: ARS " +
        Number(c.match.agreed_total_ars).toFixed(2),
      "Capacidad máxima publicada: " +
        (c.prop.max_guests ?? "No especificada"),
      "Condiciones particulares: " + (rules || "No declaradas"),
      "El pago del alojamiento y cualquier depósito acordado se realizan directamente entre las partes, fuera de VERLO.",
      "El servicio contractual de VERLO es independiente del precio de la estadía.",
      "La aceptación individual de este documento registra consentimiento sobre esta versión exacta.",
      "Este documento no acredita por sí mismo el bloqueo definitivo del calendario.",
    ].join("\n\n")

    const docHash = hash(text)

    const payload = {
      reservation_id: r.id,
      check_in: c.match.check_in,
      check_out: c.match.check_out,
      total_price_ars: c.match.agreed_total_ars,
      contract_content: text,
      status: "ready",
      version: 1,
      document_text: text,
      document_sha256: docHash,
      legal_data: {
        owner,
        tenant,
        houseRules: rules,
      },
      ready_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (current) {
      return reply(409, {
        ok: false,
        error: "Ya existe un expediente: no se sobrescribirá automáticamente",
      })
    }

    const created = await c.db
      .from("temporary_contracts")
      .insert(payload)
      .select("id")
      .single()

    if (created.error) {
      return reply(409, {
        ok: false,
        error: "No se pudo emitir el contrato; verificá si ya existe",
      })
    }

    return reply(200, {
      ok: true,
      contractId: created.data.id,
      status: "ready",
    })
  }

  // ACEPTACIÓN DEL CONTRATO
  // Recupera aceptaciones previamente guardadas.
  // No vuelve a insertar evidencia existente.

  if (body.action === "accept") {
    if (
      !current ||
      !["ready", "agreed"].includes(current.status) ||
      !current.document_sha256 ||
      !current.document_text
    ) {
      return reply(409, {
        ok: false,
        error: "El contrato no está listo",
      })
    }

    if (hash(current.document_text) !== current.document_sha256) {
      return reply(409, {
        ok: false,
        error: "La integridad del documento no coincide",
      })
    }

    const field =
      c.role === "owner" ? "owner_agreed_at" : "tenant_agreed_at"

    // Consultar evidencia antes de insertar una aceptación.
    const existing = await c.db
      .from("temporary_contract_acceptances")
      .select("id,actor_user_id,accepted_at,document_sha256")
      .eq("contract_id", current.id)
      .eq("document_version", current.version)
      .eq("role", c.role)

    if (existing.error) {
      return reply(503, {
        ok: false,
        error: "No se pudieron consultar las aceptaciones",
      })
    }

    if ((existing.data?.length || 0) > 1) {
      return reply(409, {
        ok: false,
        error: "Hay aceptaciones duplicadas; requiere revisión",
      })
    }

    let accepted = existing.data?.[0]

    if (
      accepted &&
      (
        accepted.actor_user_id !== c.userId ||
        accepted.document_sha256 !== current.document_sha256
      )
    ) {
      return reply(409, {
        ok: false,
        error: "La aceptación existente no corresponde al usuario o documento",
      })
    }

    if (!accepted && current[field]) {
      return reply(409, {
        ok: false,
        error: "El estado del contrato requiere revisión de evidencia",
      })
    }

    // Insertar únicamente cuando no existe evidencia.
    if (!accepted) {
      const ip = (request.headers.get("x-forwarded-for") || "")
        .split(",")[0]
        .trim()

      const ua = (request.headers.get("user-agent") || "")
        .slice(0, 500)

      const inserted = await c.db
        .from("temporary_contract_acceptances")
        .insert({
          contract_id: current.id,
          document_sha256: current.document_sha256,
          document_version: current.version,
          actor_user_id: c.userId,
          role: c.role,
          ip_address: ip || null,
          user_agent: ua,
          consent_text:
            "Leí y acepto el contrato de estadía temporaria, versión " +
            current.version,
        })
        .select("id,actor_user_id,accepted_at,document_sha256")
        .single()

      if (inserted.error) {
        return reply(409, {
          ok: false,
          error: "No se pudo registrar la aceptación o ya fue registrada",
        })
      }

      accepted = inserted.data
    }

    // Sincronizar fecha desde la evidencia original.
    // Corrección: IS NULL, no EQ NULL.
    if (!current[field]) {
      const updated = await c.db
        .from("temporary_contracts")
        .update({
          [field]: accepted.accepted_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", current.id)
        .is(field, null)
        .select("id")
        .maybeSingle()

      if (updated.error || !updated.data) {
        return reply(503, {
          ok: false,
          error: "Aceptación guardada; pendiente de actualizar el estado",
        })
      }
    }

    // Comprobar las dos aceptaciones sobre la misma versión.
    const fresh = await c.db
      .from("temporary_contract_acceptances")
      .select("role,actor_user_id,document_sha256")
      .eq("contract_id", current.id)
      .eq("document_version", current.version)

    if (fresh.error) {
      return reply(503, {
        ok: false,
        error: "Aceptación guardada; pendiente de comprobar ambas partes",
      })
    }

    const owners = (fresh.data || []).filter(
      a =>
        a.role === "owner" &&
        a.document_sha256 === current.document_sha256 &&
        a.actor_user_id === c.ownerId
    )

    const tenants = (fresh.data || []).filter(
      a =>
        a.role === "tenant" &&
        a.document_sha256 === current.document_sha256 &&
        a.actor_user_id === c.tenantId
    )

    // La aceptación bilateral requiere usuarios diferentes.
    if (
      owners.length === 1 &&
      tenants.length === 1 &&
      c.ownerId !== c.tenantId
    ) {
      const done = await c.db
        .from("temporary_contracts")
        .update({
          status: "agreed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", current.id)
        .eq("status", "ready")

      if (done.error) {
        return reply(503, {
          ok: false,
          error: "Aceptaciones guardadas; pendiente de completar el estado bilateral",
        })
      }
    }

    return reply(200, {
      ok: true,
      accepted: true,
      alreadyAccepted: existing.data?.length === 1,
    })
  }

  return reply(400, {
    ok: false,
    error: "Operación no reconocida",
  })
}
