"use client"

import { FormEvent, useEffect, useState } from "react"
import VerloBrand from "@/components/VerloBrand"

type Path = "owner" | "tenant" | "renewal"

const pathConfig = {
  owner: {
    title: "Tengo una propiedad",
    subtitle: "Dejanos tus datos y te avisamos cuando haya interesados compatibles.",
    role: "owner",
    intent: "owner_new_listing",
    button: "Quiero recibir interesados",
  },
  tenant: {
    title: "Busco alquilar",
    subtitle: "Contanos qué buscás y te avisamos cuando haya propiedades compatibles.",
    role: "tenant",
    intent: "tenant_search",
    button: "Quiero recibir opciones",
  },
  renewal: {
    title: "Quiero renovar mi contrato",
    subtitle: "Registrá tu caso y te contactamos para ordenar la renovación.",
    role: "both",
    intent: "contract_renewal",
    button: "Quiero renovar con Verlo",
  },
} as const

const styles = `
  .verlo-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --blue: #74bedc;
    --yellow: #e7c776;
    min-height: 100vh;
    background: var(--soft);
    color: var(--black);
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .verlo-root * {
    box-sizing: border-box;
  }

  .container {
    width: min(1160px, calc(100% - 40px));
    margin: 0 auto;
  }

  .nav {
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(18px);
    background: rgba(242, 235, 236, 0.78);
    border-bottom: 1px solid rgba(5, 0, 2, 0.08);
  }

  .nav-inner {
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 18px;
    font-size: 14px;
  }

  .nav-links a {
    color: rgba(5, 0, 2, 0.72);
    text-decoration: none;
    font-weight: 800;
  }

  .nav-cta {
    padding: 10px 18px;
    border-radius: 999px;
    background: var(--black);
    color: white !important;
  }

  .hero {
    position: relative;
    padding: 88px 0 80px;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 1.02fr 0.98fr;
    gap: 64px;
    align-items: center;
  }

  .hero h1 {
    margin: 22px 0 0;
    font-size: clamp(54px, 7.4vw, 104px);
    line-height: 0.96;
    letter-spacing: -0.055em;
    font-weight: 950;
    max-width: 820px;
  }

  .hero h1 em {
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 400;
    letter-spacing: -0.035em;
  }

  .hero p {
    margin: 28px 0 0;
    max-width: 620px;
    font-size: 21px;
    line-height: 1.45;
    color: rgba(5, 0, 2, 0.68);
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 34px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 54px;
    padding: 0 24px;
    border-radius: 999px;
    border: 1px solid rgba(5, 0, 2, 0.12);
    text-decoration: none;
    font-size: 16px;
    font-weight: 900;
    transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
    cursor: pointer;
  }

  .btn:hover {
    transform: translateY(-2px);
  }

  .btn-primary {
    background: var(--black);
    color: white;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
  }

  .btn-secondary {
    background: white;
    color: var(--black);
  }

  .trust-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 26px;
  }

  .pill {
    padding: 9px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.54);
    border: 1px solid rgba(5, 0, 2, 0.08);
    color: rgba(5, 0, 2, 0.7);
    font-weight: 750;
    font-size: 13px;
  }

  .hero-video-wrap {
    position: relative;
    min-height: 640px;
    display: grid;
    place-items: center;
  }

  .hero-video-frame {
    position: relative;
    width: min(420px, 84vw);
    aspect-ratio: 390 / 760;
    border: 10px solid var(--black);
    border-radius: 48px;
    overflow: hidden;
    background: #fbf8f5;
    box-shadow: 0 30px 90px rgba(5, 0, 2, 0.28);
    z-index: 2;
  }

  .hero-video-frame iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }

  .hero-video-glow {
    position: absolute;
    width: 520px;
    height: 520px;
    border-radius: 999px;
    background:
      radial-gradient(circle at 30% 35%, rgba(242, 168, 169, 0.85), transparent 30%),
      radial-gradient(circle at 76% 72%, rgba(116, 190, 220, 0.55), transparent 28%),
      radial-gradient(circle at 78% 22%, rgba(231, 199, 118, 0.42), transparent 24%);
    filter: blur(8px);
    opacity: 0.9;
    z-index: 1;
  }

  .section {
    padding: 92px 0;
  }

  .section-header {
    max-width: 760px;
    margin-bottom: 42px;
  }

  .kicker {
    margin: 0 0 14px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 12px;
    font-weight: 950;
    color: var(--pink-dark);
  }

  .section-title {
    margin: 0;
    font-size: clamp(40px, 5.5vw, 76px);
    line-height: 0.95;
    letter-spacing: -0.075em;
    font-weight: 950;
  }

  .section-title em {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 400;
    font-style: italic;
  }

  .section-copy {
    margin: 18px 0 0;
    font-size: 19px;
    line-height: 1.55;
    color: rgba(5, 0, 2, 0.68);
  }

  .path-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    margin-bottom: 28px;
  }

  .path-card {
    padding: 28px;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.58);
    border: 1px solid rgba(5, 0, 2, 0.08);
    cursor: pointer;
    text-align: left;
    color: var(--black);
    transition: 160ms ease;
  }

  .path-card.active {
    background: var(--black);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
  }

  .path-card strong {
    display: block;
    font-size: 24px;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .path-card span {
    display: block;
    margin-top: 10px;
    font-size: 14px;
    line-height: 1.4;
    opacity: 0.72;
  }

  .form-card {
    border-radius: 42px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(5, 0, 2, 0.08);
    box-shadow: 0 28px 80px rgba(5, 0, 2, 0.08);
  }

  .form-head h3 {
    margin: 0;
    font-size: clamp(36px, 4vw, 58px);
    line-height: 0.95;
    letter-spacing: -0.075em;
    font-weight: 950;
  }

  .form-head p {
    margin: 14px 0 0;
    color: rgba(5, 0, 2, 0.64);
    line-height: 1.5;
    font-size: 17px;
  }

  .form {
    margin-top: 30px;
    display: grid;
    gap: 14px;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .input,
  .select {
    width: 100%;
    min-height: 56px;
    border: 1px solid rgba(5, 0, 2, 0.12);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.86);
    padding: 0 16px;
    color: var(--black);
    font-size: 15px;
    outline: none;
  }

  .input:focus,
  .select:focus {
    border-color: var(--pink-dark);
    box-shadow: 0 0 0 5px rgba(195, 121, 134, 0.12);
    background: white;
  }

  .submit {
    min-height: 58px;
    border-radius: 999px;
    border: 1px solid rgba(5, 0, 2, 0.12);
    background: var(--black);
    color: white;
    font-size: 16px;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
  }

  .submit:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .error,
  .success {
    margin: 0;
    padding: 14px 16px;
    border-radius: 18px;
    font-size: 14px;
    font-weight: 850;
  }

  .error {
    background: rgba(195, 121, 134, 0.14);
    color: #7f2435;
  }

  .success {
    background: rgba(116, 190, 220, 0.16);
    color: #255a6d;
  }

  .footer {
    padding: 42px 0;
    border-top: 1px solid rgba(5, 0, 2, 0.1);
  }

  .footer-inner {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: center;
    color: rgba(5, 0, 2, 0.58);
    font-size: 14px;
  }

  @media (max-width: 980px) {
    .hero-grid {
      grid-template-columns: 1fr;
    }

    .path-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .container {
      width: min(100% - 28px, 1160px);
    }

    .nav-inner {
      height: 66px;
    }

    .hero {
      padding: 58px 0 54px;
    }

    .hero p {
      font-size: 18px;
    }

    .hero-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }

    .hero-video-wrap {
      min-height: 560px;
    }

    .hero-video-frame {
      width: min(340px, 90vw);
    }

    .row {
      grid-template-columns: 1fr;
    }

    .form-card {
      padding: 28px;
      border-radius: 32px;
    }

    .footer-inner {
      flex-direction: column;
      align-items: flex-start;
    }

    .confetti {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 999;
}

.confetti span {
  position: absolute;
  top: -20px;
  left: calc((var(--i) * 3.125%) + 1%);
  width: 10px;
  height: 16px;
  border-radius: 4px;
  background: hsl(calc(var(--i) * 24), 85%, 62%);
  animation: confetti-fall 2.4s ease-in forwards;
  animation-delay: calc((var(--i) % 8) * 0.08s);
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-20px) rotate(0deg);
    opacity: 1;
  }

  100% {
    transform: translateY(110vh) rotate(720deg);
    opacity: 0;
  }
}
  }
`

