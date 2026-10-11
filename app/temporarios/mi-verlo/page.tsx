"use client"
import BrandHeader from "@/app/temporarios/BrandHeader"
import PropertyPhotoUpload from "./PropertyPhotoUpload"
import PropertyGallery from "./PropertyGallery"
import LodgingMatchCard from "./LodgingMatchCard"
import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import VerloBrand from "@/components/VerloBrand"
import { shell, container, nav, navInner, panel, button } from "../brand"

const typeName=(value:string)=>({casa:"Casa",departamento:"Departamento",cabana:"Cabaña",habitacion:"Habitación"} as Record<string,string>)[value]||"Alojamiento"
const stateName=(value:string)=>({draft:"Borrador",published:"Publicada",active:"Activa",new:"Nueva coincidencia",accepted:"Ambos aceptaron",rejected:"Rechazada",paused:"Pausada",archived:"Archivada"} as Record<string,string>)[value]||"En proceso"
const displayDate=(value:string)=>{const parts=value.split("-");return parts.length===3?parts[2]+"/"+parts[1]+"/"+parts[0]:value}
type Property = {id:string;locality_label:string;property_type:string;nightly_price_ars:number;availability_start:string;availability_end:string;status:string}
type Demand = {id:string;locality_keys:string[];property_type:string;check_in:string;check_out:string;max_total_budget_ars:number;status:string}
type Match = {id:string;property_id:string;demand_id:string;check_in:string;check_out:string;agreed_total_ars:number;status:string;owner_decision:string;tenant_decision:string;temporary_properties?:{locality_label:string;property_type:string;nightly_price_ars?:number;title?:string;description?:string;public_location_reference?:string;max_guests?:number}|null}
type Reservation={id:string;match_id:string;status:string;agreed_terms_owner_at:string|null;agreed_terms_tenant_at:string|null}
type Mine = {ok:true;properties:Property[];demands:Demand[];ownerMatches:Match[];tenantMatches:Match[];reservations:Reservation[];media:Array<{id:string;property_id:string;mime_type:string}>} | {ok:false;error:string}

