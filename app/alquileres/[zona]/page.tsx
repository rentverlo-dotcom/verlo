import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import VerloBrand from "@/components/VerloBrand"
import { locations, locationBySlug } from "@/lib/seo/argentina-locations"

type Props = { params: { zona: string } }

export const dynamicParams = false

export function generateStaticParams() {
  return locations.filter(location => location.slug !== "olivos").map(location => ({ zona: location.slug }))
}

function getLocation(slug: string) {
  if (slug === "olivos") return undefined
  return locationBySlug.get(slug)
}

export function generateMetadata({ params }: Props): Metadata {
  const location = getLocation(params.zona)
  if (!location) return { title: "Zona no encontrada | VERLO", robots: { index: false, follow: false } }
  const title = `Alquileres en ${location.name}, ${location.province} | VERLO`
  const description = `Buscá alquileres directos con propietarios en ${location.name}, ${location.province}. Cargá tu búsqueda gratis y encontrá coincidencias en VERLO. Sin comisión inmobiliaria.`
  const canonical = `https://verlo.lat/alquileres/${location.slug}`
  // Avoid thin/duplicate geo landings in Google's index until genuinely enriched.
  const indexable = location.featured && Boolean(location.highlight)
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: indexable, follow: true },
    openGraph: { title, description, url: canonical, siteName: "VERLO", locale: "es_AR", type: "website" },
  }
}

