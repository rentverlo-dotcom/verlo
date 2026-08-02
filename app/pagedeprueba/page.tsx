"use client"

import { FormEvent, useMemo, useState } from "react"
import VerloBrand from "@/components/VerloBrand"

type Path = "tenant" | "owner" | "renewal"

const AREA_GROUPS = {
  caba: {
    label: "CABA",
    neighborhoods: [
      "Agronomía",
      "Almagro",
      "Balvanera",
      "Barracas",
      "Belgrano",
      "Boedo",
      "Caballito",
      "Chacarita",
      "Coghlan",
      "Colegiales",
      "Constitución",
      "Flores",
      "Floresta",
      "La Boca",
      "Liniers",
      "Mataderos",
      "Monserrat",
      "Monte Castro",
      "Nueva Pompeya",
      "Núñez",
      "Palermo",
      "Parque Avellaneda",
      "Parque Chacabuco",
      "Parque Chas",
      "Parque Patricios",
      "Paternal",
      "Puerto Madero",
      "Recoleta",
      "Retiro",
      "Saavedra",
      "San Cristóbal",
      "San Nicolás",
      "San Telmo",
      "Vélez Sarsfield",
      "Versalles",
      "Villa Crespo",
      "Villa Devoto",
      "Villa General Mitre",
      "Villa Lugano",
      "Villa Luro",
      "Villa Ortúzar",
      "Villa Pueyrredón",
      "Villa Real",
      "Villa Riachuelo",
      "Villa Santa Rita",
      "Villa Soldati",
      "Villa Urquiza",
    ],
  },
  gba_norte: {
    label: "GBA Norte",
    neighborhoods: [
      "Vicente López",
      "Olivos",
      "Florida",
      "La Lucila",
      "Munro",
      "Villa Martelli",
      "Carapachay",
      "San Isidro",
      "Martínez",
      "Acassuso",
      "Beccar",
      "Boulogne",
      "Victoria",
      "San Fernando",
      "Tigre",
      "Don Torcuato",
      "Pacheco",
      "Benavídez",
      "Pilar",
      "Escobar",
    ],
  },
  gba_oeste: {
    label: "GBA Oeste",
    neighborhoods: [
      "Ramos Mejía",
      "Haedo",
      "Morón",
      "Castelar",
      "Ituzaingó",
      "Hurlingham",
      "Villa Tesei",
      "Ciudadela",
      "Liniers Oeste",
      "San Justo",
      "Lomas del Mirador",
      "Merlo",
      "Moreno",
    ],
  },
  gba_sur: {
    label: "GBA Sur",
    neighborhoods: [
      "Avellaneda",
      "Wilde",
      "Quilmes",
      "Bernal",
      "Lanús",
      "Lomas de Zamora",
      "Banfield",
      "Temperley",
      "Adrogué",
      "Burzaco",
      "Florencio Varela",
      "Berazategui",
      "Ezeiza",
      "Monte Grande",
    ],
  },
} as const

