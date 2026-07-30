"use client"

import { useState } from "react"
import VerloBrand from "@/components/VerloBrand"

type DemoStep = "matches" | "property" | "chat" | "renewal" | "dashboard"

const steps: { id: DemoStep; label: string }[] = [
  { id: "matches", label: "Matches" },
  { id: "property", label: "Propiedad" },
  { id: "chat", label: "Contacto" },
  { id: "renewal", label: "Renovación" },
  { id: "dashboard", label: "Panel" },
]

const styles = `
  .demo-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --blue: #74bedc;
    --yellow: #e7c776;
    min-height: 100vh;
    background:
      radial-gradient(circle at 78% 18%, rgba(242, 168, 169, 0.45), transparent 30%),
      radial-gradient(circle at 14% 12%, rgba(116, 190, 220, 0.18), transparent 24%),
      var(--soft);
    color: var(--black);
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .demo-root * {
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
    gap: 12px;
  }

  .nav-links a {
    color: rgba(5, 0, 2, 0.68);
    text-decoration: none;
    font-weight: 850;
    font-size: 14px;
  }

  .nav-cta {
    padding: 11px 18px;
    border-radius: 999px;
    background: var(--black);
    color: white !important;
    font-weight: 950 !important;
  }

  .hero {
    padding: 72px 0 56px;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 0.95fr 1.05fr;
    gap: 58px;
    align-items: center;
  }

  .kicker {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 18px;
    padding: 9px 13px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.58);
    border: 1px solid rgba(5, 0, 2, 0.08);
    color: rgba(5, 0, 2, 0.66);
    font-size: 13px;
    font-weight: 900;
  }

  .kicker-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--pink-dark);
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(54px, 7.2vw, 102px);
    line-height: 0.92;
    letter-spacing: -0.075em;
    font-weight: 950;
  }

  .hero h1 em {
    display: block;
    margin-top: 8px;
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 400;
    font-style: italic;
    letter-spacing: -0.045em;
  }

  .hero-copy {
    margin: 28px 0 0;
    max-width: 640px;
    color: rgba(5, 0, 2, 0.68);
    font-size: 20px;
    line-height: 1.52;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 34px;
  }

  .btn {
    min-height: 54px;
    padding: 0 22px;
    border-radius: 999px;
    border: 1px solid rgba(5, 0, 2, 0.1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-size: 15px;
    font-weight: 950;
  }

  .btn-primary {
    background: var(--black);
    color: white;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.74);
    color: var(--black);
  }

  .demo-stage {
    position: relative;
    min-height: 680px;
    display: grid;
    place-items: center;
  }

  .phone-glow {
    position: absolute;
    width: 540px;
    height: 540px;
    border-radius: 999px;
    background:
      radial-gradient(circle at 30% 35%, rgba(242, 168, 169, 0.75), transparent 32%),
      radial-gradient(circle at 78% 66%, rgba(116, 190, 220, 0.42), transparent 26%),
      radial-gradient(circle at 74% 22%, rgba(231, 199, 118, 0.35), transparent 24%);
    filter: blur(12px);
    opacity: 0.9;
  }

  .phone {
    position: relative;
    width: min(390px, 86vw);
    min-height: 680px;
    border: 10px solid var(--black);
    border-radius: 48px;
    background: #fffaf9;
    overflow: hidden;
    box-shadow: 0 34px 90px rgba(5, 0, 2, 0.28);
    z-index: 2;
  }

  .phone-notch {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: 118px;
    height: 28px;
    border-radius: 999px;
    background: var(--black);
    z-index: 3;
  }

  .phone-screen {
    padding: 54px 22px 22px;
  }

  .phone-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .menu-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--black);
    box-shadow: 10px 0 0 var(--black), 20px 0 0 var(--black);
  }

  .step-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 28px;
  }

  .step-tab {
    border: 1px solid rgba(5, 0, 2, 0.1);
    border-radius: 999px;
    padding: 10px 13px;
    background: rgba(255, 255, 255, 0.66);
    font-weight: 900;
    color: rgba(5, 0, 2, 0.64);
    cursor: pointer;
  }

  .step-tab.active {
    background: var(--black);
    color: white;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 10px;
    border-radius: 999px;
    background: rgba(242, 168, 169, 0.24);
    color: #8f4e5b;
    font-size: 12px;
    font-weight: 950;
  }

  .pill::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--pink-dark);
  }

  .app-title {
    margin: 16px 0;
    font-size: 32px;
    line-height: 0.96;
    letter-spacing: -0.065em;
    font-weight: 950;
  }

  .property-card {
    border-radius: 28px;
    background: white;
    border: 1px solid rgba(5, 0, 2, 0.08);
    box-shadow: 0 18px 40px rgba(5, 0, 2, 0.08);
    overflow: hidden;
  }

  .property-image {
    height: 210px;
    background:
      linear-gradient(135deg, rgba(5, 0, 2, 0.08), rgba(242, 168, 169, 0.16)),
      url("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80");
    background-size: cover;
    background-position: center;
  }

  .property-body {
    padding: 18px;
  }

  .property-body h3 {
    margin: 0;
    font-size: 21px;
    letter-spacing: -0.04em;
  }

  .muted {
    color: rgba(5, 0, 2, 0.56);
  }

  .price {
    margin-top: 10px;
    font-size: 20px;
    font-weight: 950;
  }

  .swipe-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 16px;
  }

  .circle-action {
    min-height: 54px;
    border-radius: 999px;
    border: 1px solid rgba(5, 0, 2, 0.08);
    background: rgba(242, 168, 169, 0.22);
    font-size: 22px;
    font-weight: 950;
  }

  .screen-list {
    display: grid;
    gap: 12px;
  }

  .screen-card {
    padding: 16px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(5, 0, 2, 0.08);
  }

  .screen-card h3 {
    margin: 0;
    font-size: 18px;
    letter-spacing: -0.035em;
  }

  .screen-card p {
    margin: 7px 0 0;
    color: rgba(5, 0, 2, 0.6);
    font-size: 13px;
    line-height: 1.45;
  }

  .chat {
    display: grid;
    gap: 12px;
    margin-top: 16px;
  }

  .chat-bubble {
    max-width: 82%;
    padding: 13px 14px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.35;
  }

  .chat-bubble.me {
    justify-self: end;
    background: rgba(242, 168, 169, 0.24);
  }

  .chat-bubble.other {
    justify-self: start;
    background: rgba(5, 0, 2, 0.05);
  }

  .secure-banner {
    padding: 15px;
    border-radius: 20px;
    background: rgba(242, 168, 169, 0.2);
    color: #7f4350;
    font-size: 13px;
    font-weight: 850;
    line-height: 1.4;
  }

  .progress {
    display: grid;
    gap: 12px;
    margin-top: 18px;
  }

  .progress-row {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 12px;
    align-items: start;
  }

  .progress-dot {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: var(--black);
    color: white;
    display: grid;
    place-items: center;
    font-size: 13px;
    font-weight: 950;
  }

  .progress-row h3 {
    margin: 0;
    font-size: 16px;
  }

  .progress-row p {
    margin: 4px 0 0;
    color: rgba(5, 0, 2, 0.58);
    font-size: 13px;
    line-height: 1.4;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 18px;
  }

  .metric {
    padding: 16px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(5, 0, 2, 0.08);
  }

  .metric strong {
    display: block;
    font-size: 26px;
    letter-spacing: -0.055em;
  }

  .metric span {
    display: block;
    margin-top: 4px;
    color: rgba(5, 0, 2, 0.56);
    font-size: 12px;
    font-weight: 800;
  }

  .feature-band {
    padding: 48px 0 78px;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }

  .feature {
    padding: 22px;
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.62);
    border: 1px solid rgba(5, 0, 2, 0.08);
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.06);
  }

  .feature-icon {
    width: 44px;
    height: 44px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    background: rgba(242, 168, 169, 0.22);
    color: #8f4e5b;
    font-weight: 950;
    margin-bottom: 16px;
  }

  .feature h3 {
    margin: 0;
    font-size: 19px;
    letter-spacing: -0.04em;
  }

  .feature p {
    margin: 9px 0 0;
    color: rgba(5, 0, 2, 0.62);
    font-size: 14px;
    line-height: 1.45;
  }

  @media (max-width: 980px) {
    .hero-grid {
      grid-template-columns: 1fr;
    }

    .demo-stage {
      min-height: auto;
    }

    .feature-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 620px) {
    .container {
      width: min(100% - 28px, 1160px);
    }

    .nav-inner {
      height: auto;
      padding: 16px 0;
      align-items: flex-start;
      flex-direction: column;
    }

    .hero {
      padding: 48px 0;
    }

    .hero-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }

    .feature-grid {
      grid-template-columns: 1fr;
    }

    .phone {
      min-height: 650px;
    }
  }
`

