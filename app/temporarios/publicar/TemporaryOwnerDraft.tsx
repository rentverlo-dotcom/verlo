"use client"

import { useState } from "react"
import TemporaryMediaPicker from "./TemporaryMediaPicker"
import { panel, field, fieldLabel, button } from "../brand"

export default function TemporaryOwnerDraft() {
  const [locality, setLocality] = useState("")
  const [reference, setReference] = useState("")
  const [type, setType] = useState("casa")
  const [nightlyPrice, setNightlyPrice] = useState("")
  const [from, setFrom] = useState("")
  const [until, setUntil] = useState("")
  const [deposit, setDeposit] = useState("no")

  const price = Number(nightlyPrice)
  const datesValid = Boolean(from && until && until > from)
  const valid = Boolean(locality.trim() && reference.trim() && price > 0 && Number.isFinite(price) && datesValid)

  return <section style={{ ...panel, maxWidth: 800, marginBottom: 70 }}>
    <div style={{ display: "grid", gap: 20 }}>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#050002" }}>Vista previa interactiva — no publica ni guarda información.</p>
      <label style={fieldLabel}>Localidad o zona
        <input value={locality} onChange={event => setLocality(event.target.value)} style={field} placeholder="Ej.: Mar Azul, Pinamar, Palermo" />
      </label>
      <label style={fieldLabel}>Referencia pública de ubicación
        <input value={reference} onChange={event => setReference(event.target.value)} style={field} placeholder="Ej.: a 100 metros de la playa" />
      </label>
      <label style={fieldLabel}>Tipo de propiedad
        <select value={type} onChange={event => setType(event.target.value)} style={field}>
          <option value="casa">Casa</option><option value="departamento">Departamento</option><option value="otro">Otro</option>
        </select>
      </label>
      <label style={fieldLabel}>Precio por noche (ARS)
        <input type="number" min="1" value={nightlyPrice} onChange={event => setNightlyPrice(event.target.value)} style={field} placeholder="Ej.: 120000" />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
        <label style={fieldLabel}>Disponible desde
          <input type="date" value={from} onChange={event => setFrom(event.target.value)} style={field} />
        </label>
        <label style={fieldLabel}>Disponible hasta
          <input type="date" min={from || undefined} value={until} onChange={event => setUntil(event.target.value)} style={field} />
        </label>
      </div>
      <label style={fieldLabel}>¿Solicitás seña?
        <select value={deposit} onChange={event => setDeposit(event.target.value)} style={field}>
          <option value="no">No</option><option value="si">Sí, de acuerdo con el inquilino</option>
        </select>
      </label>
      <TemporaryMediaPicker />
      <div style={{ background: "rgba(242,168,169,.22)", padding: 18, borderRadius: 16, border: "1px solid rgba(5,0,2,.1)" }}>
        <strong>¿Cuándo se bloquean las fechas?</strong>
        <p style={{ margin: "9px 0 0" }}>Solo después de la reserva y la seña, si corresponde, cuando propietario e inquilino aceptan expresamente el bloqueo. Un match o un comprobante no bloquean la propiedad.</p>
      </div>
      <p style={{ margin: 0, fontSize: 14 }}>La dirección exacta y los datos bancarios serán privados. El propietario publica gratis.</p>
      <div style={{ padding: 18, background: "#fff", borderRadius: 16, border: "1px solid rgba(5,0,2,.12)" }}>
        <strong>Resumen de la publicación</strong>
        <p style={{ margin: "10px 0 4px" }}>{locality.trim() || "Localidad pendiente"} · {type}</p>
        <p style={{ margin: "4px 0" }}>{reference.trim() || "Referencia de ubicación pendiente"}</p>
        <p style={{ margin: "4px 0" }}>{price > 0 && Number.isFinite(price) ? price.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }) + " / noche" : "Precio pendiente"}</p>
        <p style={{ margin: "4px 0" }}>Disponibilidad: {datesValid ? from + " a " + until : "fechas pendientes"}</p>
        <p style={{ margin: "4px 0" }}>Seña: {deposit === "si" ? "opcional, a acordar" : "no solicitada"}</p>
      </div>
      <button type="button" disabled style={{ ...button, opacity: .5, cursor: "not-allowed" }}>
        {valid ? "Vista previa lista · Guardado pendiente" : "Completá los datos para ver el resumen"}
      </button>
      <p style={{ margin: 0, fontSize: 13 }}>Los datos y las fotos permanecen únicamente en este navegador durante esta vista. No se envían a VERLO, R2 ni Supabase.</p>
    </div>
  </section>
}
