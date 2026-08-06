"use client"

import { FormEvent, useState } from "react"
import VerloBrand from "@/components/VerloBrand"

const DEMAND = [
  { neighborhood: "Belgrano", leads: "+100", detail: "Búsquedas activas de inquilinos" },
  { neighborhood: "Palermo", leads: "+100", detail: "Búsquedas activas de inquilinos" },
  { neighborhood: "Flores", leads: "+100", detail: "Búsquedas activas de inquilinos" },
  { neighborhood: "Colegiales", leads: "+100", detail: "Búsquedas activas de inquilinos" },
  { neighborhood: "Almagro", leads: "+100", detail: "Búsquedas activas de inquilinos" },
  { neighborhood: "Caballito", leads: "+100", detail: "Búsquedas activas de inquilinos" },
]

const NEIGHBORHOOD_OPTIONS = [
  { label: "Agronomía", slug: "agronomia" },
  { label: "Almagro", slug: "almagro" },
  { label: "Balvanera", slug: "balvanera" },
  { label: "Barracas", slug: "barracas" },
  { label: "Belgrano", slug: "belgrano" },
  { label: "Boedo", slug: "boedo" },
  { label: "Caballito", slug: "caballito" },
  { label: "Chacarita", slug: "chacarita" },
  { label: "Coghlan", slug: "coghlan" },
  { label: "Colegiales", slug: "colegiales" },
  { label: "Flores", slug: "flores" },
  { label: "Floresta", slug: "floresta" },
  { label: "Liniers", slug: "liniers" },
  { label: "Mataderos", slug: "mataderos" },
  { label: "Monserrat", slug: "monserrat" },
  { label: "Monte Castro", slug: "monte-castro" },
  { label: "Núñez", slug: "nunez" },
  { label: "Palermo", slug: "palermo" },
  { label: "Parque Avellaneda", slug: "parque-avellaneda" },
  { label: "Parque Chacabuco", slug: "parque-chacabuco" },
  { label: "Parque Chas", slug: "parque-chas" },
  { label: "Parque Patricios", slug: "parque-patricios" },
  { label: "Paternal", slug: "paternal" },
  { label: "Recoleta", slug: "recoleta" },
  { label: "Saavedra", slug: "saavedra" },
  { label: "San Cristóbal", slug: "san-cristobal" },
  { label: "San Nicolás", slug: "san-nicolas" },
  { label: "San Telmo", slug: "san-telmo" },
  { label: "Vélez Sarsfield", slug: "velez-sarsfield" },
  { label: "Versalles", slug: "versalles" },
  { label: "Villa Crespo", slug: "villa-crespo" },
  { label: "Villa Devoto", slug: "villa-devoto" },
  { label: "Villa General Mitre", slug: "villa-general-mitre" },
  { label: "Villa Luro", slug: "villa-luro" },
  { label: "Villa Ortúzar", slug: "villa-ortuzar" },
  { label: "Villa Pueyrredón", slug: "villa-pueyrredon" },
  { label: "Villa Real", slug: "villa-real" },
  { label: "Villa Santa Rita", slug: "villa-santa-rita" },
  { label: "Villa Urquiza", slug: "villa-urquiza" },
  { label: "Vicente López", slug: "vicente-lopez" },
  { label: "Olivos", slug: "olivos" },
  { label: "Florida", slug: "florida" },
  { label: "La Lucila", slug: "la-lucila" },
  { label: "Munro", slug: "munro" },
  { label: "Villa Martelli", slug: "villa-martelli" },
  { label: "San Isidro", slug: "san-isidro" },
  { label: "Martínez", slug: "martinez" },
  { label: "Acassuso", slug: "acassuso" },
  { label: "Beccar", slug: "beccar" },
  { label: "San Fernando", slug: "san-fernando" },
  { label: "Tigre", slug: "tigre" },
]

const PROPERTY_TYPES = ["Departamento", "Casa", "PH", "Local", "Oficina", "Otro"]

