"use client"

import { useState, type FormEvent } from "react"
import TemporaryMediaPicker from "./TemporaryMediaPicker"
import { button, field, fieldLabel, panel } from "../brand"

const minimumDate = new Date().toISOString().slice(0, 10)

export default function TemporaryOwnerForm() {
  const [from, setFrom] = useState("")
  const [until, setUntil] = useState("")
  const [requiresDeposit, setRequiresDeposit] = useState(false)
  const [message, setMessage] = useState("")

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("Vista de desarrollo: la publicación todavía no se guarda. Activaremos el envío después de verificar Supabase y R2 aislados.")
  }

  return <form onSubmit={onSubmit} style={{ ...panel, maxWidth: 840, marginBottom: 72 }}>
    <div style={{ display: "grid", gap: 21 }}>
      <label style={fieldLabel}>Localidad o zona
        <input required name="locality" style={field} placeholder="Ej.: Mar Azul, Pinamar, Palermo" />
      </label>
      <label style={fieldLabel}>Referencia pública de ubicación
        <input required name="public_location_reference" style={field} placeholder="Ej.: a 100 metros de la playa" />
      </label>
      <label style={fieldLabel}>Título de la publicación
        <input required name="title" style={field} placeholder="Ej.: Casa entre pinos, a pasos del mar" />
      </label>
      <label style={fieldLabel}>Descripción
        <textarea required name="description" rows={4} style={field} placeholder="Contá qué tiene la propiedad, cómo es la zona y qué incluye." />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16 }}>
        <label style={fieldLabel}>Tipo de propiedad
          <select required name="property_type" defaultValue="" style={field}>
            <option value="" disabled>Elegí una opción</option>
            <option value="house">Casa</option>
            <option value="apartment">Departamento</option>
            <option value="cabin">Cabaña</option>
            <option value="other">Otro</option>
          </select>
        </label>
        <label style={fieldLabel}>Huéspedes máximos
          <input required type="number" name="max_guests" min="1" max="50" style={field} placeholder="Ej.: 4" />
        </label>
      </div>
      <label style={fieldLabel}>Precio por noche (ARS)
        <input required type="number" name="nightly_price" min="1" step="1" style={field} placeholder="Ej.: 120000" />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
        <label style={fieldLabel}>Disponible desde
          <input required type="date" name="available_from" min={minimumDate} value={from}
            onChange={event => { setFrom(event.target.value); if (until && event.target.value >= until) setUntil("") }} style={field} />
        </label>
        <label style={fieldLabel}>Disponible hasta (salida)
          <input required type="date" name="available_until" min={from || minimumDate} value={until}
            onChange={event => setUntil(event.target.value)} style={field} />
        </label>
      </div>
      <label style={fieldLabel}>¿Solicitás seña?
        <select name="deposit_required" value={requiresDeposit ? "yes" : "no"}
          onChange={event => setRequiresDeposit(event.target.value === "yes")} style={field}>
          <option value="no">No</option>
          <option value="yes">Sí, la acuerdo con el inquilino</option>
        </select>
      </label>
      {requiresDeposit && <label style={fieldLabel}>Condiciones de seña
        <textarea name="deposit_terms" rows={3} style={field}
          placeholder="Ej.: 20% del total, transferido directamente al propietario." />
      </label>}
      <TemporaryMediaPicker onFiles={() => {}} />
      <div style={{ padding: 18, background: "rgba(242,168,169,.22)", borderRadius: 16, border: "1px solid rgba(5,0,2,.1)" }}>
        <strong>¿Cuándo se bloquean las fechas?</strong>
        <p style={{ margin: "9px 0 0" }}>Solo después de la reserva y la seña, cuando corresponda, cuando propietario e inquilino aceptan expresamente bloquear las fechas. Un match o un comprobante no bloquean la propiedad.</p>
      </div>
      <p style={{ margin: 0, fontSize: 14 }}>La dirección exacta y los datos bancarios se mantienen privados. Esta versión permite completar el formulario para revisar su diseño, pero todavía no registra publicaciones.</p>
      <button type="submit" style={{ ...button, cursor: "pointer" }}>Comprobar formulario</button>
      {message && <p role="status" style={{ color: "#050002", margin: 0, fontWeight: 750 }}>{message}</p>}
    </div>
  </form>
}
