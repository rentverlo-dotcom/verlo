import type { TemporaryDemand, TemporaryProperty, TemporaryPropertyType } from "./matching"
import { stayNights } from "./matching"

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
  if (!localityKeys.length) return { ok: false, error: "Elegí al menos una localidad." }
  if (!isType(propertyType)) return { ok: false, error: "Elegí un tipo de propiedad." }
  if (!checkIn || !checkOut) return { ok: false, error: "Seleccioná las fechas de entrada y salida." }
  if (checkOut <= checkIn) return { ok: false, error: "La fecha de salida tiene que ser posterior a la entrada." }
  if (stayNights({ checkIn, checkOut }) === null)
    return { ok: false, error: "La estadía debe ser de 1 a 90 noches." }
  if (!(maxTotalBudgetArs > 0) || !Number.isFinite(maxTotalBudgetArs))
    return { ok: false, error: "Ingresá un presupuesto total válido." }
  return { ok: true, value: { localityKeys, propertyType, checkIn, checkOut, maxTotalBudgetArs } }
}
