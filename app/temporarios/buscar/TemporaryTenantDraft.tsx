"use client"
import { useState, type FormEvent } from "react"
import ArgentinaLocationSelector from "@/components/ArgentinaLocationSelector"
import { tenantDraftFromForm } from "@/lib/temporarios/form-mapping"
import { panel, field, fieldLabel, button } from "../brand"
export default function TemporaryTenantDraft() {
  const [result, setResult] = useState("")
  function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = tenantDraftFromForm(new FormData(event.currentTarget))
    setResult(parsed.ok
      ? "Búsqueda lista: " + parsed.value.localityKeys.length + " zona(s), " + parsed.value.propertyType + ", presupuesto máximo $" + parsed.value.maxTotalBudgetArs.toLocaleString("es-AR")
      : parsed.error)
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
      <p style={{ margin: 0, fontSize: 14 }}>El presupuesto es por toda la estadía, no por noche. La tarifa de VERLO es $29.900 al habilitar el cierre.</p>
      <button type="submit" style={button}>Comprobar búsqueda (sin guardar)</button>
      {result && <p role="status" style={{ fontWeight: 800 }}>{result}</p>}
    </form>
  </section>
}