function trackMetaEvent(eventName: string, params?: Record<string, string>) {
  if (typeof window !== "undefined") {
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq

    if (typeof fbq === "function") {
      fbq("trackCustom", eventName, params)
    }
  }
}

export default function TestCaptacionPage() {
  const [path, setPath] = useState<Path>("owner")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showConfetti, setShowConfetti] = useState(false)

useEffect(() => {
  if (!showConfetti) return

  const timer = window.setTimeout(() => {
    setShowConfetti(false)
  }, 2600)

  return () => window.clearTimeout(timer)
}, [showConfetti])
  const selected = pathConfig[path]

  function choosePath(nextPath: Path) {
    setPath(nextPath)
    setError("")
    setSuccess("")
    trackMetaEvent("Lead_Intake_Path_Click", { path: nextPath })
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const form = e.currentTarget
    const formData = new FormData(form)
    const eventId =
  `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`

    const payload = {
      full_name: String(formData.get("full_name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      role:
        path === "renewal"
          ? String(formData.get("renewal_role") || "both").trim()
          : selected.role,
      intent: selected.intent,
      zone: String(formData.get("zone") || "").trim(),
      property_type: String(formData.get("property_type") || "").trim(),
      availability_status: String(formData.get("availability_status") || "").trim(),
      approx_price: String(formData.get("approx_price") || "").trim(),
      desired_property_type: String(formData.get("desired_property_type") || "").trim(),
      budget_range: String(formData.get("budget_range") || "").trim(),
      move_timing: String(formData.get("move_timing") || "").trim(),
      renewal_role: String(formData.get("renewal_role") || "").trim(),
      contract_expiration: String(formData.get("contract_expiration") || "").trim(),
      other_party_status: String(formData.get("other_party_status") || "").trim(),
      renewal_need: String(formData.get("renewal_need") || "").trim(),
      event_id: eventId,
      event_source_url: window.location.href,
      metadata: {
        path,
        page: "test_captacion",
      },
    }

    try {
     
        const res = await fetch("/api/ghl-lead-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "No pudimos guardar tus datos")
      }

      trackMetaEvent("Lead_Intake_Submitted", {
        path,
        role: payload.role,
        intent: payload.intent,
      })

           form.reset()
      setShowConfetti(true)

      if (path === "owner") {
        setSuccess(
          "Listo. Ya tenemos tus datos. Te vamos a escribir cuando haya interesados compatibles."
        )
      }

      if (path === "tenant") {
        setSuccess(
          "Listo. Ya sabemos qué estás buscando. Te vamos a avisar cuando haya propiedades compatibles."
        )
      }

      if (path === "renewal") {
        setSuccess(
          "Listo. Ya registramos tu caso de renovación. Te vamos a contactar para ordenar los próximos pasos."
        )
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("No pudimos guardar tus datos")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="verlo-root">
      <style>{styles}</style>

      <div className="verlo-page">
        <header className="nav">
          <div className="container nav-inner">
            <VerloBrand width={112} />

            <nav className="nav-links">
              <a href="#captacion">Qué querés hacer</a>
              <a href="#captacion" className="nav-cta">
                Sumate
              </a>
            </nav>
          </div>
        </header>

        <section className="hero">
          <div className="container hero-grid">
            <div>
              <h1>
                Alquilá directo, <em>seguro y sin comisión.</em>
              </h1>

              <p>
                En Verlo conectás directo con la otra parte, validás identidad y avanzás
                hacia un contrato digital más simple, seguro y económico.
              </p>

              <div className="hero-actions">
                <a className="btn btn-primary" href="#captacion" onClick={() => choosePath("owner")}>
                  Tengo una propiedad
                </a>

                <a className="btn btn-secondary" href="#captacion" onClick={() => choosePath("tenant")}>
                  Busco alquilar
                </a>

                <a className="btn btn-secondary" href="#captacion" onClick={() => choosePath("renewal")}>
                  Quiero renovar
                </a>
              </div>

              <div className="trust-row">
                <span className="pill">Sin comisión inmobiliaria</span>
                <span className="pill">Identidad validada</span>
                <span className="pill">Contrato digital</span>
                <span className="pill">App disponible próximamente</span>
              </div>
            </div>

            <div className="hero-video-wrap" aria-hidden="true">
              <div className="hero-video-glow" />

              <div className="hero-video-frame">
                <iframe
                  src="/mockup-lab?key=verlo-demo-2026"
                  title="Video demo Verlo"
                  loading="eager"
                  allow="autoplay"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="captacion">
          <div className="container">
            <div className="section-header">
              <p className="kicker">Validación inicial</p>
              <h2 className="section-title">
                ¿Qué querés hacer con <em>Verlo?</em>
              </h2>
              <p className="section-copy">
                Dejanos tus datos y te contactamos por WhatsApp cuando haya una oportunidad
                compatible con tu caso.
              </p>
            </div>

            <div className="path-grid">
              <button
                type="button"
                className={`path-card ${path === "owner" ? "active" : ""}`}
                onClick={() => choosePath("owner")}
              >
                <strong>Tengo una propiedad</strong>
                <span>Registrá interés sin cargar fotos ni publicación completa.</span>
              </button>

              <button
                type="button"
                className={`path-card ${path === "tenant" ? "active" : ""}`}
                onClick={() => choosePath("tenant")}
              >
                <strong>Busco alquilar</strong>
                <span>Contanos zona, presupuesto y qué tipo de propiedad buscás.</span>
              </button>

              <button
                type="button"
                className={`path-card ${path === "renewal" ? "active" : ""}`}
                onClick={() => choosePath("renewal")}
              >
                <strong>Quiero renovar</strong>
                <span>Registrá un caso de renovación para ordenarlo con Verlo.</span>
              </button>
            </div>

            <div className="form-card">
              <div className="form-head">
                <h3>{selected.title}</h3>
                <p>{selected.subtitle}</p>
              </div>

              <form className="form" onSubmit={handleSubmit}>
                <div className="row">
                  <input className="input" name="full_name" placeholder="Nombre y apellido" required />
                  <input className="input" name="phone" placeholder="WhatsApp" required />
                </div>

                <input className="input" name="email" type="email" placeholder="Email" required />

                {path === "owner" && (
                  <>
                    <div className="row">
                      <input className="input" name="zone" placeholder="Zona de la propiedad" required />

                      <select className="select" name="property_type" required defaultValue="">
                        <option value="" disabled>
                          Tipo de propiedad
                        </option>
                        <option>Departamento</option>
                        <option>Casa</option>
                        <option>PH</option>
                        <option>Local</option>
                        <option>Oficina</option>
                        <option>Otro</option>
                      </select>
                    </div>

                    <div className="row">
                      <select className="select" name="availability_status" required defaultValue="">
                        <option value="" disabled>
                          Disponibilidad
                        </option>
                        <option>Disponible ahora</option>
                        <option>Disponible pronto</option>
                        <option>Estoy evaluando alquilar</option>
                      </select>

                      <input className="input" name="approx_price" placeholder="Precio aproximado opcional" />
                    </div>
                  </>
                )}

                {path === "tenant" && (
                  <>
                    <div className="row">
                      <input className="input" name="zone" placeholder="Zona donde buscás" required />

                      <select className="select" name="desired_property_type" required defaultValue="">
                        <option value="" disabled>
                          Tipo de propiedad
                        </option>
                        <option>Departamento</option>
                        <option>Casa</option>
                        <option>PH</option>
                        <option>Habitación</option>
                        <option>Otro</option>
                      </select>
                    </div>

                    <div className="row">
                      <input className="input" name="budget_range" placeholder="Presupuesto aproximado" required />

                      <select className="select" name="move_timing" required defaultValue="">
                        <option value="" disabled>
                          Cuándo querés mudarte
                        </option>
                        <option>Estoy buscando ahora</option>
                        <option>Me quiero mudar en 1-3 meses</option>
                        <option>Solo quiero enterarme de novedades</option>
                      </select>
                    </div>
                  </>
                )}

                {path === "renewal" && (
                  <>
                    <div className="row">
                      <select className="select" name="renewal_role" required defaultValue="">
                        <option value="" disabled>
                          En la renovación soy...
                        </option>
                        <option value="owner">Propietario</option>
                        <option value="tenant">Inquilino</option>
                      </select>

                      <input className="input" name="zone" placeholder="Zona de la propiedad" required />
                    </div>

                    <div className="row">
                      <input
                        className="input"
                        name="contract_expiration"
                        placeholder="¿Cuándo vence el contrato actual? Ej: agosto 2026"
                        required
                      />

                      <select className="select" name="other_party_status" required defaultValue="">
                        <option value="" disabled>
                          ¿La otra parte ya sabe?
                        </option>
                        <option>Sí, ya lo hablamos</option>
                        <option>Todavía no</option>
                        <option>No estoy seguro</option>
                      </select>
                    </div>

                    <select className="select" name="renewal_need" required defaultValue="">
                      <option value="" disabled>
                        Qué necesitás ordenar
                      </option>
                      <option>Actualizar precio</option>
                      <option>Formalizar nuevo plazo</option>
                      <option>Firmar un nuevo contrato</option>
                      <option>Dejar todo documentado</option>
                      <option>Quiero asesoramiento del flujo</option>
                    </select>
                  </>
                )}

                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}

                <button className="submit" type="submit" disabled={loading}>
                  {loading ? "Guardando..." : selected.button}
                </button>
              </form>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="container footer-inner">
            <VerloBrand width={86} />
            <span>Prueba privada de captación · Verlo</span>
          </div>
        </footer>
      </div>
    </main>
  )
}
