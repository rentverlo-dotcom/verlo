import BrandHeader from "@/app/temporarios/BrandHeader"
"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import VerloBrand from "@/components/VerloBrand"
import { shell, container, nav, navInner, panel, button } from "../brand"

type Property = {id:string;locality_label:string;property_type:string;nightly_price_ars:number;availability_start:string;availability_end:string;status:string}
type Demand = {id:string;locality_keys:string[];property_type:string;check_in:string;check_out:string;max_total_budget_ars:number;status:string}
type Match = {id:string;property_id:string;demand_id:string;check_in:string;check_out:string;agreed_total_ars:number;status:string;owner_decision:string;tenant_decision:string;temporary_properties?:{locality_label:string;property_type:string}|null}
type Mine = {ok:true;properties:Property[];demands:Demand[];ownerMatches:Match[];tenantMatches:Match[]} | {ok:false;error:string}

export default function MyTemporaries() {
  const [result,setResult] = useState<Mine|null>(null)
  const [loading,setLoading] = useState(true)
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
  },[])
  return <main style={shell}>
    <BrandHeader/>
    <div style={{...container,maxWidth:850,paddingTop:55,paddingBottom:80}}>
      <section style={panel}>
        <h1 style={{fontSize:"clamp(34px,6vw,62px)",fontWeight:950,letterSpacing:"-.05em"}}>Mis temporarios</h1>
        <p>Solo podés consultar registros vinculados a tu identidad. Esta vista todavía no administra reservas.</p>
        {loading ? <p role="status">Consultando...</p> : result && "error" in result ? <>
          <p role="status">{result.error}</p>
          <Link href="/temporarios/acceso?next=/temporarios/mi-verlo" style={{...button,display:"inline-flex"}}>Ingresar a VERLO</Link>
        </> : result && result.ok ? <>
          <h2>Mis propiedades ({result.properties.length})</h2>
          {result.properties.length ? result.properties.map(p=><article key={p.id} style={{padding:18,marginBottom:12,background:"#fff",borderRadius:16}}>
            <strong>{p.property_type} · {p.locality_label}</strong>
            <p>{Number(p.nightly_price_ars).toLocaleString("es-AR",{style:"currency",currency:"ARS"})} por noche</p>
            <p>{p.availability_start} a {p.availability_end} · Estado: {p.status}</p>
          </article>) : <p>Todavía no tenés propiedades temporarias registradas.</p>}
          {decisionError && <p role="alert">{decisionError}</p>}
          <h2>Coincidencias de mis propiedades ({result.ownerMatches.length})</h2>
          {result.ownerMatches.length ? result.ownerMatches.map(m=><article key={m.id} style={{padding:18,marginBottom:12,background:"#fff",borderRadius:16}}>
            <strong>{m.temporary_properties?.property_type || "Alojamiento"} · {m.temporary_properties?.locality_label || "Propiedad compatible"}</strong>
            <p>Estadía solicitada: {m.check_in} al {m.check_out}</p>
            <p>Total: {Number(m.agreed_total_ars).toLocaleString("es-AR",{style:"currency",currency:"ARS"})} · Estado: {m.status}</p>
            <p>Tu respuesta: {m.owner_decision === "accepted" ? "Aceptaste" : m.owner_decision === "rejected" ? "Rechazaste" : "Pendiente"} · La otra parte: {m.tenant_decision === "accepted" ? "Aceptó" : m.tenant_decision === "rejected" ? "Rechazó" : "Pendiente"}</p>
            {m.owner_decision === "pending" && m.status === "new" && <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button type="button" disabled={Boolean(deciding)} onClick={()=>void decide(m.id,"owner","accepted")} style={button}>Aceptar coincidencia</button><button type="button" disabled={Boolean(deciding)} onClick={()=>void decide(m.id,"owner","rejected")} style={{...button,background:"#777"}}>Rechazar</button></div>}
          </article>) : <p>Aún no hay coincidencias para tus propiedades.</p>}
          <h2>Mis búsquedas ({result.demands.length})</h2>
          {result.demands.length ? result.demands.map(d=><article key={d.id} style={{padding:18,marginBottom:12,background:"#fff",borderRadius:16}}>
            <strong>{d.property_type}</strong>
            <p>{d.check_in} a {d.check_out} · Presupuesto {Number(d.max_total_budget_ars).toLocaleString("es-AR",{style:"currency",currency:"ARS"})}</p>
            <p>Estado: {d.status}</p>
          </article>) : <p>Todavía no tenés búsquedas temporarias registradas.</p>}
          <h2>Coincidencias de mis búsquedas ({result.tenantMatches.length})</h2>
          {result.tenantMatches.length ? result.tenantMatches.map(m=><article key={m.id} style={{padding:18,marginBottom:12,background:"#fff",borderRadius:16}}>
            <strong>{m.temporary_properties?.property_type || "Alojamiento"} · {m.temporary_properties?.locality_label || "Propiedad compatible"}</strong>
            <p>Estadía: {m.check_in} al {m.check_out}</p>
            <p>Total: {Number(m.agreed_total_ars).toLocaleString("es-AR",{style:"currency",currency:"ARS"})} · Estado: {m.status}</p>
            <p>Tu respuesta: {m.tenant_decision === "accepted" ? "Aceptaste" : m.tenant_decision === "rejected" ? "Rechazaste" : "Pendiente"} · La otra parte: {m.owner_decision === "accepted" ? "Aceptó" : m.owner_decision === "rejected" ? "Rechazó" : "Pendiente"}</p>
            {m.tenant_decision === "pending" && m.status === "new" && <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button type="button" disabled={Boolean(deciding)} onClick={()=>void decide(m.id,"tenant","accepted")} style={button}>Aceptar coincidencia</button><button type="button" disabled={Boolean(deciding)} onClick={()=>void decide(m.id,"tenant","rejected")} style={{...button,background:"#777"}}>Rechazar</button></div>}
          </article>) : <p>Aún no hay coincidencias para tus búsquedas.</p>}
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:24}}>
            <Link href="/temporarios/publicar" style={button}>Publicar</Link>
            <Link href="/temporarios/buscar" style={button}>Buscar</Link>
          </div>
        </> : null}
      </section>
    </div>
  </main>
}
