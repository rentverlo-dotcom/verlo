"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import VerloBrand from "@/components/VerloBrand"
import { shell, container, nav, navInner, panel, button } from "../brand"

type Property = {id:string;locality_label:string;property_type:string;nightly_price_ars:number;availability_start:string;availability_end:string;status:string}
type Demand = {id:string;locality_keys:string[];property_type:string;check_in:string;check_out:string;max_total_budget_ars:number;status:string}
type Match = {id:string;property_id:string;demand_id:string;check_in:string;check_out:string;agreed_total_ars:number;status:string;temporary_properties?:{locality_label:string;property_type:string}|null}
type Mine = {ok:true;properties:Property[];demands:Demand[];ownerMatches:Match[];tenantMatches:Match[]} | {ok:false;error:string}

export default function MyTemporaries() {
  const [result,setResult] = useState<Mine|null>(null)
  const [loading,setLoading] = useState(true)
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
    <header style={nav}><div style={navInner}><VerloBrand width={112}/><Link href="/temporarios">Temporarios</Link></div></header>
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
          <h2>Coincidencias de mis propiedades ({result.ownerMatches.length})</h2>
          {result.ownerMatches.length ? result.ownerMatches.map(m=><article key={m.id} style={{padding:18,marginBottom:12,background:"#fff",borderRadius:16}}>
            <strong>{m.temporary_properties?.property_type || "Alojamiento"} · {m.temporary_properties?.locality_label || "Propiedad compatible"}</strong>
            <p>Estadía solicitada: {m.check_in} al {m.check_out}</p>
            <p>Total: {Number(m.agreed_total_ars).toLocaleString("es-AR",{style:"currency",currency:"ARS"})} · Estado: {m.status}</p>
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
