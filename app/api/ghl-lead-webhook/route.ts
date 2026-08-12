import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendMetaCapiLead } from "@/lib/meta/capi"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type OwnerLeadRow = {
  id: string
  neighborhood_slug: string | null
  property_type: string | null
  property_rooms: string | null
  approx_price_number: number | null
  availability_status: string | null
  lead_quality: string | null
}

type TenantLeadRow = {
  id: string
  neighborhood_slugs: string[] | null
  desired_property_type: string | null
  desired_rooms: string | null
  budget_max: number | null
  move_timing: string | null
  lead_quality: string | null
}

type MatchRow = {
  tenant_lead_id: string
  owner_lead_id: string
  status: string
  score: number
  reasons: Record<string, unknown>
}

type SupabaseAdminClient = {
  from: (table: string) => any
}

type MatchableLead = {
  id: string
  role: string
  intent: string
  neighborhood_slugs: string[]
  neighborhood_slug: string | null
  desired_property_type: string | null
  property_type: string | null
  desired_rooms: string | null
  property_rooms: string | null
  budget_max: number | null
  approx_price_number: number | null
  move_timing: string | null
  availability_status: string | null
}

function clean(value: unknown) {
  return String(value || "").trim()
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "")

  if (!digits) return ""

  if (digits.startsWith("549")) return digits

  if (digits.startsWith("54")) {
    const withoutCountry = digits.slice(2)

    if (withoutCountry.startsWith("9")) return digits

    return `549${withoutCountry}`
  }

  if (digits.startsWith("0")) {
    const withoutZero = digits.replace(/^0+/, "")
    return `549${withoutZero}`
  }

  if (digits.startsWith("11")) return `549${digits}`

  return digits
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 15
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

type TimingBucket = "0_3_months" | "6_plus_months"

function normalizeTimingBucket(value: string | null): TimingBucket | null {
  if (!value) return null

  const normalized = normalizeText(value)

  const shortWindow = new Set([
    normalizeText("Ahora"),
    normalizeText("En 1 a 3 meses"),
    normalizeText("Estoy buscando ahora"),
    normalizeText("Me quiero mudar en 1-3 meses"),
    normalizeText("Disponible ahora"),
    normalizeText("Disponible pronto"),
  ])

  const longWindow = new Set([
    normalizeText("En 6 meses o más"),
    normalizeText("Me quiero mudar más adelante"),
  ])

  if (shortWindow.has(normalized)) {
    return "0_3_months"
  }

  if (longWindow.has(normalized)) {
    return "6_plus_months"
  }

  return null
}

function isTimingCompatible(
  tenantTiming: string | null,
  ownerTiming: string | null
) {
  const tenantBucket = normalizeTimingBucket(tenantTiming)
  const ownerBucket = normalizeTimingBucket(ownerTiming)

  if (!tenantBucket || !ownerBucket) return false

  return tenantBucket === ownerBucket
}

function parseMoney(value: string) {
  const cleanValue = value
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/\$/g, "")
    .replace(/ars/g, "")
    .replace(/pesos/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")

  if (!cleanValue) return null

  const match = cleanValue.match(/\d+(\.\d+)?/)
  if (!match) return null

  const number = Number(match[0])
  if (!Number.isFinite(number)) return null

  if (cleanValue.includes("k")) return number * 1000

  return number
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean)
  }

  const text = clean(value)
  if (!text) return []

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function getLeadTags(data: {
  role: string
  intent: string
  availability_status?: string | null
  move_timing?: string | null
  renewal_role?: string | null
  source?: string | null
}) {
  const tags = new Set<string>()

  tags.add("verlo_lead")

  if (data.source === "pagedeprueba") tags.add("verlo_pagedeprueba")
  if (data.source === "verlo_home") tags.add("verlo_home")
  if (data.source === "test_captacion") tags.add("verlo_test_captacion")

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
  if (data.move_timing === "Me quiero mudar más adelante") tags.add("tenant_move_later")
  if (data.move_timing === "Solo quiero enterarme de novedades") tags.add("tenant_news_only")

  if (data.intent === "contract_renewal" && data.renewal_role === "owner") {
    tags.add("renewal_owner")
  }

  if (data.intent === "contract_renewal" && data.renewal_role === "tenant") {
    tags.add("renewal_tenant")
  }

  return Array.from(tags)
}

