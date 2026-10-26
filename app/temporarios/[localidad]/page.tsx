import type {Metadata} from "next"
import Link from "next/link"
import {notFound} from "next/navigation"
import BrandHeader from "@/app/temporarios/BrandHeader"
import {locations,locationBySlug} from "@/lib/seo/argentina-locations"
import {shell,container,hero,heading,script,subtitle,button,outline,panel} from "@/app/temporarios/brand"
type Props={params:{localidad:string}}
export const dynamicParams=false
export function generateStaticParams(){return locations.map(x=>({localidad:x.slug}))}
function getLocation(slug:string){return locationBySlug.get(slug)}
export function generateMetadata({params}:Props):Metadata{
 const l=getLocation(params.localidad)
 if(!l)return {title:"Localidad no encontrada | VERLO",robots:{index:false,follow:false}}
 const title=`Alquileres temporarios en ${l.name}, ${l.province} | VERLO`
 const description=`Buscá o publicá alquileres temporarios en ${l.name}. Elegí fechas y presupuesto para estadías de 1 a 90 noches, directo con propietarios en VERLO.`
 const canonical=`https://verlo.lat/temporarios/${l.slug}`
 // Prevent thin geo pages from being indexed without substantive local context.
 const indexable=l.featured&&Boolean(l.highlight)
 return {title,description,alternates:{canonical},robots:{index:indexable,follow:true},openGraph:{title,description,url:canonical,siteName:"VERLO",locale:"es_AR",type:"website"}}
}
export default function LocalidadTemporarios({params}:Props){
 const l=getLocation(params.localidad)
 if(!l)notFound()
 const nearby=locations.filter(x=>x.province===l.province&&x.slug!==l.slug).slice(0,8)
 const link=`/temporarios/buscar?zona=${encodeURIComponent(l.slug)}`
 return <main style={shell}>
  <BrandHeader/>
  <div style={container}>
   <section style={{...hero,paddingBottom:46}}>
    <p style={{fontWeight:900,fontSize:12,letterSpacing:".14em",textTransform:"uppercase"}}>Alquileres temporarios · {l.province}</p>
    <h1 style={{...heading,fontSize:"clamp(42px,6vw,76px)"}}>Temporarios en {l.name}. <em style={script}>Directo con dueños.</em></h1>
    <p style={subtitle}>Elegí las fechas, el tipo de alojamiento y tu presupuesto. Buscá estadías de 1 a 90 noches en {l.name}, sin comisión inmobiliaria.</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:14,marginTop:24}}>
     <Link style={button} href={link}>Buscar en {l.name}</Link>
     <Link style={outline} href="/temporarios/publicar">Publicar alojamiento</Link>
    </div>
   </section>
   <section style={{...panel,marginBottom:44}}>
    <h2 style={{fontSize:"clamp(25px,4vw,42px)",letterSpacing:"-.04em"}}>Alquilá en {l.name} a tu manera.</h2>
    {l.highlight&&<p>{l.highlight}</p>}
    <p>En VERLO registrás las localidades que te interesan, el presupuesto total y las fechas. Las coincidencias dependen de que existan propiedades disponibles; no mostramos alojamientos inventados.</p>
    <p><strong>Propietarios publican gratis.</strong> Para inquilinos, VERLO cobra $49.999 por los servicios del contrato; el alojamiento se acuerda y paga directamente al propietario.</p>
   </section>
   <section style={{marginBottom:70}}>
    <h2 style={{fontSize:28}}>Otras localidades de {l.province}</h2>
    <nav style={{display:"flex",flexWrap:"wrap",gap:12,marginTop:20}} aria-label="Otras localidades">
     {nearby.map(x=><Link key={x.slug} href={`/temporarios/${x.slug}`} style={{padding:"12px 18px",background:"#fff",borderRadius:99,textDecoration:"none",color:"#050002",fontWeight:800}}>{x.name}</Link>)}
    </nav>
   </section>
  </div>
 </main>
}
