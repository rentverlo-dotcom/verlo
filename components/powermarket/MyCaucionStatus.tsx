"use client"
import {useEffect,useState} from "react"
import {supabase} from "@/lib/supabase/client"
import {trackPostHog} from "@/lib/posthog-client"
type Quote={id:string;premium_ars:number;coverage_total_ars:number;status:string;valid_until:string|null}
type Item={id:string;status:string;requested_rent_ars:number;estimated_expenses_ars:number;approved_max_total_ars:number|null;decision_expires_at:string|null;created_at:string}
const labels:Record<string,string>={submitted:"Solicitud recibida",under_review:"En evaluación",more_info_required:"Documentación pendiente",prequalified:"Precalificada",not_eligible:"No precalificada",alternative_offered:"Oferta de monto alternativo",expired:"Vencida",withdrawn:"Retirada"}
const money=(n:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n)
export default function MyCaucionStatus(){
 const [items,setItems]=useState<Item[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("")
 const [quotes,setQuotes]=useState<Record<string,Quote|null>>({}),[busy,setBusy]=useState(false)
 useEffect(()=>{let active=true;(async()=>{const {data}=await supabase.auth.getSession();if(!data.session){if(active)setLoading(false);return}
 const res=await fetch("/api/powermarket/my-status",{headers:{Authorization:`Bearer ${data.session.access_token}`},cache:"no-store"})
 const body=await res.json().catch(()=>({}));if(!active)return;if(!res.ok)setError(body.error||"No disponible");else {
 const apps:Item[]=body.applications||[]
 setItems(apps)
 const found=await Promise.all(apps.map(async item=>{
  const response=await fetch(`/api/powermarket/my-quote?application_id=${encodeURIComponent(item.id)}`,{headers:{Authorization:`Bearer ${data.session!.access_token}`},cache:"no-store"})
  const result=await response.json().catch(()=>({}))
  return [item.id,response.ok?(result.quote||null):null] as const
 }))
 if(active)setQuotes(Object.fromEntries(found))
}setLoading(false)})();return()=>{active=false}},[])
 async function accept(item:Item,quote:Quote){
 if(busy||quote.status!=="offered")return
 if(!window.confirm("¿Aceptás esta cotización de caución? No implica pago ni emisión de póliza."))return
 setBusy(true);setError("")
 const {data}=await supabase.auth.getSession()
 const res=await fetch("/api/powermarket/my-quote",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${data.session?.access_token||""}`},body:JSON.stringify({application_id:item.id,quote_id:quote.id,action:"accept"})}).catch(()=>null)
 const result=await res?.json().catch(()=>({}))
 if(res?.ok&&result?.quote){setQuotes(prev=>({...prev,[item.id]:{...quote,status:"accepted"}}));trackPostHog("caucion_quote_accepted",{area:"powermarket",role:"tenant"})}
 else {setError(result?.error||"No se pudo aceptar la cotización");trackPostHog("caucion_quote_accept_failed",{area:"powermarket",role:"tenant"})}
 setBusy(false)
 }
 if(loading||(!items.length&&!error))return null
 return <section style={{background:"#fff",border:"1px solid rgba(5,0,2,.10)",borderRadius:22,padding:22,margin:"20px 0",color:"#050002"}}>
 <h2 style={{fontSize:24,margin:"0 0 12px"}}>Mi caución</h2>\n <p style={{fontSize:13,lineHeight:1.6,margin:"0 0 12px"}}>PowerMarket, broker de seguros asociado a VERLO, gestiona el seguimiento de tu solicitud con la compañía aseguradora. Te avisaremos cuando haya novedades. El pago de la caución se realiza por fuera de VERLO, con la entidad correspondiente.</p>
 {error?<p>{error}</p>:items.map(item=><div key={item.id} style={{padding:"12px 0",borderTop:"1px solid #eee6e8"}}>
 <strong>{labels[item.status]||item.status}</strong>
 <p style={{margin:"6px 0"}}>Importe solicitado: {money(Number(item.requested_rent_ars)+Number(item.estimated_expenses_ars))} mensuales (alquiler + expensas).</p>
 {item.approved_max_total_ars!=null&&<p style={{margin:"6px 0"}}>Límite de caución precalificado: {money(Number(item.approved_max_total_ars))}</p>}
 {item.decision_expires_at&&<p style={{margin:"6px 0"}}>Vigencia: {new Date(item.decision_expires_at).toLocaleDateString("es-AR")}</p>}
 {quotes[item.id]&&<div style={{border:"1px solid #e7dde0",borderRadius:12,padding:14,marginTop:12}}>
  <strong>Oferta de caución: {quotes[item.id]!.status==="accepted"?"Aceptada":"Disponible"}</strong>
  <p>Prima: {money(Number(quotes[item.id]!.premium_ars))} · Cobertura: {money(Number(quotes[item.id]!.coverage_total_ars))}</p>
  {quotes[item.id]!.valid_until&&<p>Válida hasta: {new Date(quotes[item.id]!.valid_until!).toLocaleDateString("es-AR")}</p>}
  {quotes[item.id]!.status==="offered"&&<button type="button" disabled={busy} onClick={()=>void accept(item,quotes[item.id]!)} style={{background:"#050002",color:"#fff",border:0,borderRadius:999,padding:"11px 17px",fontWeight:700}}>Aceptar cotización</button>}
  {quotes[item.id]!.status==="accepted"&&<p>Oferta aceptada. Pago y emisión de póliza pendientes.</p>}
 </div>}
 </div>)}</section>
}