export default function MyTemporaries() {
  const [result,setResult] = useState<Mine|null>(null)
  const [loading,setLoading] = useState(true)
  const [refresh,setRefresh] = useState(0)
  const [deciding,setDeciding] = useState("")
  const [decisionError,setDecisionError] = useState("")
  async function decide(matchId:string,role:"owner"|"tenant",decision:"accepted"|"rejected") {
    const key=matchId+":"+role
    if(deciding)return
    setDeciding(key)
    setDecisionError("")
    try{
      const {data:{session}}=await supabase.auth.getSession()
      if(!session?.access_token)throw new Error("Iniciá sesión para continuar")
      const response=await fetch("/api/temporarios/matches/decide",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({matchId,role,decision})})
      const data:{ok?:boolean;error?:string;match?:{status:string;ownerDecision:string;tenantDecision:string}}=await response.json()
      if(!response.ok||!data.ok||!data.match)throw new Error(data.error||"No se pudo guardar tu respuesta")
      setResult(old=>old?.ok ? {...old,ownerMatches:old.ownerMatches.map(m=>m.id===matchId?{...m,status:data.match!.status,owner_decision:data.match!.ownerDecision,tenant_decision:data.match!.tenantDecision}:m),tenantMatches:old.tenantMatches.map(m=>m.id===matchId?{...m,status:data.match!.status,owner_decision:data.match!.ownerDecision,tenant_decision:data.match!.tenantDecision}:m)} : old)
    }catch(error){setDecisionError(error instanceof Error?error.message:"Error de conexión")}
    finally{setDeciding("")}
  }
  useEffect(()=>{
    let active = true
    async function load() {
      try {
        const {data:{session}} = await supabase.auth.getSession()
        if (!session?.access_token) {if(active){setResult({ok:false,error:"Iniciá sesión para ver tus temporarios."});setLoading(false)};return}
        const response = await fetch("/api/temporarios/mine",{
          headers:{Authorization:"Bearer "+session.access_token},
          cache:"no-store",
        })
        const data:Mine = await response.json()
        if(active){setResult(data);setLoading(false)}
      } catch {if(active){setResult({ok:false,error:"No pudimos consultar tus registros."});setLoading(false)}}
    }
    void load()
    return ()=>{active=false}
  },[refresh])
  return <main style={shell}>
    <BrandHeader/>
    <div style={{...container,maxWidth:1060,paddingTop:55,paddingBottom:80}}>
      <section style={panel}>
        <h1 style={{fontSize:"clamp(34px,6vw,62px)",fontWeight:950,letterSpacing:"-.05em"}}>Mis temporarios</h1>
        <p style={{color:"#676066",fontSize:17}}>Tus alojamientos, búsquedas y coincidencias, en un solo lugar.</p>
        {loading ? <p role="status">Consultando...</p> : result && "error" in result ? <>
          <p role="status">{result.error}</p>
          <Link href="/temporarios/acceso?next=/temporarios/mi-verlo" style={{...button,display:"inline-flex"}}>Ingresar a VERLO</Link>
        </> : result && result.ok ? <>
          <h2>Mis propiedades ({result.properties.length})</h2>
          {result.properties.length ? result.properties.map(p=><article key={p.id} style={{padding:18,marginBottom:12,background:"#fff",borderRadius:16}}>
            <PropertyGallery photos={result.media.filter(x=>x.property_id===p.id)}/>
            <strong>{typeName(p.property_type)} · {p.locality_label}</strong>
            <p>{Number(p.nightly_price_ars).toLocaleString("es-AR",{style:"currency",currency:"ARS"})} por noche</p>
            <p>{displayDate(p.availability_start)} al {displayDate(p.availability_end)} · Estado: {stateName(p.status)}</p>
            <PropertyPhotoUpload propertyId={p.id} onUploaded={()=>setRefresh(v=>v+1)}/>
          </article>) : <p>Todavía no tenés propiedades temporarias registradas.</p>}
          {decisionError && <p role="alert">{decisionError}</p>}
          <h2>Interesados en mis propiedades ({result.ownerMatches.length})</h2>
          {result.ownerMatches.length ? result.ownerMatches.map(m=><LodgingMatchCard key={m.id} match={m} photos={result.media.filter(x=>x.property_id===m.property_id)} role="owner" reservation={result.reservations.find(x=>x.match_id===m.id)} onRefresh={()=>setRefresh(v=>v+1)} onDecision={(id,r,d)=>void decide(id,r,d)} disabled={Boolean(deciding)}/>) : <p>Aún no hay coincidencias para tus propiedades.</p>}
          <h2>Mis búsquedas ({result.demands.length})</h2>
          {result.demands.length ? result.demands.map(d=><article key={d.id} style={{padding:18,marginBottom:12,background:"#fff",borderRadius:16}}>
            <strong>{typeName(d.property_type)}</strong>
            <p>{displayDate(d.check_in)} al {displayDate(d.check_out)} · Presupuesto {Number(d.max_total_budget_ars).toLocaleString("es-AR",{style:"currency",currency:"ARS"})}</p>
            <p>Estado: {stateName(d.status)}</p>
          </article>) : <p>Todavía no tenés búsquedas temporarias registradas.</p>}
          <h2>Alojamientos para mis búsquedas ({result.tenantMatches.length})</h2>
          {result.tenantMatches.length ? result.tenantMatches.map(m=><LodgingMatchCard key={m.id} match={m} photos={result.media.filter(x=>x.property_id===m.property_id)} role="tenant" reservation={result.reservations.find(x=>x.match_id===m.id)} onRefresh={()=>setRefresh(v=>v+1)} onDecision={(id,r,d)=>void decide(id,r,d)} disabled={Boolean(deciding)}/>) : <p>Aún no hay coincidencias para tus búsquedas.</p>}
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:24}}>
            <Link href="/temporarios/publicar" style={button}>Publicar</Link>
            <Link href="/temporarios/buscar" style={button}>Buscar</Link>
          </div>
        </> : null}
      </section>
    </div>
  </main>
}
