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
    <main className="cs-page">
      <style jsx global>{`
        .cs-page { min-height:100vh; background:#f2ebec; color:#050002; font-family:Inter,system-ui,sans-serif; overflow:hidden }
        .cs-page * {box-sizing:border-box}
        .cs-page header.cs-header {background:#f2ebec!important; color:#050002!important; max-width:1160px; margin:0 auto; min-height:92px; padding:0 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; border-bottom:1px solid rgba(5,0,2,.1)}
        .cs-page .cs-container {max-width:1160px; margin:0 auto; padding:55px 24px 84px}
        .cs-page .cs-hero {display:grid; grid-template-columns:minmax(0,1fr) minmax(0,.95fr); align-items:center; gap:58px}
        .cs-page .cs-kicker {display:inline-flex; background:#f2a8a9; color:#050002; padding:10px 17px; border-radius:999px; font-size:12px; font-weight:900; letter-spacing:.06em}
        .cs-page h1 {font-weight:950; line-height:1.02; letter-spacing:-.065em; font-size:clamp(43px,5.3vw,76px); margin:26px 0 22px}
        .cs-page .cs-accent {font-family:Georgia,'Times New Roman',serif; font-weight:500; font-style:italic; letter-spacing:-.055em; color:#a26473}
        .cs-page .cs-lead {font-size:clamp(17px,1.5vw,21px); line-height:1.55; color:#51464c; max-width:510px}
        .cs-page .cs-points {display:grid; gap:15px; margin:32px 0}
        .cs-page .cs-point {display:flex; gap:12px; align-items:center; font-size:15px; font-weight:750}
        .cs-page .cs-point-mark {display:grid; place-items:center; width:31px; height:31px; border-radius:50%; background:#e7c776; flex-shrink:0; font-weight:900}
        .cs-page .cs-mini {display:inline-flex; gap:8px; flex-wrap:wrap; font-size:12px; font-weight:800; color:#61575c; border-top:1px solid rgba(5,0,2,.12); padding-top:20px}
        .cs-page .cs-card {position:relative; background:white; border-radius:28px; border:1px solid rgba(5,0,2,.08); box-shadow:0 24px 65px rgba(5,0,2,.09); padding:clamp(24px,3.6vw,42px)}
        .cs-page .cs-card:before {content:"";position:absolute;top:-18px;right:24px;width:72px;height:35px;border-radius:60% 40% 55% 45%;background:#e7c776;z-index:-1;transform:rotate(14deg)}
        .cs-page .cs-form-title {font-size:clamp(23px,2vw,30px);line-height:1.12;letter-spacing:-.035em;margin:0 0 8px;font-weight:900}
        .cs-page .cs-form-note {font-size:14px;color:#665b60;line-height:1.5;margin:0 0 22px}
        .cs-page .cs-fields {display:grid;grid-template-columns:1fr 1fr;gap:15px}
        .cs-page .cs-field {display:block;font-size:13px;font-weight:800}
        .cs-page .cs-field input {display:block; width:100%; background:#faf8f8; border:1px solid #ded1d5; border-radius:12px; padding:15px 13px; color:#050002; font-size:16px; margin-top:8px; outline-color:#74bedc}
        .cs-page .cs-choices {border:0;margin:24px 0 0;padding:0;display:grid;gap:10px}
        .cs-page .cs-choices legend {font-size:15px;font-weight:900;margin-bottom:12px}
        .cs-page .cs-option {display:flex;align-items:flex-start;gap:12px;padding:16px;border:1px solid #e2d7da;border-radius:15px;background:#fff;cursor:pointer}
        .cs-page .cs-option.selected {border:2px solid #a26473;background:#fff5f6;padding:15px}
        .cs-page .cs-option input {accent-color:#a26473;margin-top:4px;flex-shrink:0}
        .cs-page .cs-option strong {display:block;font-size:14px;line-height:1.35}
        .cs-page .cs-option small {display:block;color:#61575c;line-height:1.45;margin-top:5px;font-size:12px}
        .cs-page .cs-button {width:100%;border:0;border-radius:999px;background:#050002;color:white;font-weight:900;font-size:16px;padding:17px 22px;cursor:pointer;margin-top:22px}
        .cs-page .cs-button:hover {background:#33292d}
        .cs-page .cs-button:focus-visible,.cs-page a:focus-visible {outline:3px solid #74bedc;outline-offset:3px}
        .cs-page .cs-result {margin-top:26px;padding:22px;background:#f9f2f3;border:1px solid #e7cdd5;border-radius:18px}
        .cs-page .cs-result h2 {font-size:24px;letter-spacing:-.04em;margin:0 0 12px}
        .cs-page .cs-result p {line-height:1.5}
        .cs-page .cs-price {font-size:29px;font-weight:950;letter-spacing:-.045em;margin:4px 0}
        .cs-page .cs-foot {max-width:1160px;margin:0 auto;padding:25px 24px 35px;border-top:1px solid rgba(5,0,2,.1);display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;font-size:13px;color:#61575c}
        @media(max-width:850px){.cs-page .cs-container{padding-top:30px}.cs-page .cs-hero{grid-template-columns:1fr;gap:30px}.cs-page h1{max-width:650px}.cs-page .cs-points{margin:23px 0}.cs-page .cs-card{max-width:680px;width:100%;margin:0 auto}}
        @media(max-width:460px){.cs-page .cs-fields{grid-template-columns:1fr}.cs-page header.cs-header{min-height:76px;padding:0 18px}.cs-page .cs-container{padding:28px 16px 60px}.cs-page .cs-card{padding:22px 18px}.cs-page .cs-kicker{font-size:10px}.cs-page h1{font-size:42px}}
      `}</style>
      <header className="cs-header">
        <VerloBrand width={45} />
        <a href="/mi-verlo" style={{fontSize:14,fontWeight:800,color:"#050002",textDecoration:"none"}}>Mi VERLO</a>
      </header>
      <div className="cs-container">
        <div className="cs-hero">
          <section>
            <span className="cs-kicker">SEGURO DE CAUCIÓN PARA TU ALQUILER</span>
            <h1>Alquilá con respaldo. <span className="cs-accent">Sin vueltas.</span></h1>
            <p className="cs-lead">La garantía que necesitás para dar el próximo paso. Elegí cómo querés avanzar y descubrí los beneficios de resolverlo todo desde VERLO.</p>
            <div className="cs-points">
              <div className="cs-point"><span className="cs-point-mark">✓</span> Sin depender de una garantía propietaria</div>
              <div className="cs-point"><span className="cs-point-mark">✓</span> Todo más simple, online y en un mismo lugar</div>
              <div className="cs-point"><span className="cs-point-mark">✓</span> 50% de bonificación en el contrato si contratás tu caución con VERLO</div>
            </div>
            <div className="cs-mini"><span>✓ PUBLICAR ES GRATIS</span><span>·</span><span>✓ CONTRATO CON FIRMA ELECTRÓNICA</span><span>·</span><span>✓ ACOMPAÑAMIENTO DIGITAL</span></div>
          </section>
          <section className="cs-card" aria-label="Simulador de seguro de caución">
            <h2 className="cs-form-title">Empezá por tu alquiler.</h2>
            <p className="cs-form-note">Son tres datos. Después elegís si querés sumar el contrato con firma electrónica.</p>
            <form onSubmit={onSimulate}>
              <div className="cs-fields">
                <label className="cs-field">Alquiler mensual (ARS)
                  <input type="number" inputMode="numeric" min="1" step="1" required value={rent} placeholder="Ej. 650000" onChange={e => { setRent(e.target.value); setShowResult(false) }} />
                </label>
                <label className="cs-field">Expensas (ARS)
                  <input type="number" inputMode="numeric" min="0" step="1" required value={expenses} onChange={e => { setExpenses(e.target.value); setShowResult(false) }} />
                </label>
                <label className="cs-field" style={{gridColumn:"1 / -1"}}>Duración del contrato (meses)
                  <input type="number" inputMode="numeric" min="1" max="120" step="1" required value={months} onChange={e => { setMonths(e.target.value); setShowResult(false) }} />
                </label>
              </div>
              <fieldset className="cs-choices">
                <legend>Elegí lo que necesitás</legend>
                <label className={"cs-option" + (choice === "solo_caucion" ? " selected" : "")}>
                  <input type="radio" name="service" checked={choice === "solo_caucion"} onChange={() => { setChoice("solo_caucion"); setShowResult(false) }} />
                  <span><strong>Solo seguro de caución</strong><small>Tu garantía para alquilar, sin sumar el contrato.</small></span>
                </label>
                <label className={"cs-option" + (choice === "caucion_con_contrato" ? " selected" : "")}>
                  <input type="radio" name="service" checked={choice === "caucion_con_contrato"} onChange={() => { setChoice("caucion_con_contrato"); setShowResult(false) }} />
                  <span><strong>Caución + contrato digital de alquiler con firma electrónica</strong><small>Si se confirma la caución con VERLO, tu contrato pasa de {money(119000)} a {money(59500)}.</small></span>
                </label>
              </fieldset>
              {error && <p role="alert" style={{color:"#a11631",fontWeight:750}}>{error}</p>}
              <button type="submit" className="cs-button">Descubrí tu opción →</button>
              <p style={{textAlign:"center",color:"#746970",fontSize:12,lineHeight:1.5,margin:"12px 0 0"}}>Sin cargo por consultar. La aprobación de la caución está sujeta a evaluación.</p>
            </form>
            {showResult && (
              <section className="cs-result" aria-live="polite">
                <h2>Ya tenés tu punto de partida.</h2>
                <p>Alquiler <strong>{money(Number(rent))}</strong> · Expensas <strong>{money(Number(expenses))}</strong> · Plazo <strong>{months} meses</strong></p>
                <p style={{fontWeight:900,marginBottom:3}}>Valor del seguro de caución</p>
                <div className="cs-price">A cotizar</div>
                <p style={{color:"#61575c",fontSize:14,marginTop:4}}>El importe definitivo se informará cuando esté disponible la cotización para tu operación. No calculamos ni prometemos un precio sin la fórmula oficial.</p>
                {choice === "caucion_con_contrato" && (
                  <div style={{borderTop:"1px solid #dfcdd1",paddingTop:15,marginTop:15}}>
                    <p style={{margin:"0 0 4px"}}>Contrato: <s>{money(119000)}</s></p>
                    <div style={{fontSize:26,fontWeight:950,letterSpacing:"-.04em"}}>Con bonificación: {money(59500)}</div>
                    <p style={{fontSize:12,color:"#61575c"}}>El 50% de descuento aplica únicamente con caución confirmada y pagada, asociada al mismo inquilino y contrato.</p>
                  </div>
                )}
                <button type="button" className="cs-button" onClick={continueToVerlo}>Quiero avanzar →</button>
                <p style={{fontSize:12,color:"#61575c",marginBottom:0}}>Continuás en el circuito actual de VERLO. Esta pantalla no genera una solicitud ni un cobro.</p>
              </section>
            )}
          </section>
        </div>
      </div>
      <footer className="cs-foot">
        <span>VERLO · Alquileres más simples para todos</span>
        <a href="mailto:soporte@verlo.lat" style={{color:"#050002",fontWeight:750}}>¿Necesitás ayuda? soporte@verlo.lat</a>
      </footer>
    </main>
  )
}
