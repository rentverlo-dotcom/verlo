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
    --blue: #74bedc;
    --yellow: #e7c776;
    min-height: 100vh;
    background: var(--soft);
    color: var(--black);
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .test-root * {
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
    font-weight: 900;
  }

  .nav-cta {
    padding: 10px 18px;
    border-radius: 999px;
    background: var(--black);
    color: white !important;
    min-width: 92px;
    text-align: center;
  }

  .hero {
    position: relative;
    padding: 88px 0 78px;
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
    font-weight: 950;
    cursor: pointer;
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
    font-weight: 800;
    font-size: 13px;
  }

  .phone-wrap {
    position: relative;
    min-height: 640px;
    display: grid;
    place-items: center;
  }

  .phone-glow {
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

  .phone-frame {
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

  .phone-top {
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 26px;
    background: #fbf8f5;
    border-bottom: 1px solid rgba(5, 0, 2, 0.06);
  }

  .phone-brand {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 31px;
    font-style: italic;
    font-weight: 800;
    letter-spacing: -0.055em;
  }

  .dots {
    display: flex;
    gap: 7px;
  }

  .dots span {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--black);
  }

  .phone-screen {
    height: calc(100% - 76px);
    padding: 18px 22px 24px;
    background:
      radial-gradient(circle at 20% 18%, rgba(242, 168, 169, 0.28), transparent 28%),
      radial-gradient(circle at 84% 90%, rgba(116, 190, 220, 0.20), transparent 28%),
      #fbf8f5;
    overflow: hidden;
  }

  .phone-label {
    width: fit-content;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 11px;
    border-radius: 999px;
    background: rgba(242, 168, 169, 0.28);
    color: rgba(5, 0, 2, 0.74);
    font-size: 12px;
    font-weight: 950;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--pink-dark);
    box-shadow: 0 0 0 5px rgba(195, 121, 134, 0.16);
  }

  .phone-title {
    margin: 16px 0 0;
    font-size: 38px;
    line-height: 0.9;
    letter-spacing: -0.075em;
    font-weight: 950;
  }

  .phone-copy {
    margin: 14px 0 0;
    color: rgba(5, 0, 2, 0.62);
    font-size: 15px;
    line-height: 1.42;
    font-weight: 650;
  }

  .phone-card {
    margin-top: 22px;
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(5, 0, 2, 0.08);
    padding: 18px;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.08);
  }

  .phone-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 13px 0;
    border-bottom: 1px solid rgba(5, 0, 2, 0.08);
  }

  .phone-row:last-child {
    border-bottom: 0;
  }

  .phone-row span {
    color: rgba(5, 0, 2, 0.48);
    font-size: 13px;
    font-weight: 850;
  }

  .phone-row strong {
    color: var(--black);
    text-align: right;
    font-size: 15px;
    font-weight: 950;
  }

  .phone-button {
    width: 100%;
    min-height: 54px;
    margin-top: 22px;
    border: 0;
    border-radius: 999px;
    background: var(--black);
    color: white;
    font-size: 15px;
    font-weight: 950;
  }

  .mini-phone {
    width: 100%;
    aspect-ratio: 390 / 760;
    border: 10px solid var(--black);
    border-radius: 48px;
    overflow: hidden;
    background: #fbf8f5;
    box-shadow: 0 30px 90px rgba(5, 0, 2, 0.18);
  }

  .mini-phone .phone-top {
    height: 68px;
    padding: 0 22px;
  }

  .mini-phone .phone-brand {
    font-size: 28px;
  }

  .mini-phone .phone-screen {
    height: calc(100% - 68px);
    padding: 18px 20px 22px;
  }

  .mini-phone .phone-title {
    font-size: 34px;
  }

  .section {
    padding: 86px 0;
  }

  .section-header {
    max-width: 790px;
    margin-bottom: 46px;
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

  .mock-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 26px;
    align-items: start;
  }

  .mock-item {
    display: grid;
    gap: 24px;
  }

  .mock-copy h3 {
    margin: 0;
    font-size: 34px;
    line-height: 0.95;
    letter-spacing: -0.065em;
    font-weight: 950;
  }

  .mock-copy p {
    margin: 12px 0 0;
    color: rgba(5, 0, 2, 0.66);
    font-size: 16px;
    line-height: 1.45;
    font-weight: 700;
  }

  .mock-copy a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 18px;
    min-height: 50px;
    padding: 0 20px;
    border-radius: 999px;
    background: var(--black);
    color: white;
    text-decoration: none;
    font-size: 14px;
    font-weight: 950;
  }

  .form-card {
    border-radius: 42px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(5, 0, 2, 0.08);
    box-shadow: 0 28px 80px rgba(5, 0, 2, 0.08);
  }

  .path-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 28px;
  }

  .path-card {
    padding: 22px;
    border-radius: 26px;
    background: rgba(255, 255, 255, 0.62);
    border: 1px solid rgba(5, 0, 2, 0.08);
    cursor: pointer;
    text-align: left;
    color: var(--black);
    transition: 160ms ease;
  }

  .path-card.active {
    background: var(--black);
    color: white;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
  }

  .path-card strong {
    display: block;
    font-size: 23px;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .path-card span {
    display: block;
    margin-top: 9px;
    font-size: 14px;
    line-height: 1.35;
    opacity: 0.72;
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

  .footer {
    padding: 54px 0;
    border-top: 1px solid rgba(5, 0, 2, 0.1);
    background: rgba(255, 255, 255, 0.34);
  }

  .footer-inner {
    display: flex;
    justify-content: space-between;
    gap: 32px;
    align-items: flex-start;
    color: rgba(5, 0, 2, 0.58);
    font-size: 14px;
  }

  .footer-brand {
    display: grid;
    gap: 12px;
  }

  .footer-brand p {
    margin: 0;
    max-width: 280px;
    line-height: 1.45;
    color: rgba(5, 0, 2, 0.62);
    font-weight: 700;
  }

  .footer-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 16px 22px;
  }

  .footer-links a {
    color: rgba(5, 0, 2, 0.66);
    text-decoration: none;
    font-weight: 800;
  }

  @media (max-width: 1060px) {
    .hero-grid {
      grid-template-columns: 1fr;
    }

    .mock-grid {
      grid-template-columns: 1fr;
    }

    .mock-item {
      grid-template-columns: minmax(280px, 380px) 1fr;
      align-items: center;
    }
  }

  @media (max-width: 760px) {
    .container {
      width: min(100% - 28px, 1160px);
    }

    .nav-inner {
      height: 66px;
    }

    .nav-links a:not(.nav-cta) {
      display: none;
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

    .phone-wrap {
      min-height: 560px;
    }

    .phone-frame {
      width: min(340px, 90vw);
    }

    .mock-item {
      grid-template-columns: 1fr;
    }

    .mini-phone {
      max-width: 340px;
      margin: 0 auto;
    }

    .path-grid,
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

    .footer-links {
      justify-content: flex-start;
    }
  }
`

const pathConfig = {
  tenant: {
    title: "Busco alquilar",
    subtitle: "Decinos zona, presupuesto y cuándo querés mudarte.",
    button: "Cargar mi búsqueda",
  },
  owner: {
    title: "Tengo una propiedad",
    subtitle: "Dejanos tus datos. No tenés que subir fotos ni publicar nada todavía.",
    button: "Dejar mis datos",
  },
  renewal: {
    title: "Quiero renovar",
    subtitle: "Contanos cuándo vence el contrato y qué necesitás resolver.",
    button: "Quiero renovar",
  },
} as const

function Dots() {
  return (
    <div className="dots">
      <span />
      <span />
      <span />
    </div>
  )
}

function PhoneContent({
  badge,
  title,
  copy,
  rows,
  button,
}: {
  badge: string
  title: string
  copy: string
  rows: { label: string; value: string }[]
  button: string
}) {
  return (
    <>
      <div className="phone-top">
        <div className="phone-brand">verlo</div>
        <Dots />
      </div>

      <div className="phone-screen">
        <div className="phone-label">
          <span className="dot" />
          {badge}
        </div>

        <h3 className="phone-title">{title}</h3>

        <p className="phone-copy">{copy}</p>

        <div className="phone-card">
          {rows.map((row) => (
            <div className="phone-row" key={row.label}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>

        <button className="phone-button" type="button">
          {button}
        </button>
      </div>
    </>
  )
}

function HeroPhone() {
  return (
    <div className="phone-wrap" aria-hidden="true">
      <div className="phone-glow" />

      <div className="phone-frame">
        <PhoneContent
          badge="Alquiler directo"
          title="Menos comisión. Más control."
          copy="Verlo prioriza datos útiles: zona, presupuesto, fecha de mudanza y compatibilidad."
          button="Empezar"
          rows={[
            { label: "Zona", value: "CABA Norte" },
            { label: "Tipo", value: "2 ambientes" },
            { label: "Presupuesto", value: "$650k" },
            { label: "Estado", value: "Match posible" },
          ]}
        />
      </div>
    </div>
  )
}

function MiniPhone({
  type,
}: {
  type: Path
}) {
  if (type === "tenant") {
    return (
      <div className="mini-phone">
        <PhoneContent
          badge="Búsqueda activa"
          title="Buscá sin comisión"
          copy="Cargá tu búsqueda y te avisamos si aparece algo compatible."
          button="Cargar búsqueda"
          rows={[
            { label: "Zona", value: "Vicente López" },
            { label: "Presupuesto", value: "$500k - $700k" },
            { label: "Mudanza", value: "30 días" },
            { label: "Estado", value: "Match posible" },
          ]}
        />
      </div>
    )
  }

  if (type === "owner") {
    return (
      <div className="mini-phone">
        <PhoneContent
          badge="Propietario"
          title="Dejá tus datos"
          copy="No tenés que subir fotos ni publicar nada todavía."
          button="Dejar datos"
          rows={[
            { label: "Fotos", value: "No requeridas" },
            { label: "Zona", value: "A definir" },
            { label: "Disponibilidad", value: "Pronto" },
            { label: "Interés", value: "Inquilinos" },
          ]}
        />
      </div>
    )
  }

  return (
    <div className="mini-phone">
      <PhoneContent
        badge="Renovación"
        title="Renová sin comisión"
        copy="Ordená el contrato directo, rápido y con firma digital."
        button="Renovar"
        rows={[
          { label: "Contrato", value: "Por vencer" },
          { label: "Partes", value: "Ambas" },
          { label: "Proceso", value: "Ordenado" },
          { label: "Firma", value: "Digital" },
        ]}
      />
    </div>
  )
}

export default function PageDePrueba() {
  const [path, setPath] = useState<Path>("tenant")
  const selected = pathConfig[path]

  return (
    <main className="test-root">
      <style>{styles}</style>

      <header className="nav">
        <div className="container nav-inner">
          <VerloBrand width={112} />

          <nav className="nav-links">
            <a href="#caminos">Qué querés hacer</a>
            <a href="#sumate" className="nav-cta">
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
              Cargá lo que estás buscando y avanzá con más información, menos vueltas
              y sin pagar una comisión inmobiliaria enorme.
            </p>

            <div className="hero-actions">
              <a
                className="btn btn-primary"
                href="#sumate"
                onClick={() => setPath("tenant")}
              >
                Busco alquilar
              </a>

              <a
                className="btn btn-secondary"
                href="#sumate"
                onClick={() => setPath("owner")}
              >
                Tengo una propiedad
              </a>

              <a
                className="btn btn-secondary"
                href="#sumate"
                onClick={() => setPath("renewal")}
              >
                Quiero renovar
              </a>
            </div>

            <div className="trust-row">
              <span className="pill">Sin comisión inmobiliaria</span>
              <span className="pill">Más simple</span>
              <span className="pill">Más seguro</span>
              <span className="pill">Contrato digital</span>
            </div>
          </div>

          <HeroPhone />
        </div>
      </section>

      <section className="section" id="caminos">
        <div className="container">
          <div className="section-header">
            <p className="kicker">Elegí tu camino</p>

            <h2 className="section-title">
              Verlo se adapta a <em>tu situación.</em>
            </h2>

            <p className="section-copy">
              Buscás alquilar, tenés una propiedad o necesitás renovar. Entrás por
              el camino correcto y dejamos los datos ordenados desde el primer paso.
            </p>
          </div>

          <div className="mock-grid">
            <article className="mock-item">
              <MiniPhone type="tenant" />

              <div className="mock-copy">
                <h3>Buscá alquiler directo</h3>
                <p>
                  Decinos zona, presupuesto y fecha de mudanza. Te avisamos si aparece
                  una propiedad compatible.
                </p>
                <a href="#sumate" onClick={() => setPath("tenant")}>
                  Busco alquilar
                </a>
              </div>
            </article>

            <article className="mock-item">
              <MiniPhone type="owner" />

              <div className="mock-copy">
                <h3>Tenés una propiedad</h3>
                <p>
                  Dejanos tus datos. No tenés que subir fotos ni publicar nada todavía.
                  Primero vemos disponibilidad e interés.
                </p>
                <a href="#sumate" onClick={() => setPath("owner")}>
                  Tengo una propiedad
                </a>
              </div>
            </article>

            <article className="mock-item">
              <MiniPhone type="renewal" />

              <div className="mock-copy">
                <h3>Renová sin comisión</h3>
                <p>
                  Ordená la renovación directo, rápido y sin costos inmobiliarios de
                  renovación.
                </p>
                <a href="#sumate" onClick={() => setPath("renewal")}>
                  Quiero renovar
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="sumate">
        <div className="container">
          <div className="form-card">
            <div className="section-header">
              <p className="kicker">Sumate a Verlo</p>

              <h2 className="section-title">
                Dejá tus datos y seguimos <em>por WhatsApp.</em>
              </h2>

              <p className="section-copy">
                Elegí tu caso y completá lo mínimo para entender qué necesitás.
              </p>
            </div>

            <div className="path-grid">
              <button
                type="button"
                className={`path-card ${path === "tenant" ? "active" : ""}`}
                onClick={() => setPath("tenant")}
              >
                <strong>Busco alquilar</strong>
                <span>Zona, presupuesto y fecha de mudanza.</span>
              </button>

              <button
                type="button"
                className={`path-card ${path === "owner" ? "active" : ""}`}
                onClick={() => setPath("owner")}
              >
                <strong>Tengo una propiedad</strong>
                <span>Solo tus datos. Sin fotos todavía.</span>
              </button>

              <button
                type="button"
                className={`path-card ${path === "renewal" ? "active" : ""}`}
                onClick={() => setPath("renewal")}
              >
                <strong>Quiero renovar</strong>
                <span>Contrato, partes y vencimiento.</span>
              </button>
            </div>

            <div className="form-head">
              <h3>{selected.title}</h3>
              <p>{selected.subtitle}</p>
            </div>

            <form className="form">
              <div className="row">
                <input className="input" name="full_name" placeholder="Nombre y apellido" />
                <input
                  className="input"
                  name="phone"
                  placeholder="WhatsApp con característica. Ej: 11 3361 4865"
                  inputMode="tel"
                />
              </div>

              <input className="input" name="email" type="email" placeholder="Email" />

              {path === "tenant" && (
                <>
                  <div className="row">
                    <input className="input" name="zone" placeholder="Zona donde buscás" />

                    <select className="select" name="desired_property_type" defaultValue="">
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
                    <input className="input" name="budget_range" placeholder="Presupuesto aproximado" />

                    <select className="select" name="move_timing" defaultValue="">
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

              {path === "owner" && (
                <>
                  <div className="row">
                    <input className="input" name="zone" placeholder="Zona de la propiedad" />

                    <select className="select" name="property_type" defaultValue="">
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
                    <select className="select" name="availability_status" defaultValue="">
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

              {path === "renewal" && (
                <>
                  <div className="row">
                    <select className="select" name="renewal_role" defaultValue="">
                      <option value="" disabled>
                        En la renovación soy...
                      </option>
                      <option value="owner">Propietario</option>
                      <option value="tenant">Inquilino</option>
                    </select>

                    <input className="input" name="zone" placeholder="Zona de la propiedad" />
                  </div>

                  <div className="row">
                    <input
                      className="input"
                      name="contract_expiration"
                      type="date"
                    />

                    <select className="select" name="other_party_status" defaultValue="">
                      <option value="" disabled>
                        ¿Lo sabe ya tu contraparte?
                      </option>
                      <option>Sí, ya lo hablamos</option>
                      <option>Todavía no</option>
                      <option>No estoy seguro</option>
                    </select>
                  </div>

                  <select className="select" name="renewal_need" defaultValue="">
                    <option value="" disabled>
                      ¿Qué querés lograr con esta renovación?
                    </option>
                    <option>Renovar con condiciones parecidas</option>
                    <option>Actualizar precio y renovar</option>
                    <option>Cambiar plazo del contrato</option>
                    <option>Todavía no lo sé, quiero que me guíen</option>
                  </select>
                </>
              )}

              <button className="submit" type="button">
                {selected.button}
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <VerloBrand width={86} />
            <p>Alquiler directo, seguro y sin comisión.</p>
          </div>

          <nav className="footer-links">
            <a href="/terminos">Términos y condiciones</a>
            <a href="/privacidad">Política de privacidad</a>
            <a href="mailto:hola@verlo.lat">Contacto</a>
          </nav>
        </div>
      </footer>
    </main>
  )
}