const ROOM_OPTIONS = [
  "Monoambiente",
  "2 ambientes",
  "3 ambientes",
  "4 ambientes",
  "5 o más ambientes",
]

const PRICE_OPTIONS = [
  { label: "$300.000", value: "300000" },
  { label: "$400.000", value: "400000" },
  { label: "$500.000", value: "500000" },
  { label: "$600.000", value: "600000" },
  { label: "$700.000", value: "700000" },
  { label: "$800.000", value: "800000" },
  { label: "$900.000", value: "900000" },
  { label: "$1.000.000", value: "1000000" },
  { label: "$1.100.000", value: "1100000" },
  { label: "$1.200.000", value: "1200000" },
  { label: "$1.300.000", value: "1300000" },
  { label: "$1.500.000", value: "1500000" },
  { label: "$1.800.000", value: "1800000" },
  { label: "$2.000.000+", value: "2000000" },
]

const AVAILABILITY_OPTIONS = [
  "Ahora",
  "En 1 a 3 meses",
  "En 6 meses o más",
]

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

    const neighborhoodSlug = String(formData.get("neighborhood_slug") || "").trim()
    const selectedNeighborhood = NEIGHBORHOOD_OPTIONS.find(
      (item) => item.slug === neighborhoodSlug
    )

    const zone = selectedNeighborhood?.label || ""
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
      neighborhood_slugs: [neighborhoodSlug],
      neighborhood_slug: neighborhoodSlug,
      property_type: propertyType,
      property_rooms: propertyRooms,
      approx_price: approxPrice,
      availability_status: availabilityStatus,
      source: "verlo_propietarios",
      metadata: {
        page: "propietarios",
        owner_notes: notes,
        property_rooms: propertyRooms,
        neighborhood_slug: neighborhoodSlug,
        neighborhood_label: zone,
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
      setMessage("Listo. Recibimos los datos mínimos de tu propiedad. Te vamos a escribir si encontramos compatibilidad con búsquedas activas.")
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
          <VerloBrand width={34} />

          <div className="nav-links">
            <a href="#demanda">Demanda activa</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#cargar" className="nav-cta">Revisar match</a>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Propietarios / Verlo</p>

            <h1>
              Hay inquilinos buscando alquilar directo. Tu propiedad puede matchear.
            </h1>

            <p className="hero-copy">
              Hay muchos inquilinos entrando a Verlo porque alquilar directo es muchísimo más barato que pagar comisión inmobiliaria.
            </p>

            <p className="hero-copy secondary">
              Si tenés una propiedad, podés revisar gratis si matchea con búsquedas activas. No te pedimos fotos, videos ni domicilio exacto para empezar. Solo datos mínimos.
            </p>

            <div className="hero-actions">
              <a href="#cargar" className="primary-btn">Ver si mi propiedad matchea</a>
              <a href="#como-funciona" className="secondary-btn">Conocer el proceso</a>
            </div>

            <div className="trust-row">
              <span>No pedimos domicilio exacto</span>
              <span>No pedimos fotos para empezar</span>
              <span>El propietario no paga nada</span>
              <span>Contrato y renovación ordenados</span>
            </div>
          </div>

          <aside className="hero-card">
            <div className="hero-card-top">
              <p>Demanda activa</p>
              <strong>Búsquedas activas</strong>
            </div>

            <div className="mini-demand-list">
              {DEMAND.slice(0, 4).map((item) => (
                <div className="mini-demand-item" key={item.neighborhood}>
                  <span>{item.neighborhood}</span>
                  <strong>{item.leads}</strong>
                </div>
              ))}
            </div>

            <div className="hero-note">
              Si hay compatibilidad real, recién ahí te pedimos fotos, videos o más detalles para contactarte con inquilinos calificados.
            </div>
          </aside>
        </div>
      </section>

      <section id="demanda" className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Demanda</p>
            <h2>Inquilinos buscando en zonas activas</h2>
            <p>
              Verlo concentra búsquedas de personas que quieren alquilar directo porque es muchísimo más barato que entrar por inmobiliaria. Primero revisamos compatibilidad; después avanzamos.
            </p>
          </div>

          <div className="demand-grid">
            {DEMAND.map((item) => (
              <article className="demand-card" key={item.neighborhood}>
                <span>{item.neighborhood}</span>
                <strong>{item.leads}</strong>
                {/*<p>búsquedas activas</p>*/}
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
            <h2>El propietario deja datos mínimos. Verlo hace el resto.</h2>
            <p>
              No publicás tu dirección, no subís fotos de entrada y no pagás nada. Verlo revisa si tu propiedad puede matchear con búsquedas activas.
            </p>
          </div>

          <div className="steps-grid">
            <article>
              <b>1</b>
              <h3>Dejás datos mínimos</h3>
              <p>Barrio, tipo, ambientes, precio estimado y disponibilidad. No pedimos domicilio exacto, fotos ni videos para empezar.</p>
            </article>

            <article>
              <b>2</b>
              <h3>Revisamos compatibilidad</h3>
              <p>Cruzamos tu propiedad con búsquedas activas de inquilinos que quieren alquilar directo.</p>
            </article>

            <article>
              <b>3</b>
              <h3>Pedimos más detalles solo si hay match</h3>
              <p>Si hay compatibilidad real, recién ahí te pedimos fotos, videos o más detalles para contactarte con inquilinos calificados.</p>
            </article>

            <article>
              <b>4</b>
              <h3>Verlo coordina hasta contrato</h3>
              <p>Nos ocupamos de coordinación, validación, contrato, firma y datos guardados para futuras renovaciones.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="cargar" className="section form-section">
        <div className="container form-grid">
          <div>
            <p className="eyebrow">Revisar compatibilidad</p>
            <h2>Decinos lo mínimo para ver si hay match</h2>
            <p>
              No es una publicación. No te pedimos fotos, videos ni domicilio exacto. Solo los datos necesarios para cruzar tu propiedad con búsquedas activas.
            </p>

            <div className="promise-card">
              <strong>El propietario no paga nada</strong>
              <span>
                Si hay compatibilidad, Verlo avanza con coordinación, validación, contrato, firma y guardado de datos para futuras renovaciones.
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
              <select name="neighborhood_slug" required defaultValue="">
                <option value="" disabled>Elegí el barrio</option>
                {NEIGHBORHOOD_OPTIONS.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.label}
                  </option>
                ))}
              </select>
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
              <select name="approx_price" required defaultValue="">
                <option value="" disabled>Elegí un precio aproximado</option>
                {PRICE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
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
                placeholder="Expensas, requisitos o algo importante para evaluar compatibilidad."
                rows={4}
              />
            </label>

            <button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Guardando..." : "Ver si mi propiedad matchea"}
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
          <div className="footer-brand">
            <VerloBrand width={86} />
            <p>Alquiler directo, seguro y sin comisión.</p>
          </div>

          <nav className="footer-links">
            <a href="/terminos">Términos y condiciones</a>
            <a href="/privacidad">Política de privacidad</a>
            const CONTACT_HREF =
  "https://mail.zoho.com/zm/#compose?to=hola@verlo.lat&subject=Consulta%20Verlo"
          </nav>
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
    max-width: 720px;
    color: rgba(5, 0, 2, .68);
    font-size: 20px;
    line-height: 1.48;
    font-weight: 650;
  }

  .hero-copy.secondary {
    margin-top: 12px;
    color: rgba(5, 0, 2, .6);
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
    background: rgba(255,255,255,.78);
    border: 1px solid rgba(5,0,2,.09);
    box-shadow: 0 28px 80px rgba(5,0,2,.1);
    transform: none;
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
    font-size: 20px;
    font-weight: 950;
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
    max-width: 860px;
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
    min-height: 280px;
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

    .footer-links {
      justify-content: flex-start;
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
