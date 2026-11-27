"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import GuarantorDossier from "@/components/guarantors/GuarantorDossier"

type Guarantee={id:string;contractId:string;fullName:string;guaranteeKind:string;status:string;reviewStatus:string}
export default function OwnerGuarantorReview() {
 const [items,setItems]=useState<Guarantee[]>([])
 const [error,setError]=useState("")
 useEffect(()=>{
  let active=true
  void (async()=>{try{
   const {data}=await supabase.auth.getSession()
   if(!data.session)return
   const res=await fetch("/api/guarantors/owner",{headers:{
     Authorization:`Bearer ${data.session.access_token}`
   },cache:"no-store"})
   const result=await res.json().catch(()=>({}))
   if(!res.ok)throw new Error(result.error||"No se pudo consultar las garantías")
   if(active)setItems(result.guarantees||[])
  }catch(e){if(active)setError(e instanceof Error?e.message:"Sin acceso a garantías")}})()
  return()=>{active=false}
 },[])
 if(!items.length)return null
 return <section style={{margin:"20px 0",padding:20,borderRadius:18,border:"1px solid #ddd",background:"white",color:"#050002"}}>
  <h2>Garantías presentadas por tus inquilinos</h2>
  <p>Los documentos se consultan desde este expediente privado. Los certificados oficiales se solicitan fuera de VERLO.</p>
  {items.map(g=><GuarantorDossier key={g.id} guarantorId={g.id}/>)}
  {error&&<p role="alert">{error}</p>}
 </section>
}
