"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type Status={id:string;status:string;role?:string;reason?:string|null;signingUrl?:string}
type Contract={id:string}
async function requestContract(id:string,method:"GET"|"POST"="GET"){
  const {data}=await supabase.auth.getSession()
  if(!data.session)throw new Error("Iniciá sesión en Mi VERLO")
  const result=await fetch(method==="GET"?"/api/signatura/contract-signing?contractId="+encodeURIComponent(id):"/api/signatura/contract-signing",{
    method,headers:{Authorization:`Bearer ${data.session.access_token}`,...(method==="POST"?{"Content-Type":"application/json"}:{})},
    ...(method==="POST"?{body:JSON.stringify({contractId:id,acknowledged:true})}:{}),
    cache:"no-store",
  })
  const body=await result.json().catch(()=>({}))
  if(!result.ok)throw new Error(body.error||"No se pudo consultar la firma")
  return body
}
export default function MySignaturaContractSigning({contracts,canPrepare=true}:{
  contracts:Contract[],canPrepare?:boolean
}){
  const [items,setItems]=useState<Status[]>([])
  const [busy,setBusy]=useState("")
  const [error,setError]=useState("")
  const ids=Array.from(new Set(contracts.map(c=>c.id))).slice(0,30)
  useEffect(()=>{
    let live=true
    if(!ids.length)return
    void Promise.all(ids.map(async id=>{
      try{return {id,...(await requestContract(id))} as Status}
      catch{return {id,status:"unavailable"} as Status}
    })).then(results=>{if(live)setItems(results.filter(r=>r.status!=="unavailable"&&r.status!=="blocked"))})
    return ()=>{live=false}
  },[ids.join(",")])
  async function prepare(id:string){
    setBusy(id);setError("")
    try{
      await requestContract(id,"POST")
      const next=await requestContract(id)
      setItems(old=>old.map(item=>item.id===id?{id,...next}:item))
    }catch(e){setError(e instanceof Error?e.message:"No se pudo preparar la firma")}
    finally{setBusy("")}
  }
  async function reconcile(id:string){
    setBusy(id);setError("")
    try{
      const {data}=await supabase.auth.getSession()
      if(!data.session)throw new Error("Iniciá sesión en Mi VERLO")
      const response=await fetch("/api/signatura/contract-reconcile",{
        method:"POST",cache:"no-store",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${data.session.access_token}`},
        body:JSON.stringify({contractId:id}),
      })
      const body=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(body.error||"No se pudo comprobar la firma")
      const next=await requestContract(id)
      setItems(old=>old.map(item=>item.id===id?{id,...next}:item))
      if(body.status==="pending")setError("Todavía faltan firmas, validaciones o confirmaciones del proveedor.")
    }catch(e){setError(e instanceof Error?e.message:"No se pudo actualizar")}
    finally{setBusy("")}
  }
  async function download(id:string){
    const popup=window.open("","_blank")
    try{
      const {data}=await supabase.auth.getSession()
      if(!data.session)throw new Error("Iniciá sesión")
      const response=await fetch("/api/signatura/contract-signed?contractId="+encodeURIComponent(id),{
        headers:{Authorization:`Bearer ${data.session.access_token}`},cache:"no-store",
      })
      const body=await response.json().catch(()=>({}))
      if(!response.ok||!body.url)throw new Error(body.error||"El contrato no está disponible")
      if(popup)popup.location.href=body.url
      else setError("Permití ventanas emergentes para descargar el PDF firmado")
    }catch(e){
      popup?.close()
      setError(e instanceof Error?e.message:"No se pudo descargar")
    }
  }
  if(!items.length)return null
  return <section style={{padding:20,border:"1px solid #e8dfe1",borderRadius:16,background:"white",margin:"18px 0",color:"#050002"}}>
    <h2>Firmas de contratos · Signatura</h2>
    <p>La validación de identidad y firma se realiza en una página segura externa. Al terminar, regresá a Mi VERLO.</p>
    {items.map(item=><div key={item.id} style={{margin:"12px 0",padding:"12px 0",borderTop:"1px solid #eee"}}>
      <p>Tu contrato: {item.status==="completed"?"firmado":item.status==="ready"?"listo para preparar":item.status==="pending"?"pendiente de firmas":"requiere revisión"}</p>
      {item.signingUrl&&<a href={item.signingUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
        style={{display:"inline-block",background:"#050002",color:"white",padding:"12px 18px",borderRadius:22,textDecoration:"none"}}>Validar identidad y firmar</a>}
      {item.status==="pending"&&<button type="button" onClick={()=>void reconcile(item.id)} disabled={busy===item.id}
        style={{padding:"11px 18px",borderRadius:22,marginLeft:8}}>Actualizar firmas</button>}
      {item.status==="completed"&&<button type="button" onClick={()=>void download(item.id)}
        style={{padding:"11px 18px",borderRadius:22}}>Descargar contrato firmado</button>}
      {canPrepare&&item.status==="ready"&&<button type="button" disabled={busy===item.id} onClick={()=>void prepare(item.id)}
        style={{background:"#050002",color:"white",padding:"12px 18px",borderRadius:22,cursor:"pointer"}}>
        {busy===item.id?"Preparando…":"Preparar firma"}
      </button>}
      {item.status==="manual_review_required"&&<p>Una operación quedó pendiente de conciliación; VERLO no volverá a cobrar ni crear el documento automáticamente.</p>}
    </div>)}
    {error&&<p role="alert" style={{color:"#892b40"}}>{error}</p>}
  </section>
}
