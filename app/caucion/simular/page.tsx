"use client"

import { useEffect, useState } from "react"
import VerloBrand from "@/components/VerloBrand"
import { trackPostHog } from "@/lib/posthog-client"

type ProductChoice = "solo_caucion" | "caucion_con_contrato"
const money = (amount: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount)

function trackMeta(name: string, data: Record<string, string | number>) {
  if (typeof window === "undefined") return
  const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq
  if (typeof fbq === "function") fbq("trackCustom", name, data)
}

export default function CaucionSimulator() {
  const [rent, setRent] = useState("")
  const [expenses, setExpenses] = useState("0")
  const [months, setMonths] = useState("24")
  const [choice, setChoice] = useState<ProductChoice>("solo_caucion")
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    trackPostHog("caucion_simulator_viewed", { area: "powermarket" })
    trackMeta("CaucionSimulatorViewed", { product: "caucion" })
  }, [])

  const input: React.CSSProperties = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 7, padding: "14px", borderRadius: 12, border: "1px solid #d8cdd1", fontSize: 17, background: "#fff", color: "#050002" }
  const card: React.CSSProperties = { background: "#fff", border: "1px solid rgba(5,0,2,.1)", padding: "clamp(20px,5vw,40px)", borderRadius: 24, boxShadow: "0 15px 36px rgba(5,0,2,.05)" }
  const button: React.CSSProperties = { width: "100%", padding: "15px 24px", border: 0, borderRadius: 999, fontSize: 16, fontWeight: 850, background: "#050002", color: "#fff", cursor: "pointer" }

  function onSimulate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = Number(rent), x = Number(expenses), m = Number(months)
    if (!Number.isFinite(r) || r <= 0 || !Number.isFinite(x) || x < 0 || !Number.isInteger(m) || m < 1 || m > 120) {
      setError("Revisá el alquiler, las expensas y la duración.")
      setShowResult(false)
      return
    }
    setError("")
    setShowResult(true)
    trackPostHog("caucion_simulator_completed", { area: "powermarket", product: choice, duration_months: m })
    trackMeta("CaucionSimulatorCompleted", { product: choice, duration_months: m })
  }

  function continueToVerlo() {
    trackPostHog("caucion_simulator_continue_clicked", { area: "powermarket", product: choice })
    trackMeta("CaucionSimulatorContinue", { product: choice })
    try {
      sessionStorage.setItem("verlo_caucion_simulation", JSON.stringify({ choice, rent: Number(rent), expenses: Number(expenses), months: Number(months), timestamp: Date.now() }))
    } catch { /* Session storage may be unavailable */ }
    const original = new URLSearchParams(window.location.search)
    const next = new URLSearchParams()
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const value = original.get(key)
      if (value) next.set(key, value)
    }
    next.set("origen", "simulador_caucion")
    window.location.assign("/permanentes?" + next.toString())
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f2ebec", color: "#050002", fontFamily: "Inter,system-ui,sans-serif", padding: "0 20px 64px" }}>
      <header style={{ maxWidth: 1060, margin: "0 auto", minHeight: 88, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(5,0,2,.1)" }}>
        <VerloBrand width={44} />
        <a href="/mi-verlo" style={{ color: "#050002", fontSize: 14, fontWeight: 750 }}>Mi VERLO</a>
      </header>
      <section style={{ ...card, maxWidth: 660, margin: "38px auto" }}>
        <p style={{ fontSize: 12, color: "#a26473", fontWeight: 900, letterSpacing: ".12em" }}>SEGURO DE CAUCIÓN · VERLO + POWERMARKET</p>
        <h1 style={{ fontSize: "clamp(32px,5vw,50px)", letterSpacing: "-.055em", lineHeight: 1.08 }}>Tu garantía para alquilar, en un solo lugar.</h1>
        <p style={{ color: "#61575c", lineHeight: 1.55 }}>Simulá tu solicitud de seguro de caución y elegí si también querés hacer el contrato con VERLO.</p>
        <form onSubmit={onSimulate} style={{ display: "grid", gap: 20, marginTop: 28 }}>
          <label style={{ fontWeight: 750 }}>Alquiler mensual (ARS)
            <input type="number" inputMode="numeric" min="1" step="1" required value={rent} placeholder="Ej. 650000" onChange={e => { setRent(e.target.value); setShowResult(false) }} style={input} />
          </label>
          <label style={{ fontWeight: 750 }}>Expensas mensuales (ARS)
            <input type="number" inputMode="numeric" min="0" step="1" required value={expenses} onChange={e => { setExpenses(e.target.value); setShowResult(false) }} style={input} />
          </label>
          <label style={{ fontWeight: 750 }}>Duración del contrato (meses)
            <input type="number" inputMode="numeric" min="1" max="120" step="1" required value={months} onChange={e => { setMonths(e.target.value); setShowResult(false) }} style={input} />
          </label>
          <fieldset style={{ display: "grid", gap: 12, border: 0, margin: 0, padding: 0 }}>
            <legend style={{ fontWeight: 850, marginBottom: 12 }}>¿Qué necesitás?</legend>
            <label style={{ display: "flex", gap: 12, padding: 17, border: choice === "solo_caucion" ? "2px solid #050002" : "1px solid #d7cdd1", borderRadius: 15, background: choice === "solo_caucion" ? "#faf2f3" : "#fff", cursor: "pointer" }}>
              <input type="radio" name="service" checked={choice === "solo_caucion"} onChange={() => { setChoice("solo_caucion"); setShowResult(false) }} />
              <span><strong>Solo caución</strong><small style={{ display: "block", marginTop: 4, color: "#61575c" }}>No incluye el servicio de contrato VERLO.</small></span>
            </label>
            <label style={{ display: "flex", gap: 12, padding: 17, border: choice === "caucion_con_contrato" ? "2px solid #050002" : "1px solid #d7cdd1", borderRadius: 15, background: choice === "caucion_con_contrato" ? "#faf2f3" : "#fff", cursor: "pointer" }}>
              <input type="radio" name="service" checked={choice === "caucion_con_contrato"} onChange={() => { setChoice("caucion_con_contrato"); setShowResult(false) }} />
              <span><strong>Caución + contrato digital VERLO</strong><small style={{ display: "block", marginTop: 4, color: "#61575c" }}>Contrato regular: {money(119000)}. Con caución confirmada: {money(59500)}.</small></span>
            </label>
          </fieldset>
          {error && <p role="alert" style={{ color: "#a11631" }}>{error}</p>}
          <button type="submit" style={button}>Ver mi simulación</button>
        </form>
        {showResult && (
          <section aria-live="polite" style={{ background: "#faf2f3", border: "1px solid #e4d0d6", borderRadius: 18, padding: 22, marginTop: 25 }}>
            <h2 style={{ marginTop: 0 }}>Tu simulación</h2>
            <p>Alquiler: <strong>{money(Number(rent))}</strong> · Expensas: <strong>{money(Number(expenses))}</strong> · Duración: <strong>{months} meses</strong></p>
            <p style={{ fontWeight: 800, marginBottom: 3 }}>Precio del seguro de caución</p>
            <p style={{ fontSize: 27, fontWeight: 900, margin: "0 0 8px" }}>Pendiente de cotización</p>
            <p style={{ color: "#61575c", lineHeight: 1.55 }}>La prima se mostrará cuando PowerMarket confirme su fórmula de cálculo y condiciones.</p>
            {choice === "caucion_con_contrato" && (
              <div style={{ borderTop: "1px solid #decdd1", paddingTop: 16, marginTop: 18 }}>
                <p>Precio regular del contrato: <s>{money(119000)}</s></p>
                <p style={{ fontSize: 24, fontWeight: 900 }}>Contrato bonificado: {money(59500)}</p>
                <p style={{ fontSize: 13, color: "#61575c" }}>El descuento del 50% solo se aplica si la caución PowerMarket está pagada y confirmada, vinculada al mismo contrato y al mismo inquilino.</p>
              </div>
            )}
            <button type="button" style={button} onClick={continueToVerlo}>Continuar en VERLO</button>
            <p style={{ color: "#61575c", fontSize: 13 }}>Continuás por el circuito existente de VERLO. Esta pantalla no crea solicitudes ni realiza cobros.</p>
          </section>
        )}
      </section>
      <footer style={{ textAlign: "center", fontSize: 13, color: "#61575c" }}>¿Necesitás ayuda? <a href="mailto:soporte@verlo.lat" style={{ color: "#050002" }}>soporte@verlo.lat</a></footer>
    </main>
  )
}