type AreaKey = keyof typeof AREA_GROUPS

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const pathConfig = {
  tenant: {
    title: "Busco alquilar",
    subtitle: "Marcá los barrios donde buscarías y completá tu presupuesto.",
    role: "tenant",
    intent: "tenant_search",
    button: "Cargar mi búsqueda",
  },
  owner: {
    title: "Tengo una propiedad",
    subtitle: "Decinos en qué barrio está, qué tipo es y a qué precio se alquilaría.",
    role: "owner",
    intent: "owner_new_listing",
    button: "Dejar mis datos",
  },
  renewal: {
    title: "Quiero renovar",
    subtitle: "Contanos el barrio, cuándo vence y qué necesitás resolver.",
    role: "both",
    intent: "contract_renewal",
    button: "Quiero renovar",
  },
} as const

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
    background: rgba(242, 235, 236, 0.82);
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

  .phone-frame,
  .mini-phone {
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

  .mini-phone {
    width: 100%;
    max-width: 360px;
    box-shadow: 0 26px 76px rgba(5, 0, 2, 0.18);
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

  .mini-phone .phone-top {
    height: 68px;
    padding: 0 22px;
  }

  .phone-brand {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 31px;
    font-style: italic;
    font-weight: 800;
    letter-spacing: -0.055em;
  }

  .mini-phone .phone-brand {
    font-size: 28px;
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
    display: flex;
    flex-direction: column;
  }

  .mini-phone .phone-screen {
    height: calc(100% - 68px);
    padding: 18px 20px 22px;
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
    min-height: 76px;
  }

  .mini-phone .phone-title {
    font-size: 34px;
    min-height: 68px;
  }

  .phone-copy {
    margin: 14px 0 0;
    color: rgba(5, 0, 2, 0.62);
    font-size: 15px;
    line-height: 1.42;
    font-weight: 650;
    min-height: 64px;
  }

  .mini-phone .phone-copy {
    min-height: 64px;
  }

  .phone-card {
    margin-top: 18px;
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
    margin-top: auto;
    border: 0;
    border-radius: 999px;
    background: var(--black);
    color: white;
    font-size: 15px;
    font-weight: 950;
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
    align-content: start;
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

  .input:focus,
  .select:focus {
    border-color: var(--pink-dark);
    box-shadow: 0 0 0 5px rgba(195, 121, 134, 0.12);
    background: white;
  }

  .neighborhood-box {
    border: 1px solid rgba(5, 0, 2, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.72);
    padding: 18px;
  }

  .neighborhood-box strong {
    display: block;
    font-size: 16px;
    margin-bottom: 12px;
  }

  .neighborhood-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .check-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 42px;
    padding: 0 12px;
    border-radius: 999px;
    background: white;
    border: 1px solid rgba(5, 0, 2, 0.1);
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
  }

  .check-pill input {
    accent-color: var(--black);
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
    .row,
    .neighborhood-grid {
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

function getCookie(name: string) {
  if (typeof document === "undefined") return ""

  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1] || ""
  )
}

function getMetaFbc() {
  if (typeof window === "undefined") return ""

  const cookieFbc = getCookie("_fbc")
  if (cookieFbc) return cookieFbc

  const fbclid = new URLSearchParams(window.location.search).get("fbclid")
  if (!fbclid) return ""

  return `fb.1.${Date.now()}.${fbclid}`
}

function trackMetaLead(eventId: string, params?: Record<string, string>) {
  if (typeof window === "undefined") return

  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq

  if (typeof fbq === "function") {
    fbq(
      "track",
      "Lead",
      {
        value: 500,
        currency: "ARS",
        ...(params || {}),
      },
      { eventID: eventId }
    )
  }
}

function normalizeNeighborhoods(values: string[], otherValue?: string) {
  const cleanValues = values.map((value) => value.trim()).filter(Boolean)

  const other = otherValue?.trim()
  if (other) cleanValues.push(other)

  return {
    labels: cleanValues,
    text: cleanValues.join(", "),
    slugs: cleanValues.map(normalizeText),
  }
}

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
          copy="Verlo ordena datos reales para matchear inquilinos y propietarios por barrio."
          button="Empezar"
          rows={[
            { label: "Barrio", value: "Olivos" },
            { label: "Tipo", value: "2 ambientes" },
            { label: "Presupuesto", value: "$650k" },
            { label: "Estado", value: "Match posible" },
          ]}
        />
      </div>
    </div>
  )
}

