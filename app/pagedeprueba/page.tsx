"use client"

import { useState } from "react"
import VerloBrand from "@/components/VerloBrand"

type Path = "tenant" | "owner" | "renewal"

const styles = `
  .test-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --white: #fffaf9;
    min-height: 100vh;
    background:
      radial-gradient(circle at 72% 16%, rgba(242, 168, 169, 0.34), transparent 34%),
      linear-gradient(180deg, #f8f0f1 0%, #f2ebec 48%, #fffaf9 100%);
    color: var(--black);
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .test-header {
    height: 96px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 clamp(22px, 6vw, 86px);
    border-bottom: 1px solid rgba(5, 0, 2, 0.08);
    background: rgba(255, 250, 249, 0.62);
    backdrop-filter: blur(18px);
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .test-nav {
    display: flex;
    align-items: center;
    gap: 18px;
    font-size: 15px;
    font-weight: 900;
  }

  .test-nav a {
    color: rgba(5, 0, 2, 0.68);
    text-decoration: none;
  }

  .pill-btn {
    border: 0;
    border-radius: 999px;
    background: var(--black);
    color: white;
    padding: 15px 22px;
    font-weight: 950;
    font-size: 15px;
    cursor: pointer;
    box-shadow: 0 14px 35px rgba(5, 0, 2, 0.18);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .hero {
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: clamp(28px, 5vw, 76px);
    padding: clamp(54px, 8vw, 96px) clamp(22px, 6vw, 86px) clamp(42px, 7vw, 86px);
    align-items: center;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 13px;
    border-radius: 999px;
    background: rgba(242, 168, 169, 0.28);
    color: rgba(5, 0, 2, 0.72);
    font-weight: 950;
    font-size: 13px;
    margin-bottom: 22px;
  }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: var(--pink-dark);
  }

  h1 {
    margin: 0;
    font-size: clamp(58px, 9vw, 132px);
    line-height: 0.84;
    letter-spacing: -0.085em;
    font-weight: 1000;
  }

  h1 em {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 500;
    letter-spacing: -0.075em;
  }

  .hero p {
    margin: 30px 0 0;
    max-width: 660px;
    color: rgba(5, 0, 2, 0.68);
    font-size: clamp(19px, 2.1vw, 25px);
    line-height: 1.35;
    font-weight: 650;
  }

  .hero-actions {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 34px;
  }

  .ghost-btn {
    border: 1px solid rgba(5, 0, 2, 0.12);
    background: rgba(255, 255, 255, 0.68);
    color: var(--black);
    border-radius: 999px;
    padding: 15px 22px;
    font-size: 15px;
    font-weight: 950;
    cursor: pointer;
    text-decoration: none;
  }

  .phone-shell {
    width: min(460px, 100%);
    justify-self: center;
    border: 12px solid var(--black);
    border-radius: 58px;
    background: var(--white);
    box-shadow: 0 38px 90px rgba(5, 0, 2, 0.18);
    overflow: hidden;
    position: relative;
  }

  .phone-top {
    height: 74px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 26px;
    border-bottom: 1px solid rgba(5, 0, 2, 0.08);
  }

  .mini-brand {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 800;
    font-style: italic;
    font-size: 30px;
  }

  .dots {
    display: flex;
    gap: 6px;
  }

  .dots span {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--black);
  }

  .phone-body {
    padding: 28px;
    min-height: 520px;
  }

  .tag {
    display: inline-flex;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(242, 168, 169, 0.22);
    color: var(--pink-dark);
    font-weight: 950;
    font-size: 13px;
    margin-bottom: 18px;
  }

  .phone-title {
    font-size: 42px;
    line-height: 0.95;
    letter-spacing: -0.065em;
    font-weight: 1000;
    margin: 0 0 12px;
  }

  .phone-copy {
    color: rgba(5, 0, 2, 0.58);
    font-weight: 700;
    line-height: 1.35;
    margin-bottom: 24px;
  }

  .mock-card {
    border-radius: 28px;
    background: linear-gradient(180deg, #fff, #f6fbff);
    border: 1px solid rgba(5, 0, 2, 0.08);
    padding: 20px;
    margin-top: 14px;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.07);
  }

  .mock-row {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    padding: 13px 0;
    border-bottom: 1px solid rgba(5, 0, 2, 0.07);
    font-weight: 850;
  }

  .mock-row:last-child {
    border-bottom: 0;
  }

  .muted {
    color: rgba(5, 0, 2, 0.48);
    font-weight: 750;
  }

  .section {
    padding: clamp(46px, 7vw, 86px) clamp(22px, 6vw, 86px);
  }

  .section-head {
    max-width: 860px;
    margin-bottom: 32px;
  }

  .section h2 {
    margin: 0;
    font-size: clamp(42px, 6vw, 84px);
    line-height: 0.92;
    letter-spacing: -0.075em;
    font-weight: 1000;
  }

  .section h2 em {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 500;
  }

  .section-head p {
    color: rgba(5, 0, 2, 0.62);
    font-size: 20px;
    line-height: 1.42;
    font-weight: 650;
    margin: 18px 0 0;
  }

  .paths {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .path-card {
    border: 1px solid rgba(5, 0, 2, 0.08);
    background: rgba(255, 255, 255, 0.72);
    border-radius: 38px;
    padding: 22px;
    box-shadow: 0 22px 60px rgba(5, 0, 2, 0.07);
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .visual {
    border-radius: 30px;
    background: var(--soft);
    border: 1px solid rgba(5, 0, 2, 0.08);
    padding: 18px;
    min-height: 310px;
    position: relative;
    overflow: hidden;
  }

  .visual:before {
    content: "";
    position: absolute;
    inset: auto -30% -45% -30%;
    height: 190px;
    border-radius: 999px;
    background: rgba(242, 168, 169, 0.35);
    filter: blur(10px);
  }

  .visual-inner {
    position: relative;
    z-index: 2;
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid rgba(5, 0, 2, 0.08);
    border-radius: 26px;
    padding: 18px;
  }

  .visual-title {
    font-size: 28px;
    line-height: 1;
    letter-spacing: -0.055em;
    font-weight: 1000;
    margin: 10px 0 18px;
  }

  .chip {
    display: inline-flex;
    padding: 7px 10px;
    border-radius: 999px;
    background: rgba(242, 168, 169, 0.24);
    color: var(--pink-dark);
    font-size: 12px;
    font-weight: 950;
  }

  .bars {
    display: grid;
    gap: 10px;
  }

  .bar {
    height: 13px;
    border-radius: 999px;
    background: rgba(5, 0, 2, 0.10);
  }

  .bar.w80 { width: 80%; }
  .bar.w65 { width: 65%; }
  .bar.w45 { width: 45%; }
  .bar.w92 { width: 92%; }
  .bar.w70 { width: 70%; }

  .path-card h3 {
    margin: 0;
    font-size: 30px;
    line-height: 1;
    letter-spacing: -0.055em;
    font-weight: 1000;
  }

  .path-card p {
    margin: 0;
    color: rgba(5, 0, 2, 0.62);
    font-weight: 650;
    line-height: 1.42;
    font-size: 16px;
  }

  .path-card button {
    margin-top: auto;
    border: 0;
    border-radius: 999px;
    min-height: 54px;
    padding: 0 20px;
    background: var(--black);
    color: white;
    font-weight: 950;
    font-size: 15px;
    cursor: pointer;
  }

  .form-wrap {
    display: grid;
    grid-template-columns: 0.8fr 1.2fr;
    gap: 28px;
    align-items: start;
  }

  .form-panel {
    border-radius: 40px;
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid rgba(5, 0, 2, 0.08);
    padding: 28px;
    box-shadow: 0 22px 60px rgba(5, 0, 2, 0.07);
  }

  .choice-tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 18px;
  }

  .choice-tabs button {
    border: 1px solid rgba(5, 0, 2, 0.10);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    color: var(--black);
    min-height: 48px;
    font-weight: 950;
    cursor: pointer;
  }

  .choice-tabs button.active {
    background: var(--black);
    color: white;
  }

  .grid-form {
    display: grid;
    gap: 12px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .input, .select {
    width: 100%;
    border: 1px solid rgba(5, 0, 2, 0.10);
    background: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    padding: 16px 17px;
    font-size: 15px;
    font-weight: 750;
    color: var(--black);
    outline: none;
  }

  .submit {
    min-height: 58px;
    border: 0;
    border-radius: 999px;
    background: var(--black);
    color: white;
    font-size: 16px;
    font-weight: 1000;
    cursor: pointer;
    margin-top: 8px;
  }

  .fine {
    color: rgba(5, 0, 2, 0.52);
    font-size: 13px;
    line-height: 1.45;
    font-weight: 650;
  }

  @media (max-width: 980px) {
    .hero, .form-wrap {
      grid-template-columns: 1fr;
    }

    .paths {
      grid-template-columns: 1fr;
    }

    .phone-shell {
      display: none;
    }

    .test-nav a {
      display: none;
    }
  }

  @media (max-width: 620px) {
    .test-header {
      height: 82px;
    }

    .grid-2, .choice-tabs {
      grid-template-columns: 1fr;
    }

    h1 {
      font-size: 64px;
    }
  }
`

