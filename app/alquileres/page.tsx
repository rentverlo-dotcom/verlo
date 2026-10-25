import type { Metadata } from "next"
import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"
import { locations } from "@/lib/seo/argentina-locations"

export const metadata: Metadata = {
  title: "Alquileres en Argentina por ciudad y provincia | VERLO",
  description: "Explorá ciudades y localidades de Argentina donde podés cargar tu búsqueda de alquiler directo con propietarios. Publicar es gratis en VERLO.",
  alternates: { canonical: "https://verlo.lat/alquileres" },
}

const provinces = Array.from(new Set(locations.map(location => location.province)))

export default function DirectorioAlquileres() {
  return (
    <main className="verlo-directory">
      <header className="nav"><div className="container nav-inner">
        <VerloBrand width={112}/>
        <nav className="nav-links"><Link href="/#sumate">Alquilar</Link><Link href="/propietarios">Publicar</Link><Link className="nav-cta" href="/login">Ingresar</Link></nav>
      </div></header>
      <section className="hero"><div className="container">
        <p className="kicker">ALQUILER DIRECTO EN ARGENTINA</p>
        <h1>Encontrá tu lugar. <em>Encontrá tu match.</em></h1>
        <p className="lead">Explorá las zonas donde podés iniciar tu búsqueda de alquiler en VERLO. No se muestran propiedades ni disponibilidades ficticias: cargás tus preferencias y el sistema busca coincidencias cuando existen publicaciones compatibles.</p>
        <div className="actions"><Link className="button primary" href="/#sumate">Cargar mi búsqueda</Link><Link className="button secondary" href="/propietarios">Publicar gratis</Link></div>
      </div></section>
      <section className="listing"><div className="container">
        <p className="kicker">LAS 24 JURISDICCIONES</p>
        <h2>Elegí una provincia o ciudad</h2>
        <div className="provinces">
          {provinces.map(province => {
            const entries=locations.filter(location => location.province === province)
            return <section key={province} className="province">
              <h3>{province}</h3>
              <div className="cities">{entries.map(location => <Link key={location.slug} href={`/alquileres/${location.slug}`}>{location.name}</Link>)}</div>
            </section>
          })}
        </div>
      </div></section>
      <footer><div className="container footer"><VerloBrand width={54}/><div><Link href="/">Inicio</Link><Link href="/terminos">Términos</Link><Link href="/privacidad">Privacidad</Link></div></div></footer>
      <style>{`
        .verlo-directory{--pink:#f2a8a9;--black:#050002;--soft:#f2ebec;--blue:#74bedc;background:var(--soft);color:var(--black);min-height:100vh;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .verlo-directory *{box-sizing:border-box}.verlo-directory .container{width:min(1160px,calc(100% - 40px));margin:0 auto}
        .verlo-directory .nav{position:sticky;top:0;z-index:20;backdrop-filter:blur(18px);background:rgba(242,235,236,.9);border-bottom:1px solid rgba(5,0,2,.08)}
        .verlo-directory .nav-inner{min-height:92px;display:flex;justify-content:space-between;align-items:center;gap:20px}
        .verlo-directory .nav-links{display:flex;gap:20px;align-items:center}.verlo-directory .nav-links a{color:#050002;font-size:14px;text-decoration:none;font-weight:900}
        .verlo-directory .nav-links .nav-cta{border-radius:999px;background:#272225;color:white;padding:12px 18px}
        .verlo-directory .hero{padding:85px 0;background:radial-gradient(circle at 90% 20%,rgba(116,190,220,.25),transparent 35%),var(--soft)}
        .verlo-directory .kicker{font-size:12px;letter-spacing:.16em;font-weight:900;text-transform:uppercase}
        .verlo-directory h1{font-size:clamp(43px,6vw,76px);line-height:1.06;letter-spacing:-.06em;margin:25px 0;font-weight:900;max-width:920px}
        .verlo-directory h1 em{font-family:Georgia,"Times New Roman",serif;font-weight:400}.verlo-directory .lead{font-size:19px;line-height:1.55;color:rgba(5,0,2,.7);max-width:770px}
        .verlo-directory .actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:33px}.verlo-directory .button{display:inline-flex;border-radius:999px;padding:16px 24px;font-weight:900;text-decoration:none;text-align:center}
        .verlo-directory .primary{background:#050002;color:white}.verlo-directory .secondary{background:white;color:#050002}
        .verlo-directory .listing{padding:55px 0 90px;background:#f8f5f5}.verlo-directory h2{font-size:clamp(32px,4vw,46px);letter-spacing:-.04em}
        .verlo-directory .provinces{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin-top:35px}
        .verlo-directory .province{border:1px solid rgba(5,0,2,.09);background:white;border-radius:27px;padding:28px}
        .verlo-directory .province h3{font-size:22px;letter-spacing:-.03em;margin:0 0 20px}.verlo-directory .cities{display:flex;flex-wrap:wrap;gap:10px}
        .verlo-directory .cities a{border:1px solid #ebe4e4;background:#faf7f7;color:#050002;text-decoration:none;font-size:14px;font-weight:700;border-radius:999px;padding:10px 14px}
        .verlo-directory footer{border-top:1px solid rgba(5,0,2,.1);padding:30px 0}.verlo-directory .footer{display:flex;justify-content:space-between;align-items:center;gap:25px}.verlo-directory .footer>div:last-child{display:flex;gap:18px}.verlo-directory .footer a{text-decoration:none;color:#050002;font-size:13px;font-weight:800}
        @media(max-width:740px){.verlo-directory .provinces{grid-template-columns:1fr}.verlo-directory .hero{padding:60px 0}.verlo-directory .nav-links{gap:10px}.verlo-directory .nav-links a{font-size:12px}.verlo-directory .nav-inner{min-height:78px}.verlo-directory .nav-links .nav-cta{padding:10px 12px}.verlo-directory .container{width:calc(100% - 28px)}.verlo-directory .province{padding:24px}.verlo-directory .footer{flex-wrap:wrap}}
      `}</style>
    </main>
  )
}