function MiniPhone({ type }: { type: Path }) {
  if (type === "tenant") {
    return (
      <div className="mini-phone">
        <PhoneContent
          badge="Búsqueda activa"
          title="Buscá sin comisión"
          copy="Marcá los barrios donde vivirías y tu presupuesto real."
          button="Cargar búsqueda"
          rows={[
            { label: "Barrios", value: "Olivos + Núñez" },
            { label: "Tipo", value: "2 ambientes" },
            { label: "Presupuesto", value: "$500k - $700k" },
            { label: "Mudanza", value: "30 días" },
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
          copy="Barrio, tipo, precio y disponibilidad. Sin fotos todavía."
          button="Dejar datos"
          rows={[
            { label: "Barrio", value: "Vicente López" },
            { label: "Tipo", value: "Departamento" },
            { label: "Precio", value: "$650k" },
            { label: "Disponible", value: "Pronto" },
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
          { label: "Barrio", value: "Belgrano" },
          { label: "Contrato", value: "Por vencer" },
          { label: "Partes", value: "Ambas" },
          { label: "Firma", value: "Digital" },
        ]}
      />
    </div>
  )
}

export default function PageDePrueba() {
  const [path, setPath] = useState<Path>("tenant")
  const [selectedArea, setSelectedArea] = useState<AreaKey>("caba")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selected = pathConfig[path]

  const submitLabel = useMemo(() => {
    if (loading) return "Guardando..."
    return selected.button
  }, [loading, selected.button])

  function choosePath(nextPath: Path) {
    setPath(nextPath)
    setError("")
    setSuccess("")
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setLoading(true)
    setError("")
    setSuccess("")

    const form = e.currentTarget
    const formData = new FormData(form)
    const eventId = `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`

   const tenantNeighborhoods = formData.getAll("tenant_neighborhoods").map(String)
const tenantOtherNeighborhood = String(formData.get("tenant_other_neighborhood") || "").trim()

const normalizedTenantNeighborhoods = normalizeNeighborhoods(
  tenantNeighborhoods,
  tenantOtherNeighborhood
)

if (path === "tenant" && normalizedTenantNeighborhoods.labels.length === 0) {
  setError("Elegí al menos un barrio o escribí otra zona donde buscarías alquilar.")
  setLoading(false)
  return
}

    const ownerNeighborhood = String(formData.get("owner_neighborhood") || "").trim()
    const renewalNeighborhood = String(formData.get("renewal_neighborhood") || "").trim()

   const zone =
  path === "tenant"
    ? normalizedTenantNeighborhoods.text
    : path === "owner"
      ? ownerNeighborhood
      : renewalNeighborhood

    const payload = {
      full_name: String(formData.get("full_name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      role:
        path === "renewal"
          ? String(formData.get("renewal_role") || "both").trim()
          : selected.role,
      intent: selected.intent,
      zone,
      property_type: String(formData.get("property_type") || "").trim(),
      property_rooms: String(formData.get("property_rooms") || "").trim(),
      availability_status: String(formData.get("availability_status") || "").trim(),
      approx_price: String(formData.get("approx_price") || "").trim(),
      desired_property_type: String(formData.get("desired_property_type") || "").trim(),
      desired_rooms: String(formData.get("desired_rooms") || "").trim(),
      budget_range: String(formData.get("budget_range") || "").trim(),
      move_timing: String(formData.get("move_timing") || "").trim(),
      renewal_role: String(formData.get("renewal_role") || "").trim(),
      contract_expiration: String(formData.get("contract_expiration") || "").trim(),
      other_party_status: String(formData.get("other_party_status") || "").trim(),
      renewal_need: String(formData.get("renewal_need") || "").trim(),
      event_id: eventId,
      event_source_url: window.location.href,
      fbp: getCookie("_fbp"),
      fbc: getMetaFbc(),
      metadata: {
        path,
        page: "pagedeprueba",
        tenant_neighborhoods: tenantNeighborhoods,
        neighborhood: zone,
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

      trackMetaLead(eventId, {
        path,
        role: payload.role,
        intent: payload.intent,
      })

      form.reset()
      setSuccess("Listo. Guardamos tus datos y te vamos a contactar por WhatsApp.")
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
              Cargá barrios, presupuesto y fecha de mudanza. Verlo usa esos datos para
              acercarte propiedades compatibles sin pagar una comisión inmobiliaria enorme.
            </p>

            <div className="hero-actions">
              <a
                className="btn btn-primary"
                href="#sumate"
                onClick={() => choosePath("tenant")}
              >
                Busco alquilar
              </a>

              <a
                className="btn btn-secondary"
                href="#sumate"
                onClick={() => choosePath("owner")}
              >
                Tengo una propiedad
              </a>

              <a
                className="btn btn-secondary"
                href="#sumate"
                onClick={() => choosePath("renewal")}
              >
                Quiero renovar
              </a>
            </div>

            <div className="trust-row">
              <span className="pill">Sin comisión inmobiliaria</span>
              <span className="pill">Matching por barrio</span>
              <span className="pill">Más simple</span>
              <span className="pill">Más seguro</span>
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
              Datos simples para <em>matchear mejor.</em>
            </h2>

            <p className="section-copy">
              Inquilinos dicen en qué barrios vivirían. Propietarios dicen en qué barrio
              tienen la propiedad. Con eso empezamos a ordenar la demanda real.
            </p>
          </div>

          <div className="mock-grid">
            <article className="mock-item">
              <MiniPhone type="tenant" />

              <div className="mock-copy">
                <h3>Buscá por barrios</h3>
                <p>
                  Marcá más de un barrio si te sirve. Así podemos matchearte con propiedades
                  compatibles aunque no estén en tu primera opción.
                </p>
                <a href="#sumate" onClick={() => choosePath("tenant")}>
                  Busco alquilar
                </a>
              </div>
            </article>

            <article className="mock-item">
              <MiniPhone type="owner" />

              <div className="mock-copy">
                <h3>Tenés una propiedad</h3>
                <p>
                  Dejanos barrio, tipo, precio y disponibilidad. No tenés que subir fotos ni
                  publicar nada todavía.
                </p>
                <a href="#sumate" onClick={() => choosePath("owner")}>
                  Tengo una propiedad
                </a>
              </div>
            </article>

            <article className="mock-item">
              <MiniPhone type="renewal" />

              <div className="mock-copy">
                <h3>Renová sin comisión</h3>
                <p>
                  Ordená la renovación directo, rápido y sin costos inmobiliarios de renovación.
                </p>
                <a href="#sumate" onClick={() => choosePath("renewal")}>
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
                Todos los campos son necesarios para poder ordenar y matchear bien.
              </p>
            </div>

            <div className="path-grid">
              <button
                type="button"
                className={`path-card ${path === "tenant" ? "active" : ""}`}
                onClick={() => choosePath("tenant")}
              >
                <strong>Busco alquilar</strong>
                <span>Barrios, presupuesto y fecha de mudanza.</span>
              </button>

              <button
                type="button"
                className={`path-card ${path === "owner" ? "active" : ""}`}
                onClick={() => choosePath("owner")}
              >
                <strong>Tengo una propiedad</strong>
                <span>Barrio, tipo, precio y disponibilidad.</span>
              </button>

              <button
                type="button"
                className={`path-card ${path === "renewal" ? "active" : ""}`}
                onClick={() => choosePath("renewal")}
              >
                <strong>Quiero renovar</strong>
                <span>Barrio, contrato, partes y vencimiento.</span>
              </button>
            </div>

            <div className="form-head">
              <h3>{selected.title}</h3>
              <p>{selected.subtitle}</p>
            </div>

            <form className="form" onSubmit={handleSubmit}>
              <div className="row">
                <input className="input" name="full_name" placeholder="Nombre y apellido" required />
                <input
                  className="input"
                  name="phone"
                  placeholder="WhatsApp con característica. Ej: 11 3361 4865"
                  inputMode="tel"
                  required
                />
              </div>

              <input className="input" name="email" type="email" placeholder="Email" required />

              {path === "tenant" && (
                <>
                  <div className="neighborhood-box">
                    <strong>Barrios donde buscarías alquilar</strong>

                    <div className="neighborhood-grid">
                      {NEIGHBORHOODS.map((neighborhood) => (
                        <label className="check-pill" key={neighborhood}>
                          <input
                            type="checkbox"
                            name="tenant_neighborhoods"
                            value={neighborhood}
                          />
                          {neighborhood}
                        </label>
                      ))}
                    </div>
                  </div>

                            <div className="row">
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

                    <select className="select" name="desired_rooms" required defaultValue="">
                      <option value="" disabled>
                        Ambientes que buscás
                      </option>
                      <option>Monoambiente</option>
                      <option>2 ambientes</option>
                      <option>3 ambientes</option>
                      <option>4 ambientes</option>
                      <option>5 o más ambientes</option>
                    </select>
                  </div>

                  <div className="row">
                    <input
                      className="input"
                      name="budget_range"
                      placeholder="Presupuesto mensual máximo"
                      required
                    />

                    <select className="select" name="move_timing" required defaultValue="">
                      <option value="" disabled>
                        Cuándo querés mudarte
                      </option>
                      <option>Estoy buscando ahora</option>
                      <option>Me quiero mudar en 1-3 meses</option>
                      <option>Me quiero mudar más adelante</option>
                    </select>
                  </div>
                </>
              )}

              {path === "owner" && (
                <>
                  <div className="row">
  <select className="select" name="owner_neighborhood" required defaultValue="">
    <option value="" disabled>
      Barrio donde está la propiedad
    </option>
    {NEIGHBORHOODS.map((neighborhood) => (
      <option key={neighborhood}>{neighborhood}</option>
    ))}
  </select>

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
  <select className="select" name="property_rooms" required defaultValue="">
    <option value="" disabled>
      Ambientes de la propiedad
    </option>
    <option>Monoambiente</option>
    <option>2 ambientes</option>
    <option>3 ambientes</option>
    <option>4 ambientes</option>
    <option>5 o más ambientes</option>
  </select>

  <input
    className="input"
    name="approx_price"
    placeholder="Precio mensual esperado"
    required
  />
</div>

                  <div className="row">
                    <input
                      className="input"
                      name="approx_price"
                      placeholder="Precio mensual esperado"
                      required
                    />

                    <select className="select" name="availability_status" required defaultValue="">
                      <option value="" disabled>
                        Disponibilidad
                      </option>
                      <option>Disponible ahora</option>
                      <option>Disponible pronto</option>
                      <option>Estoy evaluando alquilar</option>
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

                    <select className="select" name="renewal_neighborhood" required defaultValue="">
                      <option value="" disabled>
                        Barrio de la propiedad
                      </option>
                      {NEIGHBORHOODS.map((neighborhood) => (
                        <option key={neighborhood}>{neighborhood}</option>
                      ))}
                    </select>
                  </div>

                  <div className="row">
                    <input
                      className="input"
                      name="contract_expiration"
                      type="date"
                      required
                    />

                    <select className="select" name="other_party_status" required defaultValue="">
                      <option value="" disabled>
                        ¿Lo sabe ya tu contraparte?
                      </option>
                      <option>Sí, ya lo hablamos</option>
                      <option>Todavía no</option>
                      <option>No estoy seguro</option>
                    </select>
                  </div>

                  <select className="select" name="renewal_need" required defaultValue="">
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

              {error && <p className="error">{error}</p>}
              {success && <p className="success">{success}</p>}

              <button className="submit" type="submit" disabled={loading}>
                {submitLabel}
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
