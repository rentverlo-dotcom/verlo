"use client"
import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import ArgentinaLocationSelector from "@/components/ArgentinaLocationSelector"
import { tenantDraftFromForm } from "@/lib/temporarios/form-mapping"
import { panel, field, fieldLabel, button } from "../brand"
export default function TemporaryTenantDraft() {
  const [result, setResult] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  async function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = tenantDraftFromForm(new FormData(event.currentTarget))
    if (!parsed.ok) { setResult("error" in parsed ? parsed.error : "Datos inválidos"); return }
    setResult("Validando búsqueda...")
    try {
      const response = await fetch("/api/temporarios/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "tenant", ...parsed.value }),
      })
      const data: { ok?: boolean; error?: string } = await response.json()
      setResult(response.ok && data.ok
        ? "Búsqueda validada por VERLO. No se guardaron datos ni se generaron matches."
        : data.error || "No se pudo validar la búsqueda.")
    } catch { setResult("Error de conexión. No se guardaron datos.") }
  }
  async function save(form: HTMLFormElement) {
    if (saving) return
    const payload = new FormData(form)
    const parsed = tenantDraftFromForm(payload)
    if (!parsed.ok) { setResult("error" in parsed ? parsed.error : "Datos inválidos"); return }
    const fullName = String(payload.get("fullName") || "").trim()
    const phone = String(payload.get("phone") || "").trim()
    if (!fullName || !phone) { setResult("Completá nombre y teléfono."); return }
    setSaving(true)
    setResult("Comprobando acceso...")
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) {
        setResult("Para guardar, ingresá a VERLO con tu email. No se guardó la búsqueda.")
        return
      }
      const response = await fetch("/api/temporarios/demands", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
        body: JSON.stringify({ ...parsed.value, fullName, phone }),
      })
      const data: { ok?: boolean; id?: string; error?: string } = await response.json()
      if (!response.ok || !data.ok || !data.id) {
        setResult(data.error === "Temporary writes are disabled"
          ? "El guardado todavía está deshabilitado en este Preview. No se guardó la búsqueda."
          : data.error || "No se pudo guardar la búsqueda.")
        return
      }
      router.push("/temporarios/success/inquilino?registro=" + encodeURIComponent(data.id))
    } catch { setResult("Error de conexión. No se guardó la búsqueda.") }
    finally { setSaving(false) }
  }
  return <section style={{ ...panel, marginBottom: 70, maxWidth: 800 }}>
    <form onSubmit={check} style={{ display: "grid", gap: 20 }}>
      <p style={{ fontSize: 14, margin: 0 }}>Vista previa interactiva. No guarda datos ni genera coincidencias reales.</p>
      <label style={fieldLabel}>Tipo de propiedad
        <select name="propertyType" style={field} defaultValue="" required>
          <option value="" disabled>Elegí una opción</option>
          <option value="casa">Casa</option>
          <option value="departamento">Departamento</option>
          <option value="cabana">Cabaña</option>
          <option value="habitacion">Habitación</option>
        </select>
      </label>
      <div style={fieldLabel}>Zonas donde buscás (Georef)
        <ArgentinaLocationSelector mode="multi" className="temporary-georef" labelName="temporary_locations_labels" keyName="temporary_locations_keys" dataName="temporary_locations_data" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
        <label style={fieldLabel}>Fecha de entrada<input type="date" name="checkIn" style={field} required /></label>
        <label style={fieldLabel}>Fecha de salida<input type="date" name="checkOut" style={field} required /></label>
      </div>
      <label style={fieldLabel}>Presupuesto total de la estadía (ARS)
        <input type="number" name="maxTotalBudgetArs" min="1" style={field} placeholder="Ej.: 1200000" required />
      </label>
      <label style={fieldLabel}>Nombre y apellido
        <input name="fullName" style={field} maxLength={120} required autoComplete="name" placeholder="Tu nombre completo" />
      </label>
      <label style={fieldLabel}>Teléfono de contacto
        <input name="phone" type="tel" style={field} maxLength={30} required autoComplete="tel" placeholder="Ej.: +54 11 5555 5555" />
      </label>
      <p style={{ margin: 0, fontSize: 14 }}>El presupuesto es por toda la estadía, no por noche. La tarifa de VERLO es $29.900 al habilitar el cierre.</p>
      <button type="submit" style={button}>Comprobar búsqueda (sin guardar)</button>
      <button type="button" disabled={saving} onClick={event => { const form = event.currentTarget.closest("form"); if (form) void save(form) }} style={{...button,opacity:saving?0.6:1}}>{saving ? "Comprobando..." : "Guardar búsqueda (requiere acceso)"}</button>
      {result && <p role="status" style={{ fontWeight: 800 }}>{result}</p>}
    </form>
  </section>
}
