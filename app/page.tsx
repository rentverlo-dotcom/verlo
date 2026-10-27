"use client"
import {useEffect} from "react"
import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"
import {trackPostHog} from "@/lib/posthog-client"
export default function Home(){
  useEffect(()=>{
    const {search,hash}=window.location
    // Keep all historic Meta Ads and SEO deep links pointing at the existing form.
    if(search||hash==="#sumate"||hash==="#cargar") window.location.replace("/permanentes"+search+hash)
  },[])
  const choose=(kind:"permanente"|"temporario")=>trackPostHog("rental_type_selected",{rental_type:kind})
  const card={display:"grid",gap:16,background:"#fff",border:"1px solid rgba(5,0,2,.09)",borderRadius:28,padding:"clamp(24px,4vw,42px)",textDecoration:"none",color:"#050002",boxShadow:"0 18px 42px rgba(5,0,2,.06)"} as const
  const button={display:"inline-flex",justifyContent:"center",alignItems:"center",borderRadius:50,padding:"15px 22px",background:"#050002",color:"#fff",fontWeight:900,maxWidth:190} as const
  return <main style={{minHeight:"100vh",background:"#f2ebec",color:"#050002",fontFamily:"Inter,system-ui,sans-serif"}}>
    <header style={{padding:"26px max(24px,calc((100vw - 1150px)/2))",background:"#f2ebec",borderBottom:"1px solid rgba(5,0,2,.09)",color:"#050002"}}><Link href="/" aria-label="VERLO inicio"><VerloBrand width={112}/></Link></header>
    <section style={{maxWidth:1120,margin:"0 auto",padding:"clamp(55px,8vw,105px) 24px 90px"}}>
      <p style={{fontSize:13,fontWeight:900,letterSpacing:".16em"}}>PARA QUIENES BUSCAN Y OFRECEN ALQUILERES</p>
      <h1 style={{fontSize:"clamp(37px,6vw,70px)",letterSpacing:"-.06em",lineHeight:1.08,maxWidth:850}}>¿Qué tipo de alquiler buscás u ofrecés?</h1>
      <p style={{fontSize:19,color:"#61575c",marginBottom:36}}>Elegí una opción para continuar en VERLO.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,310px),1fr))",gap:20}}>
        <Link href="/permanentes" onClick={()=>choose("permanente")} style={card}>
          <div style={{fontSize:12,fontWeight:900,color:"#a26473",letterSpacing:".1em"}}>ALQUILER PERMANENTE</div>
          <strong style={{fontSize:32,letterSpacing:"-.04em"}}>Permanente</strong>
          <p style={{fontSize:17,lineHeight:1.5,margin:0}}>Buscá o publicá una propiedad.</p>
          <span style={button}>Continuar</span>
        </Link>
        <Link href="/temporarios" onClick={()=>choose("temporario")} style={card}>
          <div style={{fontSize:12,fontWeight:900,color:"#a26473",letterSpacing:".1em"}}>ALQUILER TEMPORARIO</div>
          <strong style={{fontSize:32,letterSpacing:"-.04em"}}>Temporario</strong>
          <p style={{fontSize:17,lineHeight:1.5,margin:0}}>De 1 a 90 noches. Elegí fechas y destino.</p>
          <span style={button}>Continuar</span>
        </Link>
      </div>
    </section>
    <footer style={{padding:"40px max(24px,calc((100vw - 1120px)/2))",borderTop:"1px solid rgba(5,0,2,.1)",display:"flex",gap:22,flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",fontSize:14,fontWeight:800}}>
      <VerloBrand width={86}/>
      <nav style={{display:"flex",gap:18,flexWrap:"wrap"}}><Link href="/terminos">Términos y condiciones</Link><Link href="/privacidad">Política de privacidad</Link><a href="mailto:hola@verlo.lat">hola@verlo.lat</a></nav>
    </footer>
  </main>
}