function isPropertyTypeCompatible(tenantType: string | null, ownerType: string | null) {
  if (!tenantType || !ownerType) return true
  return normalizeText(tenantType) === normalizeText(ownerType)
}

function isRoomsCompatible(tenantRooms: string | null, ownerRooms: string | null) {
  if (!tenantRooms || !ownerRooms) return true
  return normalizeText(tenantRooms) === normalizeText(ownerRooms)
}

function isPriceCompatible(budgetMax: number | null, ownerPrice: number | null) {
  if (!budgetMax || !ownerPrice) return true
  return ownerPrice <= budgetMax
}

function isNeighborhoodCompatible(data: {
  tenantNeighborhoodSlugs: string[]
  ownerNeighborhoodSlug: string | null
}) {
  if (!data.ownerNeighborhoodSlug) return false
  if (data.tenantNeighborhoodSlugs.length === 0) return false

  return data.tenantNeighborhoodSlugs.includes(data.ownerNeighborhoodSlug)
}

function calculateMatchScore(data: {
  neighborhoodOk: boolean
  typeOk: boolean
  roomsOk: boolean
  priceOk: boolean
}) {
  let score = 0

  if (data.neighborhoodOk) score += 40
  if (data.typeOk) score += 20
  if (data.roomsOk) score += 20
  if (data.priceOk) score += 20

  return score
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

async function upsertLeadMatches({
  supabaseAdmin,
  matches,
}: {
  supabaseAdmin: SupabaseAdminClient
  matches: MatchRow[]
}) {
  if (matches.length === 0) {
    return {
      ok: true,
      created: 0,
    }
  }

  const { error } = await supabaseAdmin
    .from("lead_matches")
    // El cast evita que Supabase tipado infiera la tabla nueva como never.
    .upsert(matches, {
      onConflict: "tenant_lead_id,owner_lead_id",
      ignoreDuplicates: true,
    })

  if (error) {
    console.error("lead match insert error:", error)

    return {
      ok: false,
      created: 0,
      error: error.message,
    }
  }

  return {
    ok: true,
    created: matches.length,
  }
}


async function insertLeadNeighborhoods({
  supabaseAdmin,
  leadId,
  intent,
  neighborhoodLabels,
  neighborhoodSlugs,
  neighborhoodSlug,
  zone,
}: {
  supabaseAdmin: SupabaseAdminClient
  leadId: string
  intent: string
  neighborhoodLabels: string[]
  neighborhoodSlugs: string[]
  neighborhoodSlug: string | null
  zone: string | null
}) {
  const rows =
    intent === "tenant_search"
      ? neighborhoodSlugs.map((slug, index) => ({
          lead_id: leadId,
          context: "tenant_search",
          neighborhood_label: neighborhoodLabels[index] || slug,
          neighborhood_slug: slug,
          position: index,
        }))
      : intent === "owner_new_listing" && neighborhoodSlug
        ? [
            {
              lead_id: leadId,
              context: "owner_property",
              neighborhood_label: neighborhoodLabels[0] || zone || neighborhoodSlug,
              neighborhood_slug: neighborhoodSlug,
              position: 0,
            },
          ]
        : []

  if (rows.length === 0) return { ok: true, created: 0 }

  const { error } = await supabaseAdmin
    .from("lead_neighborhoods")
    .upsert(rows, {
      onConflict: "lead_id,context,neighborhood_slug",
      ignoreDuplicates: true,
    })

  if (error) {
    console.error("lead neighborhoods insert error:", error)
    return { ok: false, created: 0, error: error.message }
  }

  return { ok: true, created: rows.length }
}


async function getLeadNeighborhoodSlugs({
  supabaseAdmin,
  leadIds,
  context,
}: {
  supabaseAdmin: SupabaseAdminClient
  leadIds: string[]
  context: "tenant_search" | "owner_property"
}) {
  if (leadIds.length === 0) return new Map<string, string[]>()

  const { data, error } = await supabaseAdmin
    .from("lead_neighborhoods")
    .select("lead_id, neighborhood_slug")
    .in("lead_id", leadIds)
    .eq("context", context)

  if (error) {
    console.error("lead neighborhoods fetch error:", error)
    return new Map<string, string[]>()
  }

  const map = new Map<string, string[]>()

  for (const row of data || []) {
    const leadId = String(row.lead_id)
    const slug = String(row.neighborhood_slug)

    if (!map.has(leadId)) map.set(leadId, [])
    map.get(leadId)?.push(slug)
  }

  return map
}


async function getNeighborhoodCompatibilityMap({
  supabaseAdmin,
}: {
  supabaseAdmin: SupabaseAdminClient
}) {
  const { data, error } = await supabaseAdmin
    .from("neighborhood_compatibility")
    .select(`
      neighborhood_slug,
      compatible_neighborhood_slug,
      compatibility_level
    `)
    .eq("active", true)

  if (error) {
    console.error("neighborhood compatibility fetch error:", error)
    return new Map<string, Map<string, string>>()
  }

  const map = new Map<string, Map<string, string>>()

  for (const row of data || []) {
    const origin = String(row.neighborhood_slug)
    const compatible = String(row.compatible_neighborhood_slug)
    const level = String(row.compatibility_level || "nearby")

    if (!map.has(origin)) {
      map.set(origin, new Map())
    }

    map.get(origin)?.set(compatible, level)
  }

  return map
}

function getNeighborhoodCompatibility({
  tenantNeighborhoodSlugs,
  ownerNeighborhoodSlug,
  compatibilityMap,
}: {
  tenantNeighborhoodSlugs: string[]
  ownerNeighborhoodSlug: string | null
  compatibilityMap: Map<string, Map<string, string>>
}) {
  if (!ownerNeighborhoodSlug) {
    return {
      ok: false,
      type: null,
      matchedTenantNeighborhood: null,
    }
  }

  for (const tenantNeighborhood of tenantNeighborhoodSlugs) {
    if (tenantNeighborhood === ownerNeighborhoodSlug) {
      return {
        ok: true,
        type: "exact",
        matchedTenantNeighborhood: tenantNeighborhood,
      }
    }
  }

  for (const tenantNeighborhood of tenantNeighborhoodSlugs) {
    const relationship =
      compatibilityMap
        .get(tenantNeighborhood)
        ?.get(ownerNeighborhoodSlug)

    if (relationship) {
      return {
        ok: true,
        type: relationship,
        matchedTenantNeighborhood: tenantNeighborhood,
      }
    }
  }

  return {
    ok: false,
    type: null,
    matchedTenantNeighborhood: null,
  }
}

async function createLeadMatches({
  supabaseAdmin,
  lead,
}: {
  supabaseAdmin: SupabaseAdminClient
  lead: MatchableLead
}) {
  const isTenant =
    lead.role === "tenant" &&
    lead.intent === "tenant_search"

  const isOwner =
    lead.role === "owner" &&
    lead.intent === "owner_new_listing"

  if (!isTenant && !isOwner) {
    return {
      ok: true,
      created: 0,
      skipped: true,
    }
    const neighborhoodCompatibilityMap =
  await getNeighborhoodCompatibilityMap({
    supabaseAdmin,
  })
  }

  // ============================================================
  // NUEVO TENANT -> BUSCAR OWNERS
  // ============================================================

  if (isTenant) {
    if (!lead.move_timing) {
      return {
        ok: true,
        created: 0,
        skipped: true,
      }
    }

    const { data: ownerLeadsRaw, error } = await supabaseAdmin
      .from("lead_intake")
      .select(`
        id,
        neighborhood_slug,
        property_type,
        property_rooms,
        approx_price_number,
        availability_status,
        lead_quality
      `)
      .eq("role", "owner")
      .eq("intent", "owner_new_listing")
      .neq("id", lead.id)
      .order("created_at", { ascending: false })
      .limit(500)

    if (error) {
      console.error("lead match owner search error:", error)

      return {
        ok: false,
        created: 0,
        skipped: false,
        error: error.message,
      }
    }

    const ownerLeads = ((ownerLeadsRaw || []) as unknown as OwnerLeadRow[])
      .filter(
        (ownerLead) =>
          ownerLead.lead_quality !== "duplicate" &&
          ownerLead.lead_quality !== "needs_reclassification"
      )

    const ownerNeighborhoodMap = await getLeadNeighborhoodSlugs({
      supabaseAdmin,
      leadIds: ownerLeads.map((ownerLead) => ownerLead.id),
      context: "owner_property",
    })

    const matches: MatchRow[] = ownerLeads
      .map((ownerLead) => {
        const ownerNeighborhoodSlug =
          ownerNeighborhoodMap.get(ownerLead.id)?.[0] ||
          ownerLead.neighborhood_slug

        const timeOk =
          !!lead.move_timing &&
          !!ownerLead.availability_status &&
          lead.move_timing === ownerLead.availability_status

        if (!timeOk) return null

        const neighborhoodOk = isNeighborhoodCompatible({
          tenantNeighborhoodSlugs: lead.neighborhood_slugs,
          ownerNeighborhoodSlug,
        })

        const typeOk = isPropertyTypeCompatible(
          lead.desired_property_type,
          ownerLead.property_type
        )

        const roomsOk = isRoomsCompatible(
          lead.desired_rooms,
          ownerLead.property_rooms
        )

        const priceOk = isPriceCompatible(
          lead.budget_max,
          ownerLead.approx_price_number
        )

        const score = calculateMatchScore({
          neighborhoodOk,
          typeOk,
          roomsOk,
          priceOk,
        })

        return {
          tenant_lead_id: lead.id,
          owner_lead_id: ownerLead.id,
          status: "new",
          score,
          reasons: {
            time_ok: true,
            neighborhood_ok: neighborhoodOk,
            type_ok: typeOk,
            rooms_ok: roomsOk,
            price_ok: priceOk,

neighborhood_match_type: neighborhoodMatch.type,
matched_tenant_neighborhood:
  neighborhoodMatch.matchedTenantNeighborhood,
            
            tenant_move_timing: lead.move_timing,
            owner_availability_status: ownerLead.availability_status,

            tenant_neighborhood_slugs: lead.neighborhood_slugs,
            owner_neighborhood_slug: ownerNeighborhoodSlug,

            tenant_type: lead.desired_property_type,
            owner_type: ownerLead.property_type,

            tenant_rooms: lead.desired_rooms,
            owner_rooms: ownerLead.property_rooms,

            tenant_budget_max: lead.budget_max,
            owner_price: ownerLead.approx_price_number,
          },
        } satisfies MatchRow
      })
      .filter((match) => match !== null)
.map((match) => match as MatchRow)
.filter((match) => match.score >= 60)

    const result = await upsertLeadMatches({
      supabaseAdmin,
      matches,
    })

    return {
      ok: result.ok,
      created: result.created,
      skipped: false,
      error: "error" in result ? result.error : undefined,
    }
  }

  // ============================================================
  // NUEVO OWNER -> BUSCAR TENANTS
  // ============================================================

  if (isOwner) {
    if (!lead.availability_status) {
      return {
        ok: true,
        created: 0,
        skipped: true,
      }
    }

    const { data: tenantLeadsRaw, error } = await supabaseAdmin
      .from("lead_intake")
      .select(`
        id,
        neighborhood_slugs,
        desired_property_type,
        desired_rooms,
        budget_max,
        move_timing,
        lead_quality
      `)
      .eq("role", "tenant")
      .eq("intent", "tenant_search")
      .neq("id", lead.id)
      .order("created_at", { ascending: false })
      .limit(500)

    if (error) {
      console.error("lead match tenant search error:", error)

      return {
        ok: false,
        created: 0,
        skipped: false,
        error: error.message,
      }
    }

    const tenantLeads = ((tenantLeadsRaw || []) as unknown as TenantLeadRow[])
      .filter(
        (tenantLead) =>
          tenantLead.lead_quality !== "duplicate" &&
          tenantLead.lead_quality !== "needs_reclassification"
      )

    const tenantNeighborhoodMap = await getLeadNeighborhoodSlugs({
      supabaseAdmin,
      leadIds: tenantLeads.map((tenantLead) => tenantLead.id),
      context: "tenant_search",
    })

    const ownerNeighborhoodSlug = lead.neighborhood_slug

    const matches: MatchRow[] = tenantLeads
      .map((tenantLead) => {
        const tenantNeighborhoodSlugs =
          tenantNeighborhoodMap.get(tenantLead.id) ||
          toStringArray(tenantLead.neighborhood_slugs)

   const timeOk = isTimingCompatible(
  tenantLead.move_timing,
  lead.availability_status
)

if (!timeOk) return null

       const neighborhoodMatch = getNeighborhoodCompatibility({
  tenantNeighborhoodSlugs: lead.neighborhood_slugs,
  ownerNeighborhoodSlug,
  compatibilityMap: neighborhoodCompatibilityMap,
})

if (!neighborhoodMatch.ok) return null

const neighborhoodOk = true

        const typeOk = isPropertyTypeCompatible(
          tenantLead.desired_property_type,
          lead.property_type
        )

        const roomsOk = isRoomsCompatible(
          tenantLead.desired_rooms,
          lead.property_rooms
        )

        const priceOk = isPriceCompatible(
          tenantLead.budget_max,
          lead.approx_price_number
        )

        const score = calculateMatchScore({
          neighborhoodOk,
          typeOk,
          roomsOk,
          priceOk,
        })

        return {
          tenant_lead_id: tenantLead.id,
          owner_lead_id: lead.id,
          status: "new",
          score,
          reasons: {
            time_ok: true,
            neighborhood_ok: neighborhoodOk,
            type_ok: typeOk,
            rooms_ok: roomsOk,
            price_ok: priceOk,

            neighborhood_match_type: neighborhoodMatch.type,
matched_tenant_neighborhood:
  neighborhoodMatch.matchedTenantNeighborhood,

            tenant_move_timing: tenantLead.move_timing,
            owner_availability_status: lead.availability_status,

            tenant_neighborhood_slugs: tenantNeighborhoodSlugs,
            owner_neighborhood_slug: ownerNeighborhoodSlug,

            tenant_type: tenantLead.desired_property_type,
            owner_type: lead.property_type,

            tenant_rooms: tenantLead.desired_rooms,
            owner_rooms: lead.property_rooms,

            tenant_budget_max: tenantLead.budget_max,
            owner_price: lead.approx_price_number,
          },
        } satisfies MatchRow
      })
      .filter((match) => match !== null)
.map((match) => match as MatchRow)
.filter((match) => match.score >= 60)

    const result = await upsertLeadMatches({
      supabaseAdmin,
      matches,
    })

    return {
      ok: result.ok,
      created: result.created,
      skipped: false,
      error: "error" in result ? result.error : undefined,
    }
  }

  return {
    ok: true,
    created: 0,
    skipped: true,
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
    const metadata = body.metadata || {}

    const honeypot = clean(body.website)

    if (honeypot) {
      return NextResponse.json({
        ok: true,
        bot_filtered: true,
      })
    }

    const full_name = clean(body.full_name)
    const email = clean(body.email).toLowerCase()

    const phone_raw = clean(body.phone)
    const phone_normalized = normalizePhone(phone_raw)
    const phone = phone_normalized

    const role = clean(body.role)
    const intent = clean(body.intent)

    const zone = clean(body.zone) || null

    const property_type = clean(body.property_type) || null
    const property_rooms = clean(body.property_rooms || metadata.property_rooms) || null
    const availability_status = clean(body.availability_status) || null
    const approx_price = clean(body.approx_price) || null

    const approx_price_number = parseMoney(
      clean(body.approx_price_number || approx_price || metadata.approx_price_number)
    )

    const desired_property_type = clean(body.desired_property_type) || null
    const desired_rooms = clean(body.desired_rooms || metadata.desired_rooms) || null
    const budget_range = clean(body.budget_range) || null

    const budget_max = parseMoney(
      clean(body.budget_max || budget_range || metadata.budget_max)
    )

    const move_timing = clean(body.move_timing) || null

    const renewal_role = clean(body.renewal_role) || null
    const contract_expiration = clean(body.contract_expiration) || null
    const other_party_status = clean(body.other_party_status) || null
    const renewal_need = clean(body.renewal_need) || null

    const source = clean(body.source || metadata.page) || "verlo_home"

    const area_macro =
      clean(body.area_macro || metadata.tenant_area_label || metadata.area_macro) || null

    const neighborhood_labels =
      toStringArray(body.neighborhood_labels).length > 0
        ? toStringArray(body.neighborhood_labels)
        : toStringArray(metadata.tenant_neighborhoods)

    const neighborhood_slugs =
      toStringArray(body.neighborhood_slugs).length > 0
        ? toStringArray(body.neighborhood_slugs)
        : neighborhood_labels.map(normalizeText)

    const neighborhood_slug =
      clean(body.neighborhood_slug || metadata.neighborhood_slug) ||
      (zone ? normalizeText(zone) : null)

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

    if (intent === "tenant_search") {
      if (neighborhood_slugs.length === 0) {
        return NextResponse.json(
          { ok: false, error: "Elegí al menos un barrio donde buscarías alquilar" },
          { status: 400 }
        )
      }

      if (!desired_property_type) {
        return NextResponse.json(
          { ok: false, error: "Elegí el tipo de propiedad que buscás" },
          { status: 400 }
        )
      }

      if (!desired_rooms) {
        return NextResponse.json(
          { ok: false, error: "Elegí los ambientes que buscás" },
          { status: 400 }
        )
      }

      if (!budget_range && !budget_max) {
        return NextResponse.json(
          { ok: false, error: "Ingresá tu presupuesto mensual máximo" },
          { status: 400 }
        )
      }

      if (!move_timing) {
        return NextResponse.json(
          { ok: false, error: "Elegí cuándo querés mudarte" },
          { status: 400 }
        )
      }
    }

    if (intent === "owner_new_listing") {
      if (!neighborhood_slug) {
        return NextResponse.json(
          { ok: false, error: "Elegí el barrio de la propiedad" },
          { status: 400 }
        )
      }

      if (!property_type) {
        return NextResponse.json(
          { ok: false, error: "Elegí el tipo de propiedad" },
          { status: 400 }
        )
      }

      if (!property_rooms) {
        return NextResponse.json(
          { ok: false, error: "Elegí los ambientes de la propiedad" },
          { status: 400 }
        )
      }

      if (!approx_price && !approx_price_number) {
        return NextResponse.json(
          { ok: false, error: "Ingresá el precio mensual esperado" },
          { status: 400 }
        )
      }

      if (!availability_status) {
        return NextResponse.json(
          { ok: false, error: "Elegí la disponibilidad de la propiedad" },
          { status: 400 }
        )
      }
    }

    if (intent === "contract_renewal") {
      if (!neighborhood_slug) {
        return NextResponse.json(
          { ok: false, error: "Elegí el barrio de la propiedad" },
          { status: 400 }
        )
      }

      if (!renewal_role) {
        return NextResponse.json(
          { ok: false, error: "Elegí si sos propietario o inquilino" },
          { status: 400 }
        )
      }

      if (!contract_expiration) {
        return NextResponse.json(
          { ok: false, error: "Ingresá la fecha de vencimiento del contrato" },
          { status: 400 }
        )
      }

      if (!other_party_status) {
        return NextResponse.json(
          { ok: false, error: "Indicá si ya lo hablaste con la otra parte" },
          { status: 400 }
        )
      }

      if (!renewal_need) {
        return NextResponse.json(
          { ok: false, error: "Elegí qué querés lograr con la renovación" },
          { status: 400 }
        )
      }
    }

    const tags = getLeadTags({
      role,
      intent,
      availability_status,
      move_timing,
      renewal_role,
      source,
    })

    const normalizedMetadata = {
      ...metadata,
      tags,
      source,
      phone_raw,
      phone_normalized,
      area_macro,
      neighborhood_labels,
      neighborhood_slugs,
      neighborhood_slug,
      desired_rooms,
      property_rooms,
      budget_max,
      approx_price_number,
    }

    const leadPayload = {
      full_name,
      email,
      phone,
      phone_raw,
      phone_normalized,
      role,
      intent,
      zone,
      area_macro,
      neighborhood_labels,
      neighborhood_slugs,
      neighborhood_slug,
      property_type,
      property_rooms,
      availability_status,
      approx_price,
      approx_price_number,
      desired_property_type,
      desired_rooms,
      budget_range,
      budget_max,
      move_timing,
      renewal_role,
      contract_expiration,
      other_party_status,
      renewal_need,
      source,
      tags,
      metadata: normalizedMetadata,
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data: leadRecord, error } = await supabaseAdmin
      .from("lead_intake")
      .insert({
        full_name,
        email,
        phone,
        phone_raw,
        phone_normalized,
        role,
        intent,
        zone,
        area_macro,
        neighborhood_labels,
        neighborhood_slugs,
        neighborhood_slug,
        property_type,
        property_rooms,
        availability_status,
        approx_price,
        approx_price_number,
        desired_property_type,
        desired_rooms,
        budget_range,
        budget_max,
        move_timing,
        renewal_role,
        contract_expiration,
        other_party_status,
        renewal_need,
        source,
        metadata: normalizedMetadata,
      })
      .select("id")
      .single()

    if (error) {
      console.error("ghl lead webhook insert error:", error)

      return NextResponse.json(
        { ok: false, error: "No pudimos guardar tus datos" },
        { status: 500 }
      )
    }

const neighborhoodResult = await insertLeadNeighborhoods({
  supabaseAdmin,
  leadId: leadRecord.id,
  intent,
  neighborhoodLabels: neighborhood_labels,
  neighborhoodSlugs: neighborhood_slugs,
  neighborhoodSlug: neighborhood_slug,
  zone,
})

if (!neighborhoodResult.ok) {
  console.error("lead neighborhoods error:", neighborhoodResult)
}
    
    const matchResult = await createLeadMatches({
      supabaseAdmin,
      lead: {
        id: leadRecord.id,
        role,
        intent,
        neighborhood_slugs,
        neighborhood_slug,
        desired_property_type,
        property_type,
        desired_rooms,
        property_rooms,
        budget_max,
        approx_price_number,
        move_timing,
        availability_status,
      },
    })

    if (!matchResult.ok) {
      console.error("lead matching error:", matchResult)
    }

    const ghl = await sendToGhlWebhook({
      ...leadPayload,
      lead_id: leadRecord.id,
      match_result: matchResult,
    })

    if (!ghl.ok) {
      console.error("ghl webhook error:", ghl.error)
    }

    const eventId =
      clean(body.event_id) ||
      `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`

    const forwardedFor = req.headers.get("x-forwarded-for")
    const clientIpAddress = forwardedFor?.split(",")[0]?.trim() || null
    const clientUserAgent = req.headers.get("user-agent") || null

    const fbp = clean(body.fbp) || null
    const fbc = clean(body.fbc) || null

    const eventSourceUrl =
      clean(body.event_source_url) ||
      req.headers.get("referer") ||
      "https://verlo.lat"

    const meta = await sendMetaCapiLead({
      eventId,
      eventSourceUrl,
      email,
      phone,
      fullName: full_name,
      clientIpAddress,
      clientUserAgent,
      fbp,
      fbc,
      role,
      intent,
      zone,
    })

    if (!meta.ok) {
      console.error("meta capi error:", meta.error)
    }

    return NextResponse.json({
      ok: true,
      ghl,
      meta,
      tags,
      match_result: matchResult,
      event_id: eventId,
      lead_id: leadRecord?.id || null,
    })
  } catch (err) {
    console.error("ghl lead webhook api error:", err)

    return NextResponse.json(
      { ok: false, error: "Error inesperado" },
      { status: 500 }
    )
  }
}
