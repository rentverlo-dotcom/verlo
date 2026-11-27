"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type Contract={id:string;status:string;tenant_agreed_at:string|null;owner_agreed_at:string|null}
type Guarantor={id:string;full_name:string;email:string;status:string}
async function authToken(){const {data}=await supabase.auth.getSession();return data.session?.access_token||""}
export default function MyGuarantorInvite({contracts}:{contracts:Contract[]}) {
  const [selected,setSelected]=useState("")
  const [rows,setRows]=useState<Guarantor[]>([])
  const [fullName,setFullName]=useState("")
  const [dni,setDni]=useState("")
  const [email,setEmail]=useState("")
  const [phone,setPhone]=useState("")
  const [legalAddress,setLegalAddress]=useState("")
  const [guaranteeKind,setGuaranteeKind]=useState("personal")
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState("")
  const eligible=contracts.filter(c=>["draft","generated"].includes(c.status)&&!c.tenant_agreed_at&&!c.owner_agreed_at)
  useEffect(()=>{if(!eligible.some(c=>c.id===selected))setSelected(eligible[0]?.id||"")},[contracts,selected])
  useEffect(()=>{
    if(!selected){setRows([]);return}
    let alive=true
    void (async()=>{try{
      const t=await authToken()
      const res=await fetch("/api/guarantors?contractId="+encodeURIComponent(selected),{headers:{Authorization:`Bearer ${t}`},cache:"no-store"})
      const body=await res.json()
      if(alive&&res.ok)setRows(body.guarantors||[])
    }catch{ if(alive)setRows([]) }})()
    return()=>{alive=false}
  },[selected])
  async function invite(event:React.FormEvent){
    event.preventDefault();setBusy(true);setMessage("")
    try{
      const t=await authToken()
      const response=await fetch("/api/guarantors",{method:"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},
        body:JSON.stringify({contractId:selected,fullName,dni,email,phone,legalAddress,guaranteeKind})})
      const result=await response.json()
      if(!response.ok)throw new Error(result.error||"No se pudo registrar al garante")
      setRows(r=>[...r,{id:result.guarantorId,full_name:fullName,email,status:"invited"}])
      setMessage("Garante registrado en QA. El envío real de invitaciones sigue deshabilitado.")
    }catch(e){setMessage(e instanceof Error?e.message:"Error de registro")}
    finally{setBusy(false)}
  }
  if(!eligible.length)return null
  return <section style={{padding:20,margin:"24px 0",borderRadius:18,background:"#fff",color:"#050002",border:"1px solid #e8dfe1"}}>
    <h2>Invitar a un garante</h2>
    <p>Si acordaron una garantía personal, cargá a la persona que asumirá la fianza. Tiene que aceptar por su propia cuenta y firmar el contrato definitivo.</p>
    <label>Contrato <select value={selected} onChange={e=>setSelected(e.target.value)}>
      {eligible.map((c,i)=><option key={c.id} value={c.id}>Contrato {i+1}</option>)}
    </select></label>
    {rows.length>0?<p>Garante registrado: {rows[0].full_name} — {rows[0].status==="accepted"?"participación aceptada":"invitación pendiente"}. No se permiten cambios después de la aceptación sin revisión.</p>:
    <form onSubmit={e=>void invite(e)} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,marginTop:14}}>
      <label>Nombre y apellido<input required minLength={3} value={fullName} onChange={e=>setFullName(e.target.value)} /></label>
      <label>DNI<input required pattern="[0-9]{6,10}" value={dni} onChange={e=>setDni(e.target.value)} /></label>
      <label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Celular<input required value={phone} onChange={e=>setPhone(e.target.value)} /></label>
      <label>Domicilio legal<input value={legalAddress} onChange={e=>setLegalAddress(e.target.value)} /></label>
      <label>Garantía<select value={guaranteeKind} onChange={e=>setGuaranteeKind(e.target.value)}>
        <option value="personal">Fianza personal</option><option value="property">Garantía propietaria</option>
        <option value="salary">Garantía con ingresos</option>
      </select></label>
      <button type="submit" disabled={busy||!selected} style={{padding:14,borderRadius:22,background:"#050002",color:"white",cursor:"pointer"}}>{busy?"Registrando…":"Registrar garante"}</button>
    </form>}
    {message&&<p role="status">{message}</p>}
    <p style={{fontSize:12,color:"#777"}}>Disponible solo para cuentas y correos sintéticos de QA hasta que se certifique ZeptoMail y la firma contractual con Signatura.</p>
  </section>
}
