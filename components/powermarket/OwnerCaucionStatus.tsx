"use client"
import {useEffect,useState} from "react"
import {supabase} from "@/lib/supabase/client"
type Operation={contract_id:string;review_status:string;caucion_status?:string}
const labels:Record<string,string>={pending:"VERLO está revisando el contrato",changes_requested:"Necesitamos corregir el contrato",approved:"Contrato revisado y aprobado",superseded:"Versión anterior del contrato"}
const decision=(status:string|undefined)=>{
 if(status==="prequalified"||status==="alternative_offered")return {heading:"Solicitud aprobada",next:"La caución avanzó. VERLO te notificará los próximos pasos de la operación."}
 if(status==="not_eligible"||status==="expired"||status==="withdrawn")return {heading:"Solicitud no aprobada",next:"Esta solicitud no se encuentra aprobada. Consultá Mi VERLO para conocer otras opciones."}
 if(status==="more_info_required")return {heading:"Información pendiente",next:"VERLO necesita documentación adicional para completar la evaluación."}
 return {heading:"Respuesta pendiente",next:"VERLO está analizando la solicitud con la compañía aseguradora. La respuesta suele llegar en unas 3 horas; te notificaremos cuando esté disponible."}
}
export default function OwnerCaucionStatus(){
 const [items,setItems]=useState<Operation[]>([])
 const [error,setError]=useState("")
 useEffect(()=>{let active=true;(async()=>{
  const {data}=await supabase.auth.getSession()
  if(!data.session)return
  try{
   const res=await fetch("/api/powermarket/owner-status",{headers:{Authorization:`Bearer ${data.session.access_token}`},cache:"no-store"})
   const body=await res.json()
   if(!active)return
   if(!res.ok){setError("No pudimos consultar las cauciones asociadas a tus contratos.");return}
   setItems(body.operations||[])
  }catch{if(active)setError("No pudimos consultar las cauciones asociadas a tus contratos.")}
 })();return()=>{active=false}},[])
 if(!items.length&&!error)return null
 return <section style={{background:"#fff",border:"1px solid rgba(5,0,2,.1)",borderRadius:22,padding:22,margin:"20px 0",color:"#050002"}}>
  <h2 style={{fontSize:24,margin:"0 0 12px"}}>Cauciones de mis operaciones</h2>
  {error?<p>{error}</p>:items.map((x,i)=><div key={x.contract_id+":"+i} style={{padding:"12px 0",borderTop:"1px solid #eee6e8"}}>
   <strong>{decision(x.caucion_status).heading}</strong>
   <p style={{margin:"7px 0",fontSize:13}}>{decision(x.caucion_status).next}</p>
   {x.review_status==="changes_requested"&&<p style={{fontWeight:700}}>El contrato tiene observaciones. VERLO te avisará qué corresponde corregir antes de continuar.</p>}
   {x.review_status==="pending"&&<p style={{fontSize:13}}>{labels[x.review_status]} para esta operación.</p>}
   {x.review_status==="approved"&&<p style={{fontSize:13}}>{labels[x.review_status]}. La revisión contractual no equivale a emisión de póliza.</p>}
  </div>)}
 </section>
}
