"use client"
import {useEffect,useState} from "react"
import {supabase} from "@/lib/supabase/client"
type Operation={contract_id:string;review_status:string;caucion_status?:string}
const labels:Record<string,string>={pending:"Contrato en revisión",changes_requested:"Contrato con observaciones",approved:"Contrato aprobado",superseded:"Revisión anterior"}
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
   <strong>{labels[x.review_status]||"Estado de revisión: "+x.review_status}</strong>
   <p style={{margin:"6px 0"}}>Estado de caución: {x.caucion_status||"En curso"}</p>
   <p style={{fontSize:13}}>El detalle y las acciones de tu contrato se mantienen en Mi VERLO.</p>
  </div>)}
 </section>
}