export default function AlquileresZona({ params }: Props) {
  const location = getLocation(params.zona)
  if (!location) notFound()
  const nearby = locations.filter(other => other.slug !== location.slug && other.province === location.province).slice(0, 8)
  return (
    <main className="verlo-geo">
      <header className="nav">
        <div className="container nav-inner">
          <VerloBrand width={112} />
          <nav className="nav-links" aria-label="Navegación principal">
            <Link href={`/?zona=${location.slug}#sumate`}>Alquilar</Link>
            <Link href={`/propietarios?zona=${location.slug}#cargar`}>Publicar</Link>
            <Link href="/login" className="nav-cta">Ingresar</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="kicker">ALQUILERES EN {location.name.toLocaleUpperCase("es-AR")} · {location.province.toLocaleUpperCase("es-AR")}</p>
            <h1>Alquilá en {location.name}. <em>Directo con dueños.</em></h1>
            <p className="hero-copy">
              ¿Buscás una casa, departamento o PH en {location.name}?
              En VERLO cargás tu búsqueda y conectás con propietarios compatibles cuando hay publicaciones disponibles.
            </p>
            <div className="actions">
              <Link className="button primary" href={`/?zona=${location.slug}#sumate`}>Busco alquilar</Link>
              <Link className="button secondary" href={`/propietarios?zona=${location.slug}#cargar`}>Tengo una propiedad</Link>
            </div>
            <p className="microcopy">
              Cargar una búsqueda es gratis. El propietario publica gratis.
              El inquilino paga una sola vez $119.000 cuando llega al cierre del alquiler.
            </p>
          </div>
          <aside className="match-card" aria-label={`Ejemplo de búsqueda en ${location.name}`}>
            <p className="match-kicker">TU BÚSQUEDA EN VERLO</p>
            <div className="match-line"><span>Ciudad o localidad</span><strong>{location.name}</strong></div>
            <div className="match-line"><span>Provincia</span><strong>{location.province}</strong></div>
            <div className="match-line"><span>Tipo</span><strong>Lo elegís vos</strong></div>
            <div className="match-line"><span>Presupuesto</span><strong>Lo elegís vos</strong></div>
            <div className="match-state">Encontrá tu match</div>
            <p className="match-note">Ejemplo ilustrativo del proceso, no una propiedad publicada ni garantía de disponibilidad.</p>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="kicker">EXPLORÁ {location.name.toLocaleUpperCase("es-AR")}</p>
          <h2>Un alquiler en {location.name}, <em>a tu manera.</em></h2>
          {location.highlight && <p className="section-copy">{location.highlight} Definí el tipo de propiedad y el presupuesto que necesitás antes de enviar tu búsqueda.</p>}
          <div className="steps">
            <article><span className="step-number">01</span><h3>Cargá tu búsqueda</h3><p>Seleccioná {location.name} y las demás localidades donde estarías dispuesto a alquilar.</p></article>
            <article><span className="step-number">02</span><h3>Encontrá coincidencias</h3><p>VERLO compara tus preferencias con propiedades publicadas por dueños, cuando existan opciones compatibles.</p></article>
            <article><span className="step-number">03</span><h3>Avanzá con seguridad</h3><p>Coordiná el siguiente paso y gestioná el proceso de alquiler desde VERLO.</p></article>
          </div>
        </div>
      </section>

      <section className="section tinted">
        <div className="container">
          <p className="kicker">OTRAS ZONAS DE {location.province.toLocaleUpperCase("es-AR")}</p>
          <h2>Ampliá tu búsqueda <em>si querés.</em></h2>
          <div className="pills">
            {nearby.map(other => <Link className="pill" key={other.slug} href={`/alquileres/${other.slug}`}>{other.name}</Link>)}
          </div>
          <div className="closing">
            <div>
              <h2>¿Tenés una propiedad en {location.name}?</h2>
              <p>Publicala gratis en VERLO y recibí candidatos compatibles.</p>
            </div>
            <Link className="button primary" href={`/propietarios?zona=${location.slug}#cargar`}>Publicar gratis</Link>
          </div>
        </div>
      </section>

      <footer className="footer"><div className="container footer-inner">
        <VerloBrand width={54} />
        <div><Link href="/">Inicio</Link><Link href="/terminos">Términos</Link><Link href="/privacidad">Privacidad</Link></div>
      </div></footer>

      <style>{`
        .verlo-geo{--pink:#f2a8a9;--pink-dark:#c37986;--black:#050002;--soft:#f2ebec;--blue:#74bedc;--yellow:#e7c776;min-height:100vh;background:var(--soft);color:var(--black);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .verlo-geo *{box-sizing:border-box}
        .verlo-geo .container{width:min(1160px,calc(100% - 40px));margin:0 auto}
        .verlo-geo .nav{position:sticky;top:0;z-index:20;backdrop-filter:blur(18px);background:rgba(242,235,236,.9);border-bottom:1px solid rgba(5,0,2,.08)}
        .verlo-geo .nav-inner{min-height:92px;display:flex;align-items:center;justify-content:space-between;gap:24px}
        .verlo-geo .nav-links{display:flex;align-items:center;gap:22px}
        .verlo-geo .nav-links a{color:#050002;font-size:14px;font-weight:900;text-decoration:none}
        .verlo-geo .nav-links .nav-cta{padding:13px 20px;background:#272225;color:white;border-radius:30px}
        .verlo-geo .hero{padding:90px 0 96px;background:radial-gradient(circle at 85% 20%,rgba(116,190,220,.3),transparent 32%),var(--soft)}
        .verlo-geo .hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:72px;align-items:center}
        .verlo-geo .kicker{font-size:12px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;margin:0 0 22px}
        .verlo-geo h1{font-size:clamp(43px,6.2vw,78px);line-height:1.05;letter-spacing:-.06em;margin:0 0 30px;font-weight:900}
        .verlo-geo h1 em,.verlo-geo h2 em{font-family:Georgia,"Times New Roman",serif;font-weight:400}
        .verlo-geo .hero-copy{font-size:20px;line-height:1.55;max-width:600px;color:rgba(5,0,2,.7)}
        .verlo-geo .actions{display:flex;flex-wrap:wrap;gap:12px;margin:35px 0 25px}
        .verlo-geo .button{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;text-decoration:none;font-size:15px;font-weight:900;min-height:53px;padding:14px 25px;text-align:center}
        .verlo-geo .button.primary{background:var(--black);color:white}
        .verlo-geo .button.secondary{background:white;color:var(--black);border:1px solid rgba(5,0,2,.12)}
        .verlo-geo .microcopy{font-size:14px;line-height:1.6;color:rgba(5,0,2,.64);max-width:550px}
        .verlo-geo .match-card{background:white;border:1px solid rgba(5,0,2,.08);padding:32px;border-radius:34px;box-shadow:0 24px 65px rgba(5,0,2,.09)}
        .verlo-geo .match-kicker{font-size:12px;font-weight:900;letter-spacing:.12em;margin:0 0 30px}
        .verlo-geo .match-line{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #ece9e9;padding:17px 0;font-size:15px}
        .verlo-geo .match-line span{color:#706b6d}.verlo-geo .match-line strong{text-align:right}
        .verlo-geo .match-state{background:var(--pink);border-radius:14px;text-align:center;padding:14px;font-weight:900;margin-top:25px}
        .verlo-geo .match-note{font-size:12px;color:#757174;line-height:1.6;margin:16px 0 0}
        .verlo-geo .section{padding:88px 0}.verlo-geo .section h2{font-weight:900;font-size:clamp(32px,4vw,49px);letter-spacing:-.045em;line-height:1.12;margin:0 0 25px}
        .verlo-geo .steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:38px}
        .verlo-geo .steps article{background:white;border-radius:26px;padding:29px;min-height:220px;border:1px solid rgba(5,0,2,.07)}
        .verlo-geo .step-number{font-size:13px;font-weight:900;color:var(--pink-dark)}
        .verlo-geo .steps h3{font-weight:900;font-size:21px;margin:20px 0 12px;letter-spacing:-.03em}
        .verlo-geo .steps p,.verlo-geo .section-copy{color:#615b5e;line-height:1.65;max-width:770px}
        .verlo-geo .tinted{background:#f7f2f2}.verlo-geo .pills{display:flex;flex-wrap:wrap;gap:11px;margin-top:30px}
        .verlo-geo .pill{padding:13px 18px;border-radius:999px;background:white;border:1px solid rgba(5,0,2,.09);font-size:14px;font-weight:800;text-decoration:none;color:#050002}
        .verlo-geo .closing{display:flex;align-items:center;justify-content:space-between;gap:25px;background:var(--pink);border-radius:30px;padding:33px;margin-top:65px}
        .verlo-geo .closing h2{font-size:31px;margin:0 0 10px}
        .verlo-geo .closing p{margin:0;line-height:1.55}
        .verlo-geo .footer{padding:35px 0;border-top:1px solid rgba(5,0,2,.1)}
        .verlo-geo .footer-inner{display:flex;align-items:center;justify-content:space-between;gap:22px}
        .verlo-geo .footer-inner>div:last-child{display:flex;gap:18px;flex-wrap:wrap}
        .verlo-geo .footer a{font-size:13px;font-weight:800;color:#050002;text-decoration:none}
        @media(max-width:800px){.verlo-geo .hero{padding:50px 0}.verlo-geo .hero-grid{grid-template-columns:1fr;gap:32px}.verlo-geo .steps{grid-template-columns:1fr}.verlo-geo .closing{flex-direction:column;align-items:flex-start}.verlo-geo .section{padding:65px 0}}
        @media(max-width:550px){.verlo-geo .nav-inner{min-height:78px}.verlo-geo .nav-links{gap:10px}.verlo-geo .nav-links a{font-size:12px}.verlo-geo .nav-links .nav-cta{padding:10px 12px}.verlo-geo .container{width:calc(100% - 28px)}.verlo-geo .hero-copy{font-size:17px}.verlo-geo .match-card{padding:22px}.verlo-geo .actions{flex-direction:column}.verlo-geo .closing{padding:25px}}
      `}</style>
    </main>
  )
}
