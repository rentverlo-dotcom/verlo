"use client"

import { FormEvent, useState } from "react"
import VerloBrand from "@/components/VerloBrand"

const DEMAND = [
  { neighborhood: "Belgrano", leads: 5, detail: "Monoambientes, 2 ambientes y 4 ambientes" },
  { neighborhood: "Palermo", leads: 4, detail: "Mayor interés en 2 ambientes" },
  { neighborhood: "Flores", leads: 4, detail: "Demanda activa en 2 ambientes" },
  { neighborhood: "Colegiales", leads: 3, detail: "Monoambientes y 4 ambientes" },
  { neighborhood: "Almagro", leads: 3, detail: "Demanda fuerte en 2 ambientes" },
  { neighborhood: "Villa Devoto", leads: 3, detail: "Búsquedas activas recientes" },
]

const PROPERTY_TYPES = ["Departamento", "Casa", "PH", "Local", "Oficina", "Otro"]
const ROOM_OPTIONS = ["Monoambiente", "2 ambientes", "3 ambientes", "4 ambientes", "5+ ambientes"]
const AVAILABILITY_OPTIONS = [
  "Disponible ahora",
  "Disponible pronto",
  "Estoy evaluando alquilar",
]

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function PropietariosPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("loading")
    setMessage("")

    const form = event.currentTarget
    const formData = new FormData(form)

    const fullName = String(formData.get("full_name") || "").trim()
    const email = String(formData.get("email") || "").trim()
    const phone = String(formData.get("phone") || "").trim()
    const zone = String(formData.get("zone") || "").trim()
    const propertyType = String(formData.get("property_type") || "").trim()
    const propertyRooms = String(formData.get("property_rooms") || "").trim()
    const approxPrice = String(formData.get("approx_price") || "").trim()
    const availabilityStatus = String(formData.get("availability_status") || "").trim()
    const notes = String(formData.get("notes") || "").trim()

    const payload = {
      full_name: fullName,
      email,
      phone,
      role: "owner",
      intent: "owner_new_listing",
      zone,
      area_macro: "owner_landing",
      neighborhood_labels: [zone],
      neighborhood_slugs: [normalizeText(zone)],
      neighborhood_slug: normalizeText(zone),
      property_type: propertyType,
      property_rooms: propertyRooms,
      approx_price: approxPrice,
      availability_status: availabilityStatus,
      source: "verlo_propietarios",
      metadata: {
        page: "propietarios",
        owner_notes: notes,
        property_rooms: propertyRooms,
        neighborhood_slug: normalizeText(zone),
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

      form.reset()
      setStatus("success")
      setMessage("Listo. Recibimos tu propiedad. Te vamos a escribir para revisar compatibilidad con interesados reales.")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Error inesperado")
    }
  }

  return (
    <main className="owners-root">
      <style>{styles}</style>

      <nav className="nav">
        <div className="container nav-inner">
          <a href="/" className="brand-link" aria-label="Ir al inicio">
            <VerloBrand width={34} />
          </a>

          <div className="nav-links">
            <a href="#demanda">Demanda activa</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#cargar" className="nav-cta">Cargar propiedad</a>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Propietarios / Verlo</p>

            <h1>
              Hay inquilinos buscando en tu barrio. Cargá tu propiedad y vemos si hay match.
            </h1>

            <p className="hero-copy">
              En Verlo conectamos propietarios con inquilinos activos, ordenamos la información y acompañamos el proceso hasta el contrato.
            </p>

            <div className="hero-actions">
              <a href="#cargar" className="primary-btn">Cargar mi propiedad gratis</a>
              <a href="#demanda" className="secondary-btn">Ver demanda activa</a>
            </div>

            <div className="trust-row">
              <span>No publicamos tu dirección exacta</span>
              <span>Datos privados hasta confirmar avance</span>
              <span>Proceso ordenado hasta contrato</span>
            </div>
          </div>

          <aside className="hero-card">
            <div className="hero-card-top">
              <p>Demanda activa</p>
              <strong>Inquilinos reales</strong>
            </div>

            <div className="mini-demand-list">
              {DEMAND.slice(0, 4).map((item) => (
                <div className="mini-demand-item" key={item.neighborhood}>
                  <span>{item.neighborhood}</span>
                  <strong>{item.leads} interesados</strong>
                </div>
              ))}
            </div>

            <div className="hero-note">
              Si tu propiedad está en una zona con demanda, podemos revisar compatibilidad y acercarte interesados calificados.
            </div>
          </aside>
        </div>
      </section>

      <section id="demanda" className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Datos reales</p>
            <h2>Barrios con búsquedas activas</h2>
            <p>
              Estos datos salen de búsquedas cargadas por personas que están buscando alquilar. La idea es simple: primero miramos si hay compatibilidad real.
            </p>
          </div>

          <div className="demand-grid">
            {DEMAND.map((item) => (
              <article className="demand-card" key={item.neighborhood}>
                <span>{item.neighborhood}</span>
                <strong>{item.leads}</strong>
                <p>interesados activos</p>
                <small>{item.detail}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="section soft-section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Proceso</p>
            <h2>Cómo funciona para propietarios</h2>
          </div>

          <div className="steps-grid">
            <article>
              <b>1</b>
              <h3>Cargás tu propiedad</h3>
              <p>Nos dejás barrio, tipo, ambientes, precio estimado y disponibilidad.</p>
            </article>

            <article>
              <b>2</b>
              <h3>Revisamos compatibilidad</h3>
              <p>Cruzamos tu propiedad con búsquedas reales cargadas en Verlo.</p>
            </article>

            <article>
              <b>3</b>
              <h3>Avanzamos si hay interés</h3>
              <p>Si hay inquilinos compatibles, te pedimos más datos, fotos y condiciones.</p>
            </article>

            <article>
              <b>4</b>
              <h3>Coordinamos hasta contrato</h3>
              <p>Ordenamos el proceso para que ambas partes puedan avanzar con más claridad.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="cargar" className="section form-section">
        <div className="container form-grid">
          <div>
            <p className="eyebrow">Cargar propiedad</p>
            <h2>Decinos qué tenés para alquilar</h2>
            <p>
              No tiene costo inicial. Primero revisamos si tu propiedad puede matchear con búsquedas activas.
            </p>

            <div className="promise-card">
              <strong>Privacidad primero</strong>
              <span>
                No compartimos tus datos ni la dirección exacta sin que confirmes que querés avanzar.
              </span>
            </div>
          </div>

          <form className="owner-form" onSubmit={handleSubmit}>
            <input name="website" type="text" tabIndex={-1} autoComplete="off" className="honeypot" />

            <label>
              Nombre
              <input name="full_name" placeholder="Tu nombre" required />
            </label>

            <label>
              WhatsApp
              <input name="phone" placeholder="Ej: 11 5555 5555" required />
            </label>

            <label>
              Email
              <input name="email" type="email" placeholder="tu@email.com" required />
            </label>

            <label>
              Barrio de la propiedad
              <input name="zone" placeholder="Ej: Palermo" required />
            </label>

            <div className="form-row">
              <label>
                Tipo
                <select name="property_type" required defaultValue="">
                  <option value="" disabled>Elegí una opción</option>
                  {PROPERTY_TYPES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Ambientes
                <select name="property_rooms" required defaultValue="">
                  <option value="" disabled>Elegí</option>
                  {ROOM_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Precio mensual estimado
              <input name="approx_price" placeholder="Ej: 700000" required />
            </label>

            <label>
              Disponibilidad
              <select name="availability_status" required defaultValue="">
                <option value="" disabled>Elegí una opción</option>
                {AVAILABILITY_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              Comentario opcional
              <textarea
                name="notes"
                placeholder="Expensas, requisitos, si tenés fotos, fecha estimada, etc."
                rows={4}
              />
            </label>

            <button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Guardando..." : "Ver si tengo interesados compatibles"}
            </button>

            {message ? (
              <p className={status === "error" ? "form-message error" : "form-message success"}>
                {message}
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <VerloBrand size="sm" />
          <p>
            Verlo facilita el encuentro entre partes, ordena información y acompaña el proceso. No publicamos datos sensibles sin confirmación.
          </p>
          <a href="/">Volver a verlo.lat</a>
        </div>
      </footer>
    </main>
  )
}

const styles = `
  .owners-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --paper: #fffaf8;
    min-height: 100vh;
    background:
      radial-gradient(circle at 84% 10%, rgba(242,168,169,.48), transparent 28%),
      radial-gradient(circle at 10% 48%, rgba(195,121,134,.16), transparent 26%),
      var(--soft);
    color: var(--black);
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .owners-root * {
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
    background: rgba(242, 235, 236, 0.84);
    border-bottom: 1px solid rgba(5, 0, 2, 0.08);
  }

  .nav-inner {
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .brand-link {
    display: inline-flex;
    color: inherit;
    text-decoration: none;
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
    min-width: 132px;
    text-align: center;
  }

  .hero {
    padding: 88px 0 76px;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 1.04fr 0.96fr;
    gap: 56px;
    align-items: center;
  }

  .eyebrow {
    margin: 0;
    color: var(--pink-dark);
    text-transform: uppercase;
    letter-spacing: .14em;
    font-size: 12px;
    font-weight: 950;
  }

  h1 {
    margin: 18px 0 0;
    font-size: clamp(48px, 7vw, 92px);
    line-height: .88;
    letter-spacing: -.085em;
    max-width: 860px;
  }

  h2 {
    margin: 10px 0 0;
    font-size: clamp(34px, 4.6vw, 64px);
    line-height: .92;
    letter-spacing: -.075em;
  }

  h3 {
    margin: 16px 0 0;
    font-size: 22px;
    line-height: 1;
    letter-spacing: -.045em;
  }

  .hero-copy {
    margin: 24px 0 0;
    max-width: 700px;
    color: rgba(5, 0, 2, .66);
    font-size: 20px;
    line-height: 1.48;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 30px;
  }

  .primary-btn,
  .secondary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 54px;
    padding: 0 22px;
    border-radius: 999px;
    font-weight: 950;
    text-decoration: none;
  }

  .primary-btn {
    background: var(--black);
    color: white;
    box-shadow: 0 18px 42px rgba(5,0,2,.18);
  }

  .secondary-btn {
    color: var(--black);
    background: rgba(255,255,255,.62);
    border: 1px solid rgba(5,0,2,.1);
  }

  .trust-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 26px;
  }

  .trust-row span {
    padding: 9px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,.58);
    border: 1px solid rgba(5,0,2,.08);
    color: rgba(5,0,2,.64);
    font-size: 13px;
    font-weight: 850;
  }

  .hero-card {
    padding: 28px;
    border-radius: 38px;
    background: rgba(255,255,255,.72);
    border: 1px solid rgba(5,0,2,.09);
    box-shadow: 0 28px 80px rgba(5,0,2,.1);
    transform: rotate(1deg);
  }

  .hero-card-top {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .hero-card-top p {
    margin: 0;
    color: var(--pink-dark);
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .12em;
    font-size: 11px;
  }

  .hero-card-top strong {
    font-size: 22px;
    letter-spacing: -.05em;
  }

  .mini-demand-list {
    display: grid;
    gap: 12px;
  }

  .mini-demand-item {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    padding: 16px;
    border-radius: 22px;
    background: var(--paper);
    border: 1px solid rgba(5,0,2,.08);
  }

  .mini-demand-item span {
    font-weight: 950;
    letter-spacing: -.03em;
  }

  .mini-demand-item strong {
    color: var(--pink-dark);
    font-size: 14px;
  }

  .hero-note {
    margin-top: 18px;
    padding: 18px;
    border-radius: 24px;
    background: var(--black);
    color: white;
    font-weight: 850;
    line-height: 1.35;
  }

  .section {
    padding: 74px 0;
  }

  .soft-section {
    background: rgba(255,255,255,.34);
    border-block: 1px solid rgba(5,0,2,.06);
  }

  .section-head {
    max-width: 820px;
    margin-bottom: 30px;
  }

  .section-head p:not(.eyebrow) {
    margin: 16px 0 0;
    color: rgba(5,0,2,.62);
    font-size: 18px;
    line-height: 1.5;
  }

  .demand-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .demand-card {
    min-height: 210px;
    padding: 24px;
    border-radius: 30px;
    background: rgba(255,255,255,.74);
    border: 1px solid rgba(5,0,2,.08);
    box-shadow: 0 18px 50px rgba(5,0,2,.055);
  }

  .demand-card span {
    display: block;
    font-weight: 950;
    color: var(--pink-dark);
  }

  .demand-card strong {
    display: block;
    margin-top: 18px;
    font-size: 64px;
    line-height: .8;
    letter-spacing: -.08em;
  }

  .demand-card p {
    margin: 10px 0 0;
    font-weight: 950;
  }

  .demand-card small {
    display: block;
    margin-top: 18px;
    color: rgba(5,0,2,.58);
    line-height: 1.35;
    font-weight: 750;
  }

  .steps-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .steps-grid article {
    padding: 24px;
    min-height: 250px;
    border-radius: 30px;
    background: rgba(255,255,255,.74);
    border: 1px solid rgba(5,0,2,.08);
  }

  .steps-grid b {
    display: inline-flex;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    background: var(--black);
    color: white;
    font-size: 18px;
  }

  .steps-grid p {
    margin: 14px 0 0;
    color: rgba(5,0,2,.62);
    line-height: 1.45;
  }

  .form-section {
    padding-bottom: 94px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: .85fr 1.15fr;
    gap: 48px;
    align-items: start;
  }

  .form-grid > div > p:not(.eyebrow) {
    margin: 18px 0 0;
    color: rgba(5,0,2,.64);
    font-size: 19px;
    line-height: 1.5;
  }

  .promise-card {
    margin-top: 28px;
    padding: 22px;
    border-radius: 28px;
    background: var(--black);
    color: white;
    display: grid;
    gap: 8px;
  }

  .promise-card strong {
    font-size: 20px;
    letter-spacing: -.04em;
  }

  .promise-card span {
    color: rgba(255,255,255,.76);
    line-height: 1.4;
  }

  .owner-form {
    padding: 28px;
    border-radius: 34px;
    background: rgba(255,255,255,.78);
    border: 1px solid rgba(5,0,2,.08);
    box-shadow: 0 26px 70px rgba(5,0,2,.08);
    display: grid;
    gap: 16px;
  }

  .owner-form label {
    display: grid;
    gap: 8px;
    font-size: 13px;
    font-weight: 950;
    color: rgba(5,0,2,.72);
  }

  .owner-form input,
  .owner-form select,
  .owner-form textarea {
    width: 100%;
    border: 1px solid rgba(5,0,2,.12);
    border-radius: 18px;
    background: #fffaf8;
    color: var(--black);
    font: inherit;
    font-size: 15px;
    padding: 15px 16px;
    outline: none;
  }

  .owner-form textarea {
    resize: vertical;
  }

  .owner-form input:focus,
  .owner-form select:focus,
  .owner-form textarea:focus {
    border-color: var(--pink-dark);
    box-shadow: 0 0 0 4px rgba(242,168,169,.22);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .owner-form button {
    margin-top: 4px;
    min-height: 58px;
    border: 0;
    border-radius: 999px;
    background: var(--black);
    color: white;
    font-size: 16px;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
  }

  .owner-form button:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .form-message {
    margin: 0;
    padding: 14px 16px;
    border-radius: 18px;
    font-weight: 850;
    line-height: 1.35;
  }

  .form-message.success {
    background: rgba(92, 180, 126, .16);
    color: #245b38;
  }

  .form-message.error {
    background: rgba(195, 70, 70, .13);
    color: #802727;
  }

  .honeypot {
    position: absolute;
    left: -9999px;
    opacity: 0;
  }

  .footer {
    padding: 32px 0;
    border-top: 1px solid rgba(5,0,2,.08);
    background: rgba(255,255,255,.32);
  }

  .footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .footer p {
    margin: 0;
    max-width: 650px;
    color: rgba(5,0,2,.58);
    font-size: 13px;
    line-height: 1.45;
    font-weight: 750;
  }

  .footer a {
    color: var(--black);
    font-weight: 950;
    text-decoration: none;
  }

  @media (max-width: 900px) {
    .nav-links a:not(.nav-cta) {
      display: none;
    }

    .hero-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }

    .hero {
      padding-top: 58px;
    }

    .hero-card {
      transform: none;
    }

    .demand-grid,
    .steps-grid {
      grid-template-columns: 1fr 1fr;
    }

    .footer-inner {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 620px) {
    .container {
      width: min(100% - 26px, 1160px);
    }

    .nav-inner {
      height: 68px;
    }

    h1 {
      font-size: 48px;
    }

    h2 {
      font-size: 38px;
    }

    .demand-grid,
    .steps-grid,
    .form-row {
      grid-template-columns: 1fr;
    }

    .owner-form {
      padding: 20px;
      border-radius: 28px;
    }

    .hero-actions {
      display: grid;
    }

    .primary-btn,
    .secondary-btn {
      width: 100%;
    }
  }
`