export default function DemoPage() {
  const [activeStep, setActiveStep] = useState<DemoStep>("matches")

  return (
    <main className="demo-root">
      <style>{styles}</style>

      <header className="nav">
        <div className="container nav-inner">
          <a href="/" aria-label="Volver a Verlo">
            <VerloBrand width={112} />
          </a>

          <nav className="nav-links">
            <a href="/">Home</a>
            <a href="/terminos">Legales</a>
            <a href="/#captacion" className="nav-cta">
              Sumate
            </a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="kicker">
              <span className="kicker-dot" />
              Demo navegable para inversión
            </p>

            <h1>
              Verlo como <em>producto.</em>
            </h1>

            <p className="hero-copy">
              Una simulación de la app para mostrar cómo Verlo puede evolucionar desde captación
              de leads hacia matching, contacto seguro, renovación y operación medible.
            </p>

            <div className="hero-actions">
              <a className="btn btn-primary" href="/#captacion">
                Probar funnel real
              </a>
              <a className="btn btn-secondary" href="/privacidad">
                Ver privacidad
              </a>
            </div>

            <div className="step-tabs" aria-label="Pantallas de demo">
              {steps.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  className={`step-tab ${activeStep === step.id ? "active" : ""}`}
                  onClick={() => setActiveStep(step.id)}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>

          <div className="demo-stage">
            <div className="phone-glow" />
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="phone-top">
                  <VerloBrand width={82} />
                  <span className="menu-dot" />
                </div>

                {activeStep === "matches" && <MatchesScreen />}
                {activeStep === "property" && <PropertyScreen />}
                {activeStep === "chat" && <ChatScreen />}
                {activeStep === "renewal" && <RenewalScreen />}
                {activeStep === "dashboard" && <DashboardScreen />}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-band">
        <div className="container feature-grid">
          <div className="feature">
            <div className="feature-icon">01</div>
            <h3>Captación real</h3>
            <p>La landing trae propietarios, inquilinos y renovaciones a una base ordenada.</p>
          </div>

          <div className="feature">
            <div className="feature-icon">02</div>
            <h3>Cuenta validada</h3>
            <p>El usuario confirma email por magic link después del formulario, sin fricción previa.</p>
          </div>

          <div className="feature">
            <div className="feature-icon">03</div>
            <h3>Producto escalable</h3>
            <p>El mismo lead puede convertirse en perfil, match, conversación y contrato.</p>
          </div>

          <div className="feature">
            <div className="feature-icon">04</div>
            <h3>Datos para invertir</h3>
            <p>Supabase y GHL permiten mostrar demanda, zonas, segmentos y calidad de leads.</p>
          </div>
        </div>
      </section>
    </main>
  )
}

function MatchesScreen() {
  return (
    <>
      <span className="pill">Matches para vos</span>
      <h2 className="app-title">Elegí con un swipe</h2>

      <article className="property-card">
        <div className="property-image" />
        <div className="property-body">
          <h3>2 ambientes en Palermo</h3>
          <p className="muted">Dueña verificada · Disponible ahora</p>
          <div className="price">$550.000 / mes</div>

          <div className="swipe-actions">
            <button className="circle-action" type="button">
              ×
            </button>
            <button className="circle-action" type="button">
              ♥
            </button>
          </div>
        </div>
      </article>
    </>
  )
}

function PropertyScreen() {
  return (
    <>
      <span className="pill">Propiedad verificada</span>
      <h2 className="app-title">Todo claro antes de hablar</h2>

      <div className="screen-list">
        <div className="screen-card">
          <h3>Ubicación</h3>
          <p>Palermo · Cercanía a transporte · Zona con alta demanda.</p>
        </div>

        <div className="screen-card">
          <h3>Condiciones</h3>
          <p>Precio informado, disponibilidad, tipo de contrato y próximos pasos.</p>
        </div>

        <div className="screen-card">
          <h3>Confianza</h3>
          <p>Perfil de propietario validado y trazabilidad del contacto.</p>
        </div>
      </div>
    </>
  )
}

function ChatScreen() {
  return (
    <>
      <span className="pill">Contacto directo seguro</span>
      <h2 className="app-title">Chat con contexto</h2>

      <div className="secure-banner">
        Este contacto viene de un match compatible. Ambas partes tienen datos registrados.
      </div>

      <div className="chat">
        <div className="chat-bubble me">Hola, me interesa la propiedad. ¿Podemos coordinar visita?</div>
        <div className="chat-bubble other">Sí, perfecto. Tengo disponibilidad esta semana.</div>
        <div className="chat-bubble me">Genial. Verlo me muestra que la propiedad está disponible ahora.</div>
      </div>
    </>
  )
}

function RenewalScreen() {
  return (
    <>
      <span className="pill">Renovación ordenada</span>
      <h2 className="app-title">Renovar sin perder el hilo</h2>

      <div className="progress">
        <div className="progress-row">
          <div className="progress-dot">1</div>
          <div>
            <h3>Contrato actual</h3>
            <p>Vence el 15/09/2026. Ambas partes ya están identificadas.</p>
          </div>
        </div>

        <div className="progress-row">
          <div className="progress-dot">2</div>
          <div>
            <h3>Objetivo</h3>
            <p>Actualizar precio y renovar con nuevo plazo.</p>
          </div>
        </div>

        <div className="progress-row">
          <div className="progress-dot">3</div>
          <div>
            <h3>Próximo paso</h3>
            <p>Enviar resumen, validar condiciones y preparar documentación.</p>
          </div>
        </div>
      </div>
    </>
  )
}

function DashboardScreen() {
  return (
    <>
      <span className="pill">Panel de operación</span>
      <h2 className="app-title">Demanda medible</h2>

      <div className="metric-grid">
        <div className="metric">
          <strong>128</strong>
          <span>Leads captados</span>
        </div>

        <div className="metric">
          <strong>42</strong>
          <span>Propietarios</span>
        </div>

        <div className="metric">
          <strong>61</strong>
          <span>Inquilinos</span>
        </div>

        <div className="metric">
          <strong>25</strong>
          <span>Renovaciones</span>
        </div>
      </div>

      <div className="screen-card" style={{ marginTop: 14 }}>
        <h3>Lectura para inversores</h3>
        <p>
          El funnel permite medir intención, zona, tipo de usuario, confirmación de cuenta y
          potencial de monetización.
        </p>
      </div>
    </>
  )
}
