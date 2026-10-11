"use client"

import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ownerDraftFromForm } from "@/lib/temporarios/form-mapping"
import TemporaryMediaPicker from "./TemporaryMediaPicker"
import ArgentinaLocationSelector from "@/components/ArgentinaLocationSelector"
import { panel, field, fieldLabel, button } from "../brand"

export default function TemporaryOwnerDraft() {
  const [reference, setReference] = useState("")
  const [type, setType] = useState("casa")
  const [nightlyPrice, setNightlyPrice] = useState("")
  const [from, setFrom] = useState("")
  const [until, setUntil] = useState("")
  const [deposit, setDeposit] = useState("no")
  const [result, setResult] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  async function check(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const parsed = ownerDraftFromForm(new FormData(e.currentTarget))
    if (!parsed.ok) { setResult("error" in parsed ? parsed.error : "Datos inválidos"); return }
    setResult("Validando datos...")
    try {
      const response = await fetch("/api/temporarios/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "owner", ...parsed.value }),
      })
      const data: { ok?: boolean; error?: string } = await response.json()
      setResult(response.ok && data.ok
        ? "Datos validados por VERLO. Esta vista no guarda ni publica propiedades."
        : data.error || "No se pudieron validar los datos.")
    } catch { setResult("Error de conexión. No se guardaron datos.") }
  }

  async function save(form: HTMLFormElement) {
    if (saving) return
    const formData = new FormData(form)
    const parsed = ownerDraftFromForm(formData)
    if (!parsed.ok) { setResult("error" in parsed ? parsed.error : "Datos inválidos"); return }
    const fullName = String(formData.get("fullName") || "").trim()
    const phone = String(formData.get("phone") || "").trim()
    const localityLabel = String(formData.get("temporary_location_label") || "").trim()
    if (!fullName || !phone || !localityLabel) { setResult("Completá nombre, teléfono y ubicación."); return }
    setSaving(true)
    setResult("Comprobando acceso...")
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) {
        setResult("Para guardar, ingresá a VERLO con tu email. Tus datos todavía no fueron guardados.")
        return
      }
      const response = await fetch("/api/temporarios/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
        body: JSON.stringify({
          ...parsed.value, localityLabel, fullName, phone,
          publicLocationReference: reference, depositRequired: deposit === "si",
        }),
      })
      const data: { ok?: boolean; id?: string; error?: string } = await response.json()
      if (!response.ok || !data.ok || !data.id) {
        setResult(data.error === "Temporary writes are disabled"
          ? "El guardado todavía está deshabilitado en este Preview. No se guardó la publicación."
          : data.error || "No se pudo guardar la publicación.")
        return
      }
      router.push("/temporarios/success/propietario?registro=" + encodeURIComponent(data.id))
    } catch { setResult("Error de conexión. No se guardó la publicación.") }
    finally { setSaving(false) }
  }
  const price = Number(nightlyPrice)
  const datesValid = Boolean(from && until && until > from)
  const valid = Boolean(reference.trim() && price > 0 && Number.isFinite(price) && datesValid)

  return <section style={{ ...panel, maxWidth: 800, marginBottom: 70 }}><form onSubmit={check}>
    <div style={{ display: "grid", gap: 20 }}>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#050002" }}>Vista previa interactiva — no publica ni guarda información.</p>
      <div style={fieldLabel}>Ubicación (Georef)
        <ArgentinaLocationSelector mode="single" className="temporary-georef" labelName="temporary_location_label" keyName="temporary_location_key" dataName="temporary_location_data" />
      </div>
      <label style={fieldLabel}>Referencia pública de ubicación
        <input value={reference} onChange={event => setReference(event.target.value)} style={field} placeholder="Ej.: a 100 metros de la playa" />
      </label>
      <label style={fieldLabel}>Tipo de propiedad
        <select name="propertyType" value={type} onChange={event => setType(event.target.value)} style={field}>
          <option value="casa">Casa</option><option value="departamento">Departamento</option><option value="cabana">Cabaña</option><option value="habitacion">Habitación</option>
        </select>
      </label>
      <label style={fieldLabel}>Precio por noche (ARS)
        <input name="nightlyPriceArs" type="number" min="1" value={nightlyPrice} onChange={event => setNightlyPrice(event.target.value)} style={field} placeholder="Ej.: 120000" />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
        <label style={fieldLabel}>Disponible desde
          <input name="availabilityStart" type="date" value={from} onChange={event => setFrom(event.target.value)} style={field} />
        </label>
        <label style={fieldLabel}>Disponible hasta
          <input name="availabilityEnd" type="date" min={from || undefined} value={until} onChange={event => setUntil(event.target.value)} style={field} />
        </label>
      </div>
      <label style={fieldLabel}>¿Solicitás seña?
        <select value={deposit} onChange={event => setDeposit(event.target.value)} style={field}>
          <option value="no">No</option><option value="si">Sí, de acuerdo con el inquilino</option>
        </select>
      </label>
      <label style={fieldLabel}>Nombre y apellido
        <input name="fullName" style={field} maxLength={120} required autoComplete="name" placeholder="Tu nombre completo" />
      </label>
      <label style={fieldLabel}>Teléfono de contacto
        <input name="phone" type="tel" style={field} maxLength={30} required autoComplete="tel" placeholder="Ej.: +54 11 5555 5555" />
      </label>
      <TemporaryMediaPicker />
      <div style={{ background: "rgba(242,168,169,.22)", padding: 18, borderRadius: 16, border: "1px solid rgba(5,0,2,.1)" }}>
        <strong>¿Cuándo se bloquean las fechas?</strong>
        <p style={{ margin: "9px 0 0" }}>Solo después de la reserva y la seña, si corresponde, cuando propietario e inquilino aceptan expresamente el bloqueo. Un match o un comprobante no bloquean la propiedad.</p>
      </div>
      <p style={{ margin: 0, fontSize: 14 }}>La dirección exacta y los datos bancarios serán privados. El propietario publica gratis.</p>
      <div style={{ padding: 18, background: "#fff", borderRadius: 16, border: "1px solid rgba(5,0,2,.12)" }}>
        <strong>Resumen de la publicación</strong>
        <p style={{ margin: "10px 0 4px" }}>Ubicación seleccionada arriba · {type}</p>
        <p style={{ margin: "4px 0" }}>{reference.trim() || "Referencia de ubicación pendiente"}</p>
        <p style={{ margin: "4px 0" }}>{price > 0 && Number.isFinite(price) ? price.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }) + " / noche" : "Precio pendiente"}</p>
        <p style={{ margin: "4px 0" }}>Disponibilidad: {datesValid ? from + " a " + until : "fechas pendientes"}</p>
        <p style={{ margin: "4px 0" }}>Seña: {deposit === "si" ? "opcional, a acordar" : "no solicitada"}</p>
      </div>
      <button type="submit" style={button}>Comprobar datos del matching (sin guardar)</button>
      <button type="button" disabled={saving} onClick={event => { const form = event.currentTarget.closest("form"); if (form) void save(form) }} style={{...button,opacity:saving?0.6:1}}>{saving ? "Comprobando..." : "Guardar publicación (requiere acceso)"}</button>
      {result && <p role="status" style={{ fontWeight: 800 }}>{result}</p>}
      <p style={{ margin: 0, fontSize: 13 }}>La comprobación no guarda datos. Guardar requiere una sesión verificada y la habilitación del backend. Las fotos son solo una vista local: todavía no se suben a R2.</p>
    </div></form>
  </section>
}