function MiniMock({ type }: { type: Path }) {
  if (type === "tenant") {
    return (
      <div className="visual">
        <div className="visual-inner">
          <span className="chip">Búsqueda activa</span>
          <div className="visual-title">Match de alquiler</div>
          <div className="mock-card">
            <div className="mock-row">
              <span className="muted">Zona</span>
              <span>Vicente López</span>
            </div>
            <div className="mock-row">
              <span className="muted">Presupuesto</span>
              <span>$500k - $700k</span>
            </div>
            <div className="mock-row">
              <span className="muted">Mudanza</span>
              <span>Próximos 30 días</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === "owner") {
    return (
      <div className="visual">
        <div className="visual-inner">
          <span className="chip">Propietario</span>
          <div className="visual-title">Sin publicar todavía</div>
          <div className="mock-card">
            <div className="mock-row">
              <span className="muted">Datos</span>
              <span>Contacto recibido</span>
            </div>
            <div className="mock-row">
              <span className="muted">Fotos</span>
              <span>No requeridas</span>
            </div>
            <div className="mock-row">
              <span className="muted">Interés</span>
              <span>Inquilinos compatibles</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="visual">
      <div className="visual-inner">
        <span className="chip">Renovación</span>
        <div className="visual-title">Contrato ordenado</div>
        <div className="mock-card">
          <div className="mock-row">
            <span className="muted">Vencimiento</span>
            <span>Por confirmar</span>
          </div>
          <div className="mock-row">
            <span className="muted">Partes</span>
            <span>Propietario + inquilino</span>
          </div>
          <div className="mock-row">
            <span className="muted">Firma</span>
            <span>Digital</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Pagedeprueba() {
  const [path, setPath] = useState<Path>("tenant")

  return (
    <main className="test-root">
      <style>{styles}</style>

      <header className="test-header">
        <VerloBrand width={178} />
        <nav className="test-nav">
          <a href="#caminos">Qué querés hacer</a>
          <a className="pill-btn" href="#sumate">
            Sumate
          </a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">
            <span className="dot" />
            Alquiler directo, más simple y más barato
          </div>

          <h1>
            Alquilá directo, <em>seguro y sin comisión.</em>
          </h1>

          <p>
            Cargá tu búsqueda, dejá tus datos o empezá una renovación. Verlo ordena la conexión
            entre inquilinos y propietarios para avanzar sin vueltas.
          </p>

          <div className="hero-actions">
            <a className="pill-btn" href="#sumate" onClick={() => setPath("tenant")}>
              Busco alquilar
            </a>
            <a className="ghost-btn" href="#sumate" onClick={() => setPath("owner")}>
              Tengo una propiedad
            </a>
            <a className="ghost-btn" href="#sumate" onClick={() => setPath("renewal")}>
              Quiero renovar
            </a>
          </div>
        </div>

        <div className="phone-shell">
          <div className="phone-top">
            <div className="mini-brand">verlo</div>
            <div className="dots">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="phone-body">
            <span className="tag">Búsqueda activa</span>
            <div className="phone-title">Menos comisión. Más control.</div>
            <div className="phone-copy">
              Verlo prioriza datos útiles: zona, presupuesto, fecha de mudanza y compatibilidad.
            </div>

            <div className="mock-card">
              <div className="mock-row">
                <span className="muted">Zona</span>
                <span>CABA Norte</span>
              </div>
              <div className="mock-row">
                <span className="muted">Tipo</span>
                <span>2 ambientes</span>
              </div>
              <div className="mock-row">
                <span className="muted">Estado</span>
                <span>Match posible</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="caminos">
        <div className="section-head">
          <h2>
            Un flujo para <em>cada caso.</em>
          </h2>
          <p>
            No todos llegan por el mismo problema. Inquilinos, propietarios y renovadores necesitan
            mensajes distintos y datos distintos.
          </p>
        </div>

        <div className="paths">
          <article className="path-card">
            <MiniMock type="tenant" />
            <h3>Busco alquilar</h3>
            <p>
              Cargá zona, presupuesto y fecha de mudanza. Te avisamos si aparece una propiedad
              compatible para avanzar directo.
            </p>
            <button onClick={() => setPath("tenant")}>Busco alquilar</button>
          </article>

          <article className="path-card">
            <MiniMock type="owner" />
            <h3>Tengo una propiedad</h3>
            <p>
              Dejanos tus datos. No tenés que subir fotos ni publicar nada todavía. Primero vemos
              disponibilidad y compatibilidad.
            </p>
            <button onClick={() => setPath("owner")}>Tengo una propiedad</button>
          </article>

          <article className="path-card">
            <MiniMock type="renewal" />
            <h3>Quiero renovar</h3>
            <p>
              Ordená una renovación directa, rápida y segura, sin costos inmobiliarios de renovación.
            </p>
            <button onClick={() => setPath("renewal")}>Quiero renovar</button>
          </article>
        </div>
      </section>

      <section className="section" id="sumate">
        <div className="form-wrap">
          <div className="section-head">
            <h2>
              Sumate a <em>Verlo.</em>
            </h2>
            <p>
              Dejanos los datos mínimos para entender tu caso. Si buscás alquilar, lo más importante
              es zona, presupuesto y fecha de mudanza.
            </p>
          </div>

          <form className="form-panel">
            <div className="choice-tabs">
              <button
                type="button"
                className={path === "tenant" ? "active" : ""}
                onClick={() => setPath("tenant")}
              >
                Busco alquilar
              </button>
              <button
                type="button"
                className={path === "owner" ? "active" : ""}
                onClick={() => setPath("owner")}
              >
                Tengo propiedad
              </button>
              <button
                type="button"
                className={path === "renewal" ? "active" : ""}
                onClick={() => setPath("renewal")}
              >
                Renovar
              </button>
            </div>

            <div className="grid-form">
              <div className="grid-2">
                <input className="input" placeholder="Nombre completo" />
                <input className="input" placeholder="WhatsApp" />
              </div>

              <input className="input" placeholder="Email" />

              {path === "tenant" && (
                <>
                  <div className="grid-2">
                    <input className="input" placeholder="Zona donde querés alquilar" />
                    <input className="input" placeholder="Presupuesto mensual aproximado" />
                  </div>
                  <select className="select">
                    <option>Cuándo querés mudarte?</option>
                    <option>Ahora / urgente</option>
                    <option>En 1 a 3 meses</option>
                    <option>Más adelante</option>
                  </select>
                </>
              )}

              {path === "owner" && (
                <>
                  <div className="grid-2">
                    <input className="input" placeholder="Zona de la propiedad" />
                    <select className="select">
                      <option>Disponibilidad</option>
                      <option>Disponible ahora</option>
                      <option>Disponible pronto</option>
                      <option>Estoy evaluando</option>
                    </select>
                  </div>
                  <p className="fine">
                    No tenés que subir fotos ni publicar nada todavía. Solo necesitamos tus datos
                    para contactarte.
                  </p>
                </>
              )}

              {path === "renewal" && (
                <>
                  <div className="grid-2">
                    <select className="select">
                      <option>Soy...</option>
                      <option>Inquilino</option>
                      <option>Propietario</option>
                    </select>
                    <input className="input" placeholder="Cuándo vence el contrato?" />
                  </div>
                  <input className="input" placeholder="Qué necesitás resolver?" />
                </>
              )}

              <button className="submit" type="button">
                Enviar datos
              </button>

              <p className="fine">
                Esta página es una prueba visual. Después conectamos este formulario al flujo real
                de Verlo.
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
