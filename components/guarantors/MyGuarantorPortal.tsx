"use client"
import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import MySignaturaContractSigning from "@/components/signatura/MySignaturaContractSigning"
import GuarantorPushSubscribe from "@/components/guarantors/GuarantorPushSubscribe"

type Guarantee={id:string;contractId:string;fullName:string;guaranteeKind:string;status:string;acceptedAt:string|null;signedAt:string|null}
async function token(){
  const {data}=await supabase.auth.getSession()
  return data.session?.access_token||""
}
export default function MyGuarantorPortal({onLogout,embedded=false,hideWhenEmpty=false}:{onLogout:()=>Promise<void>;embedded?:boolean;hideWhenEmpty?:boolean}) {
  const [items,setItems]=useState<Guarantee[]>([])
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")
  const load=useCallback(async()=>{
    setBusy(true)
    try{
      const access=await token()
      if(!access)throw new Error("Iniciá sesión para ver tus garantías")
      const response=await fetch("/api/guarantors/mine",{headers:{Authorization:`Bearer ${access}`},cache:"no-store"})
      const result=await response.json()
      if(!response.ok)throw new Error(result.error||"No se pudo cargar tu cuenta")
      setItems(result.guarantees||[])
      setError("")
    }catch(e){setError(e instanceof Error?e.message:"Error de conexión")}
    finally{setBusy(false)}
  },[])
  useEffect(()=>{void load()},[load])
  async function accept(id:string){
    setBusy(true)
    try{
      const access=await token()
      const response=await fetch("/api/guarantors/mine",{
        method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${access}`},
        body:JSON.stringify({guarantorId:id,acknowledged:true}),
      })
      const result=await response.json()
      if(!response.ok)throw new Error(result.error||"No se pudo aceptar")
      await load()
    }catch(e){setError(e instanceof Error?e.message:"No se pudo aceptar")}
    finally{setBusy(false)}
  }
  if(hideWhenEmpty&&items.length===0&&!error)return null
  return <section style={{maxWidth:820,margin:embedded?"12px auto":"90px auto 48px",padding:24,fontFamily:"Arial,sans-serif",color:"#050002"}}>
    <h1>Mi VERLO · Garante</h1>
    <p>Este es tu acceso privado como garante. Antes de firmar vas a poder revisar las obligaciones que asumís.</p>
    {error&&<p role="alert">{error}</p>}
    {items.length>0&&<GuarantorPushSubscribe />}
    {items.length===0?<p>No tenés invitaciones de garantía disponibles para esta cuenta.</p>:items.map(item=><section key={item.id}
      style={{border:"1px solid #ddd",borderRadius:16,padding:18,marginBottom:16,background:"white"}}>
      <h2>Garantía de contrato</h2>
      <p>Tipo: {item.guaranteeKind==="property"?"Garantía propietaria":item.guaranteeKind==="salary"?"Garantía con ingresos":"Fianza personal"}</p>
      <p>Estado: {item.signedAt?"Firma registrada":item.status==="accepted"?"Participación aceptada; falta firma contractual":item.status==="invited"?"Invitación pendiente de aceptación":"Invitación rechazada"}</p>
      {item.status==="invited"&&<>
        <p>Al aceptar confirmás tu voluntad de participar como garante. Esto <strong>no firma el contrato ni crea una obligación de fianza por sí solo</strong>. La revisión completa y la firma se habilitarán con la versión contractual definitiva.</p>
        <button disabled={busy} onClick={()=>void accept(item.id)} style={{padding:"12px 18px",borderRadius:20,color:"white",background:"#050002",cursor:"pointer"}}>Acepto participar como garante</button>
      </>}
      {item.status==="accepted"&&!item.signedAt&&<p>Tu firma todavía no está habilitada. VERLO te notificará cuando el documento definitivo esté disponible.</p>}
    </section>)}
    <MySignaturaContractSigning canPrepare={false} contracts={items.filter(item=>item.status==="accepted").map(item=>({id:item.contractId}))} />
    <button type="button" onClick={()=>void load()} disabled={busy}>Actualizar estado</button>{" "}
    {!embedded&&<button type="button" onClick={()=>void onLogout()}>Salir</button>}
  </section>
}
