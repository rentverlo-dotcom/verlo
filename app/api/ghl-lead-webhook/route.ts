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
  accepted_income_proof_types: string[] | null
  min_income_ratio: number | null
  accepted_guarantee_types: string[] | null
  lead_quality: string | null
}

type TenantLeadRow = {
  id: string
  neighborhood_slugs: string[] | null
  desired_property_type: string | null
  desired_rooms: string | null
  budget_max: number | null
  move_timing: string | null
  income_proof_type: string | null
  income_range: string | null
  income_max: number | null
  guarantee_types: string[] | null
  lead_quality: string | null
}

type MatchRow = {
  tenant_lead_id: string
  owner_lead_id: string
  status: string
  score: number
  income_proof_ok: boolean | null
  income_amount_ok: boolean | null
  guarantee_ok: boolean | null
  prequalified: boolean
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

  income_proof_type: string | null
  income_range: string | null
  income_max: number | null
  guarantee_types: string[]

  accepted_income_proof_types: string[]
  min_income_ratio: number | null
  accepted_guarantee_types: string[]
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

function budgetRangeToMax(value: string | null): number | null {
  switch (value) {
    case "hasta-500000":
      return 500000
    case "500001-700000":
      return 700000
    case "700001-900000":
      return 900000
    case "900001-1200000":
      return 1200000
    case "1200001-1500000":
      return 1500000
    case "1500001-2000000":
      return 2000000
    case "2000000-plus":
      return 999999999
    default:
      return null
  }
}

function incomeRangeToMax(value: string | null): number | null {
  switch (value) {
    case "0-500000":
      return 500000
    case "500001-1000000":
      return 1000000
    case "1000001-1500000":
      return 1500000
    case "1500001-2000000":
      return 2000000
    case "2000001-3000000":
      return 3000000
    case "3000001-plus":
      return 999999999
    default:
      return null
  }
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

  // Base
  tags.add("verlo_lead")

  // Fuente
  if (data.source === "verlo_home") {
    tags.add("verlo_home")

    // Lo mantenemos por compatibilidad con GHL histórico
    tags.add("verlo_test_captacion")
  }

  if (data.source === "verlo_propietarios") {
    tags.add("verlo_propietarios")
  }

  if (data.source === "pagedeprueba") {
    tags.add("verlo_pagedeprueba")
  }

  // Rol
  if (data.role === "owner") {
    tags.add("verlo_owner")
  }

  if (data.role === "tenant") {
    tags.add("verlo_tenant")
  }

  if (data.role === "both") {
    tags.add("verlo_owner")
    tags.add("verlo_tenant")
  }

  // Intención
  if (data.intent === "owner_new_listing") {
    tags.add("verlo_owner_new_listing")
  }

  if (data.intent === "tenant_search") {
    tags.add("verlo_tenant_search")
  }

  if (data.intent === "contract_renewal") {
    tags.add("verlo_contract_renewal")
  }

  // Renovación
  if (
    data.intent === "contract_renewal" &&
    data.renewal_role === "owner"
  ) {
    tags.add("renewal_owner")
  }

  if (
    data.intent === "contract_renewal" &&
    data.renewal_role === "tenant"
  ) {
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

function isIncomeProofCompatible(
  tenantProof: string | null,
  acceptedProofs: string[] | null
): boolean | null {
  if (!tenantProof || !acceptedProofs || acceptedProofs.length === 0) {
    return null
  }

  if (tenantProof === "none") return false

  if (acceptedProofs.includes("any")) return true

  return acceptedProofs.includes(tenantProof)
}

function isIncomeAmountCompatible(
  tenantIncomeMax: number | null,
  ownerPrice: number | null,
  minIncomeRatio: number | null
): boolean | null {
  if (!tenantIncomeMax || !ownerPrice || !minIncomeRatio) {
    return null
  }

  return tenantIncomeMax >= ownerPrice * minIncomeRatio
}

function isGuaranteeCompatible(
  tenantGuarantees: string[] | null,
  acceptedGuarantees: string[] | null
): boolean | null {
  if (
    !tenantGuarantees ||
    tenantGuarantees.length === 0 ||
    !acceptedGuarantees ||
    acceptedGuarantees.length === 0
  ) {
    return null
  }

  const realTenantGuarantees =
    tenantGuarantees.filter((value) => value !== "none")

  if (realTenantGuarantees.length === 0) {
    return false
  }

  if (acceptedGuarantees.includes("any")) {
    return true
  }

  return realTenantGuarantees.some((guarantee) =>
    acceptedGuarantees.includes(guarantee)
  )
}

function calculateMatchScore(data: {
  neighborhoodOk: boolean
  typeOk: boolean
  roomsOk: boolean
  priceOk: boolean
  incomeProofOk: boolean | null
  incomeAmountOk: boolean | null
  guaranteeOk: boolean | null
}) {
  let score = 0

  if (data.neighborhoodOk) score += 40
  if (data.typeOk) score += 15
  if (data.roomsOk) score += 15
  if (data.priceOk) score += 10
  if (data.incomeProofOk === true) score += 5
  if (data.incomeAmountOk === true) score += 10
  if (data.guaranteeOk === true) score += 5

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


async function getLeadMatchSummary({
  supabaseAdmin,
  leadId,
  role,
}: {
  supabaseAdmin: SupabaseAdminClient
  leadId: string
  role: string
}) {
  const matchColumn =
    role === "owner"
      ? "owner_lead_id"
      : "tenant_lead_id"

  const { data, error } = await supabaseAdmin
    .from("lead_matches")
    .select(`
      id,
      score,
      income_proof_ok,
      income_amount_ok,
      guarantee_ok,
      prequalified,
      reasons,
      tenant_lead_id,
      owner_lead_id
    `)
    .eq(matchColumn, leadId)
    .order("score", { ascending: false })

  if (error) {
    console.error("lead match summary error:", error)

    return {
      verlo_match_count: 0,
      verlo_match_100_count: 0,
      verlo_match_80_count: 0,
      verlo_best_match_score: null,
      verlo_best_zone: null,
      verlo_best_timing: null,
      verlo_best_property_type: null,
      verlo_best_rooms: null,
      verlo_best_price: null,
      verlo_best_matches_on: null,
      verlo_match_summary: null,
      verlo_match_role: role,
      verlo_match_updated_at: new Date().toISOString(),
    }
  }

  const matches = data || []

  const match100Count = matches.filter(
    (match: any) => Number(match.score) === 100
  ).length

  const match80Count = matches.filter(
    (match: any) => Number(match.score) === 80
  ).length

  const bestMatch = matches[0] || null

  const reasons =
    bestMatch?.reasons &&
    typeof bestMatch.reasons === "object"
      ? bestMatch.reasons
      : {}

  const bestZone =
    role === "owner"
      ? reasons?.matched_tenant_neighborhood ||
        reasons?.owner_neighborhood_slug ||
        null
      : reasons?.owner_neighborhood_slug ||
        reasons?.matched_tenant_neighborhood ||
        null

  const bestTiming =
    role === "owner"
      ? reasons?.tenant_move_timing || null
      : reasons?.owner_availability_status || null

  const bestPropertyType =
    role === "owner"
      ? reasons?.tenant_type || null
      : reasons?.owner_type || null

  const bestRooms =
    role === "owner"
      ? reasons?.tenant_rooms || null
      : reasons?.owner_rooms || null

  const bestPrice =
    role === "owner"
      ? reasons?.tenant_budget_max || null
      : reasons?.owner_price || null

  const matchesOn: string[] = []

  if (reasons?.neighborhood_ok) {
    matchesOn.push("zona")
  }

  if (reasons?.type_ok) {
    matchesOn.push("tipo de propiedad")
  }

  if (reasons?.rooms_ok) {
    matchesOn.push("ambientes")
  }

  if (reasons?.price_ok) {
    matchesOn.push("presupuesto")
  }

  if (reasons?.time_ok) {
    matchesOn.push("momento de mudanza")
  }

  if (reasons?.income_proof_ok) {
    matchesOn.push("demostración de ingresos")
  }

  if (reasons?.income_amount_ok) {
    matchesOn.push("nivel de ingresos")
  }

  if (reasons?.guarantee_ok) {
    matchesOn.push("garantía")
  }

  const summary =
    matches.length > 0
      ? `${matches.length} matches: ${match100Count} al 100% y ${match80Count} al 80%`
      : "Todavía no encontramos matches activos"

  return {
    verlo_match_count: matches.length,
    verlo_match_100_count: match100Count,
    verlo_match_80_count: match80Count,

    verlo_best_match_score:
      bestMatch ? Number(bestMatch.score) : null,

    verlo_best_zone: bestZone,
    verlo_best_timing: bestTiming,
    verlo_best_property_type: bestPropertyType,
    verlo_best_rooms: bestRooms,
    verlo_best_price: bestPrice,

    verlo_best_matches_on:
      matchesOn.length > 0
        ? matchesOn.join(", ")
        : null,

    verlo_match_summary: summary,

    verlo_match_role: role,

    verlo_match_updated_at:
      new Date().toISOString(),
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
  }

  const neighborhoodCompatibilityMap =
    await getNeighborhoodCompatibilityMap({
      supabaseAdmin,
    })

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
        accepted_income_proof_types,
        min_income_ratio,
        accepted_guarantee_types,
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

        const timeOk = isTimingCompatible(
          lead.move_timing,
          ownerLead.availability_status
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

        const incomeProofOk = isIncomeProofCompatible(
          lead.income_proof_type,
          ownerLead.accepted_income_proof_types
        )

        const incomeAmountOk = isIncomeAmountCompatible(
          lead.income_max,
          ownerLead.approx_price_number,
          ownerLead.min_income_ratio
        )

        const guaranteeOk = isGuaranteeCompatible(
          lead.guarantee_types,
          ownerLead.accepted_guarantee_types
        )

        const prequalified =
          incomeProofOk === true &&
          incomeAmountOk === true &&
          guaranteeOk === true

        const score = calculateMatchScore({
          neighborhoodOk,
          typeOk,
          roomsOk,
          priceOk,
          incomeProofOk,
          incomeAmountOk,
          guaranteeOk,
        })

        return {
          tenant_lead_id: lead.id,
          owner_lead_id: ownerLead.id,
          status: "new",
          score,
          income_proof_ok: incomeProofOk,
          income_amount_ok: incomeAmountOk,
          guarantee_ok: guaranteeOk,
          prequalified,
          reasons: {
            time_ok: true,
            neighborhood_ok: neighborhoodOk,
            type_ok: typeOk,
            rooms_ok: roomsOk,
            price_ok: priceOk,
            income_proof_ok: incomeProofOk,
            income_amount_ok: incomeAmountOk,
            guarantee_ok: guaranteeOk,
            prequalified,

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

            tenant_income_proof_type: lead.income_proof_type,
            tenant_income_range: lead.income_range,
            tenant_income_max: lead.income_max,
            tenant_guarantee_types: lead.guarantee_types,

            owner_accepted_income_proof_types:
              ownerLead.accepted_income_proof_types,
            owner_min_income_ratio: ownerLead.min_income_ratio,
            owner_accepted_guarantee_types:
              ownerLead.accepted_guarantee_types,
          },
        } satisfies MatchRow
      })
      .filter((match) => match !== null)
      .filter((match) => match.score >= 80)
      

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
        income_proof_type,
        income_range,
        income_max,
        guarantee_types,
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
          tenantNeighborhoodSlugs,
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

        const incomeProofOk = isIncomeProofCompatible(
          tenantLead.income_proof_type,
          lead.accepted_income_proof_types
        )

        const incomeAmountOk = isIncomeAmountCompatible(
          tenantLead.income_max,
          lead.approx_price_number,
          lead.min_income_ratio
        )

        const guaranteeOk = isGuaranteeCompatible(
          tenantLead.guarantee_types,
          lead.accepted_guarantee_types
        )

        const prequalified =
          incomeProofOk === true &&
          incomeAmountOk === true &&
          guaranteeOk === true

        const score = calculateMatchScore({
          neighborhoodOk,
          typeOk,
          roomsOk,
          priceOk,
          incomeProofOk,
          incomeAmountOk,
          guaranteeOk,
        })

        return {
          tenant_lead_id: tenantLead.id,
          owner_lead_id: lead.id,
          status: "new",
          score,
          income_proof_ok: incomeProofOk,
          income_amount_ok: incomeAmountOk,
          guarantee_ok: guaranteeOk,
          prequalified,
          reasons: {
            time_ok: true,
            neighborhood_ok: neighborhoodOk,
            type_ok: typeOk,
            rooms_ok: roomsOk,
            price_ok: priceOk,
            income_proof_ok: incomeProofOk,
            income_amount_ok: incomeAmountOk,
            guarantee_ok: guaranteeOk,
            prequalified,
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

            tenant_income_proof_type: tenantLead.income_proof_type,
            tenant_income_range: tenantLead.income_range,
            tenant_income_max: tenantLead.income_max,
            tenant_guarantee_types: tenantLead.guarantee_types,

            owner_accepted_income_proof_types:
              lead.accepted_income_proof_types,
            owner_min_income_ratio: lead.min_income_ratio,
            owner_accepted_guarantee_types:
              lead.accepted_guarantee_types,
          },
        } satisfies MatchRow
      })
      .filter((match) => match !== null)
      .map((match) => match as MatchRow)
     .filter((match) => match.score >= 80)

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

    const role = clean(
  req.nextUrl.searchParams.get("verlo_role") ||
  body.verlo_role ||
  body.role
)

const intent = clean(
  req.nextUrl.searchParams.get("verlo_intent") ||
  body.verlo_intent ||
  body.intent
)

    const zone = clean(body.zone) || null

 const property_type =
  role === "owner"
    ? clean(
        body.verlo_property_type ||
        body.verlo_ai_owner_property_type ||
        body.property_type
      ) || null
    : clean(body.property_type) || null

const property_rooms =
  role === "owner"
    ? clean(
        body.verlo_property_rooms ||
        body.verlo_ai_owner_property_rooms ||
        body.property_rooms ||
        metadata.property_rooms
      ) || null
    : clean(body.property_rooms || metadata.property_rooms) || null

const availability_status =
  role === "owner"
    ? clean(
        body.verlo_availability_status ||
        body.verlo_ai_owner_availability_status ||
        body.availability_status
      ) || null
    : clean(body.availability_status) || null

const approx_price =
  role === "owner"
    ? clean(
        body.verlo_approx_price ||
        body.verlo_ai_owner_approx_price ||
        body.approx_price
      ) || null
    : clean(body.approx_price) || null

const approx_price_number = parseMoney(
  clean(
    body.approx_price_number ||
    approx_price ||
    metadata.approx_price_number
  )
)

const desired_property_type =
  clean(body.verlo_property_type || body.desired_property_type) || null

const desired_rooms =
  clean(
    body.verlo_desired_rooms ||
    body.desired_rooms ||
    metadata.desired_rooms
  ) || null

const budget_range =
  clean(body.verlo_budget_range || body.budget_range) || null

const budget_max =
  body.budget_max
    ? Number(body.budget_max)
    : budgetRangeToMax(budget_range)

const move_timing =
  clean(body.verlo_move_timing || body.move_timing) || null

const income_proof_type =
  clean(body.verlo_income_proof_type || body.income_proof_type) || null

const income_range =
  clean(body.verlo_income_range || body.income_range) || null

const income_max =
  body.income_max
    ? Number(body.income_max)
    : incomeRangeToMax(income_range)

const guarantee_types =
  toStringArray(body.verlo_guarantee_types || body.guarantee_types)

const match_notifications =
  clean(
    body.verlo_match_notifications ||
    body.verlo_ai_match_notifications ||
    body.match_notifications
  ) || null

   
const accepted_income_proof_types =
  toStringArray(
    body.verlo_ai_owner_accepted_income_proof_types ||
    body.verlo_accepted_income_proof_types ||
    body.accepted_income_proof_types
  )

const min_income_ratio =
  body.verlo_min_income_ratio ||
  body.verlo_ai_owner_min_income_ratio ||
  body.min_income_ratio
    ? Number(
        body.verlo_min_income_ratio ||
        body.verlo_ai_owner_min_income_ratio ||
        body.min_income_ratio
      )
    : null

const accepted_guarantee_types =
  toStringArray(
    body.verlo_ai_owner_accepted_guarantee_types ||
    body.verlo_accepted_guarantee_types ||
    body.accepted_guarantee_types
  )
    
    const renewal_role = clean(body.renewal_role) || null
    const contract_expiration = clean(body.contract_expiration) || null
    const other_party_status = clean(body.other_party_status) || null
    const renewal_need = clean(body.renewal_need) || null

const source =
  clean(
    req.nextUrl.searchParams.get("source") ||
    body.source ||
    metadata.page
  ) || "verlo_home"
    const area_macro =
      clean(body.area_macro || metadata.tenant_area_label || metadata.area_macro) || null

const neighborhood_labels =
  toStringArray(body.verlo_neighborhoods).length > 0
    ? toStringArray(body.verlo_neighborhoods)
    : toStringArray(body.neighborhood_labels).length > 0
      ? toStringArray(body.neighborhood_labels)
      : toStringArray(metadata.tenant_neighborhoods)

    const neighborhood_slugs =
      toStringArray(body.neighborhood_slugs).length > 0
        ? toStringArray(body.neighborhood_slugs)
        : neighborhood_labels.map(normalizeText)

    const neighborhood_slug =
  clean(body.neighborhood_slug || metadata.neighborhood_slug) ||
  (
    role === "owner" && neighborhood_labels.length > 0
      ? normalizeText(neighborhood_labels[0])
      : zone
        ? normalizeText(zone)
        : null
  )

    if (full_name.length < 3) {
      return NextResponse.json(
        { ok: false, error: "Ingresá tu nombre" },
        { status: 400 }
      )
    }

  if (email && !isValidEmail(email)) {
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
    {
      ok: false,
      error: "Intención inválida",
      received_intent: intent,
      raw_verlo_intent: body.verlo_intent,
      raw_intent: body.intent,
    },
    { status: 400 }
  )
}

    if (intent === "tenant_search") {
     if (neighborhood_slugs.length === 0) {
  return NextResponse.json(
    {
      ok: false,
      error: "Elegí al menos un barrio donde buscarías alquilar",
      raw_neighborhood_labels: body.neighborhood_labels,
      raw_neighborhood_slugs: body.neighborhood_slugs,
      parsed_neighborhood_labels: neighborhood_labels,
      parsed_neighborhood_slugs: neighborhood_slugs,
    },
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
      income_proof_type,
      income_range,
      income_max,
      guarantee_types,
      accepted_income_proof_types,
      min_income_ratio,
      accepted_guarantee_types,
      match_notifications,
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
      income_proof_type,
      income_range,
      income_max,
      guarantee_types,
accepted_income_proof_types,
min_income_ratio,
accepted_guarantee_types,
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
        income_proof_type,
income_range,
income_max,
guarantee_types,
accepted_income_proof_types,
min_income_ratio,
accepted_guarantee_types,
       match_notifications,
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
        income_proof_type,
income_range,
income_max,
guarantee_types,
accepted_income_proof_types,
min_income_ratio,
accepted_guarantee_types,
      },
    })

if (!matchResult.ok) {
  console.error("lead matching error:", matchResult)
}

const matchSummary = await getLeadMatchSummary({
  supabaseAdmin,
  leadId: leadRecord.id,
  role,
})

let pilotMatch: Record<string, unknown> = {
  ok: true,
  triggered: false,
  reason: "no_matches",
}

if (Number(matchSummary.verlo_match_count || 0) > 0) {
  try {
    const pilotResponse = await fetch(
      `${req.nextUrl.origin}/api/pilot-matches`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          send: true,
          lead_ids: [leadRecord.id],
          limit: 25,
        }),
      }
    )

    const pilotData = await pilotResponse
      .json()
      .catch(() => null)

    pilotMatch = {
      ok: pilotResponse.ok && pilotData?.ok !== false,
      triggered: true,
      status: pilotResponse.status,
      response: pilotData,
    }

    if (!pilotResponse.ok || pilotData?.ok === false) {
      console.error("pilot match webhook error:", pilotData)
    }
  } catch (err) {
    pilotMatch = {
      ok: false,
      triggered: true,
      error:
        err instanceof Error
          ? err.message
          : "Error disparando pilot matches",
    }

    console.error("pilot match trigger error:", err)
  }
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
  meta,
  tags,
  match_result: matchResult,
  pilot_match: pilotMatch,
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

