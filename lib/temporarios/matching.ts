/**
 * VERLO Temporarios — pure matching rules.
 * No Supabase, network, side effects, payment or traditional VERLO imports.
 * Dates are local stay dates encoded as YYYY-MM-DD; checkout is exclusive.
 */
export type Stay = { checkIn: string; checkOut: string }
export type TemporaryDemand = Stay & {
  locality: string
  maxTotalBudgetArs: number
  guests?: number | null
}
export type TemporaryProperty = {
  locality: string
  nightlyPriceArs: number
  availabilityStart: string
  availabilityEnd: string
  maxGuests?: number | null
  status: "draft" | "published" | "paused" | "archived"
}
export type DateBlock = Stay
export type MatchDecision =
  | { compatible: true; nights: number; totalPriceArs: number }
  | { compatible: false; reason: "invalid_stay" | "unpublished" | "different_locality" | "unavailable_dates" | "blocked_dates" | "insufficient_capacity" | "invalid_price" | "over_budget" }

function dayIndex(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const [year, month, day] = date.split("-").map(Number)
  const milliseconds = Date.UTC(year, month - 1, day)
  const parsed = new Date(milliseconds)
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) return null
  return milliseconds / 86_400_000
}

export function stayNights(stay: Stay): number | null {
  const start = dayIndex(stay.checkIn)
  const end = dayIndex(stay.checkOut)
  if (start === null || end === null) return null
  const nights = end - start
  return nights >= 1 && nights <= 90 ? nights : null
}

export function overlaps(a: Stay, b: Stay): boolean {
  const aStart = dayIndex(a.checkIn)
  const aEnd = dayIndex(a.checkOut)
  const bStart = dayIndex(b.checkIn)
  const bEnd = dayIndex(b.checkOut)
  if (
    aStart === null || aEnd === null || bStart === null || bEnd === null ||
    aStart >= aEnd || bStart >= bEnd
  ) return false
  // Adjacent stays, e.g. checkout 15 and next checkin 15, do not overlap.
  return aStart < bEnd && bStart < aEnd
}

export function evaluateTemporaryMatch(
  demand: TemporaryDemand,
  property: TemporaryProperty,
  blocks: readonly DateBlock[] = [],
): MatchDecision {
  const nights = stayNights(demand)
  if (nights === null) return { compatible: false, reason: "invalid_stay" }
  if (property.status !== "published") return { compatible: false, reason: "unpublished" }
  const normalize = (name: string) =>
    name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es-AR").replace(/\s+/g, " ")
  if (!normalize(demand.locality) || normalize(demand.locality) !== normalize(property.locality))
    return { compatible: false, reason: "different_locality" }

  const start = dayIndex(demand.checkIn)
  const end = dayIndex(demand.checkOut)
  const from = dayIndex(property.availabilityStart)
  const until = dayIndex(property.availabilityEnd)
  if (start === null || end === null || from === null || until === null || from >= until ||
    start < from || end > until)
    return { compatible: false, reason: "unavailable_dates" }

  // A block may represent an external reservation or an expressly confirmed VERLO reservation.
  if (blocks.some(block => overlaps(demand, block)))
    return { compatible: false, reason: "blocked_dates" }

  if (demand.guests != null && (!Number.isInteger(demand.guests) || demand.guests < 1 ||
    (property.maxGuests != null && demand.guests > property.maxGuests)))
    return { compatible: false, reason: "insufficient_capacity" }
  if (!Number.isFinite(property.nightlyPriceArs) || property.nightlyPriceArs <= 0)
    return { compatible: false, reason: "invalid_price" }
  const totalPriceArs = Math.round(property.nightlyPriceArs * nights * 100) / 100
  if (!Number.isFinite(demand.maxTotalBudgetArs) || demand.maxTotalBudgetArs <= 0 ||
    totalPriceArs > demand.maxTotalBudgetArs)
    return { compatible: false, reason: "over_budget" }

  return { compatible: true, nights, totalPriceArs }
}

/**
 * Used only for presentation/eligibility; NOT a reservation lock.
 * The actual bilateral approval and overlap prevention must be enforced
 * atomically in PostgreSQL after verifying deposit receipt, if required.
 */
export function canRequestBilateralBlock(input: {
  tenantAccepted: boolean
  ownerAccepted: boolean
  depositRequired: boolean
  depositReceivedConfirmed: boolean
}): boolean {
  return input.tenantAccepted && input.ownerAccepted &&
    (!input.depositRequired || input.depositReceivedConfirmed)
}
