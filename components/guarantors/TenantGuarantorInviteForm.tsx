"use client"
import { FormEvent, useCallback, useEffect, useState } from "react"

type Status={id:string;fullName:string;email:string;status:string;reviewStatus:string;approved:boolean}
export default function TenantGuarantorInviteForm({token}:{token:string}){
 const [existing,setExisting]=useState<Status|null>(null)
 const [loaded,setLoaded]=useState(false)
 const [fullName,setFullName]=useState("")
 const [dni,setDni]=useState("")
 const [email,setEmail]=useState("")
 const [phone,setPhone]=useState("")
 const [legalAddress,setLegalAddress]=useState("")
 const [guaranteeKind,setGuaranteeKind]=useState("property")
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState("")
 const [error,setError]=useState("")
 const load=useCallback(async()=>{
  try{
   const res=await fetch("/api/closing-guarantor-invite?token="+encodeURIComponent(token),{cache:"no-store"})
   const data=await res.json().catch(()=>({}))
   if(res.ok&&data.ok){setExisting(data.guarantor||null);setLoaded(true)}
  }catch{}
 },[token])
 useEffect(()=>{void load()},[load])
 async function submit(event:FormEvent){
   event.preventDefault();setBusy(true);setError("");setMessage("")
   try{
     const res=await fetch("/api/closing-guarantor-invite",{
       method:"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({token,fullName,dni,email,phone,legalAddress,guaranteeKind}),
     })
     const result=await res.json().catch(()=>({}))
     if(!res.ok||!result.ok)throw new Error(result.error||"No se pudo registrar al garante")
     setMessage(result.invitationEmail==="queued"
       ? "El garante quedó registrado. La invitación ingresó a la cola de correo; el envío y la recepción todavía no están confirmados."
       : "El garante quedó registrado, pero el correo no pudo ponerse en cola. El acceso debe habilitarse cuando el servicio de email esté disponible.")
     await load()
   }catch(e){setError(e instanceof Error?e.message:"No pudimos registrar los datos")}
   finally{setBusy(false)}
 }
 if(!token)return null
 return <article className="verlo-card no-print review-card">
   <span className="card-kicker">GARANTÍA PERSONAL</span>
   <h2>Presentar un garante</h2>
   <p>Si vas a presentar una garantía propietaria, recibos de sueldo o una fianza personal, completá acá los datos de la persona. VERLO prepara su invitación por email. No hace falta que primero entre a Mi VERLO.</p>
   {existing?<div style={{border:"1px solid #e7dddd",borderRadius:14,padding:16}}>
     <p><strong>{existing.fullName}</strong> · {existing.email}</p>
     <p>Participación: {existing.status==="accepted"?"Aceptada":"Invitación pendiente"}</p>
     <p>Documentación: {existing.reviewStatus==="approved"&&existing.approved?"Garantía aprobada por el propietario":existing.reviewStatus||"Pendiente"}</p>
     <p>Podés consultar el avance desde Mi VERLO. Las firmas no se habilitan hasta que el propietario apruebe la garantía.</p>
   </div>:loaded&&<form onSubmit={e=>void submit(e)} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12,marginTop:16}}>
     <label>Nombre y apellido<input value={fullName} required minLength={3} onChange={e=>setFullName(e.target.value)}/></label>
     <label>DNI<input value={dni} required inputMode="numeric" pattern="[0-9.]{6,12}" onChange={e=>setDni(e.target.value)}/></label>
     <label>Email del garante<input value={email} type="email" required onChange={e=>setEmail(e.target.value)}/></label>
     <label>Celular<input value={phone} required onChange={e=>setPhone(e.target.value)}/></label>
     <label>Domicilio<input value={legalAddress} onChange={e=>setLegalAddress(e.target.value)}/></label>
     <label>Tipo de garantía<select value={guaranteeKind} onChange={e=>setGuaranteeKind(e.target.value)}>
       <option value="property">Garantía propietaria</option>
       <option value="salary">Ingresos / recibos de sueldo</option>
       <option value="personal">Fianza personal</option>
     </select></label>
     <button type="submit" disabled={busy}>{busy?"Registrando…":"Confirmar datos e invitar al garante"}</button>
   </form>}
   {error&&<p role="alert">{error}</p>}
   {message&&<p role="status">{message}</p>}
   <p style={{fontSize:13,color:"#777"}}>La invitación por correo se envía automáticamente cuando el servicio de correo esté habilitado. Hasta entonces no se informa falsamente como entregada.</p>
 </article>
}
