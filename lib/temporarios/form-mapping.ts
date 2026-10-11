import type { TemporaryDemand, TemporaryProperty, TemporaryPropertyType } from "./matching"

type Location = { key?: string; label?: string }
export type DraftResult<T> = { ok: true; value: T } | { ok: false; error: string }
const types = ["casa", "departamento", "cabana", "habitacion"]
const isType = (s: string): s is TemporaryPropertyType => types.includes(s)
function locations(form: FormData, name: string): Location[] {
  try {
    const parsed: unknown = JSON.parse(String(form.get(name) || "[]"))
    return Array.isArray(parsed) ? parsed.filter((item): item is Location =>
      !!item && typeof item.key === "string" && item.key.startsWith("ar:")) : []
  } catch { return [] }
}
export function ownerDraftFromForm(form: FormData): DraftResult<TemporaryProperty> {
  const location = locations(form, "temporary_location_data")[0]
  const propertyType = String(form.get("propertyType") || "")
  const nightlyPriceArs = Number(form.get("nightlyPriceArs"))
  const availabilityStart = String(form.get("availabilityStart") || "")
  const availabilityEnd = String(form.get("availabilityEnd") || "")
  if (!location?.key || !isType(propertyType) || !(nightlyPriceArs > 0) ||
    !Number.isFinite(nightlyPriceArs) || !availabilityStart || !availabilityEnd || availabilityEnd <= availabilityStart)
    return { ok: false, error: "Completá ubicación Georef, tipo, precio y fechas válidas." }
  return { ok: true, value: { localityKey: location.key, propertyType, nightlyPriceArs,
    availabilityStart, availabilityEnd, status: "published" } }
}
export function tenantDraftFromForm(form: FormData): DraftResult<TemporaryDemand> {
  const localityKeys = locations(form, "temporary_locations_data").map(l => l.key!).filter(Boolean)
  const propertyType = String(form.get("propertyType") || "")
  const checkIn = String(form.get("checkIn") || "")
  const checkOut = String(form.get("checkOut") || "")
  const maxTotalBudgetArs = Number(form.get("maxTotalBudgetArs"))
  if (!localityKeys.length || !isType(propertyType) || !checkIn || !checkOut ||
    checkOut <= checkIn || !(maxTotalBudgetArs > 0) || !Number.isFinite(maxTotalBudgetArs))
    return { ok: false, error: "Seleccioná al menos una zona Georef, tipo, fechas y presupuesto total." }
  return { ok: true, value: { localityKeys, propertyType, checkIn, checkOut, maxTotalBudgetArs } }
}
