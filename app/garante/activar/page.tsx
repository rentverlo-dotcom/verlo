"use client"
import { FormEvent, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import VerloBrand from "@/components/VerloBrand"

export default function GuarantorActivationPage() {
 const [invitation,setInvitation]=useState("")
 const [email,setEmail]=useState("")
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState("")
 const [success,setSuccess]=useState(false)
 useEffect(()=>{
   setInvitation(new URLSearchParams(window.location.search).get("invite")||"")
 },[])
 async function activate(event:FormEvent){
   event.preventDefault()
   setBusy(true);setError("");setSuccess(false)
   try{
     const address=email.trim().toLowerCase()
     const validated=await fetch("/api/guarantors/activation",{
       method:"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({invitation,email:address}),cache:"no-store",
     })
     const result=await validated.json().catch(()=>({}))
     if(!validated.ok||!result.ok)throw new Error("Invitación inválida, vencida o email incorrecto")
     const {error:authError}=await supabase.auth.signInWithOtp({
       email:address,
       options:{
         // Only this verified guarantor invitation flow permits first-time signup.
         shouldCreateUser:true,
         emailRedirectTo:window.location.origin+"/login?next=%2Fmi-verlo",
       },
     })
     if(authError)throw new Error("No pudimos enviar el enlace de acceso; verificá el servicio de correo")
     setSuccess(true)
   }catch(e){setError(e instanceof Error?e.message:"No se pudo completar")}
   finally{setBusy(false)}
 }
 return <main style={{minHeight:"100vh",background:"#f2ebec",padding:"100px 20px",fontFamily:"Arial,sans-serif",color:"#050002"}}>
   <section style={{maxWidth:560,margin:"auto",background:"white",borderRadius:28,padding:30}}>
     <VerloBrand width={100}/>
     <h1>Activá tu acceso como garante</h1>
     <p>Recibiste una invitación para participar como garante de un alquiler. Para proteger tus datos, ingresá el mismo email al que llegó la invitación.</p>
     <form onSubmit={e=>void activate(e)} style={{display:"grid",gap:14}}>
       <label>Email de la invitación
         <input type="email" value={email} required onChange={e=>setEmail(e.target.value)}
           style={{display:"block",width:"100%",padding:12,marginTop:8}}/>
       </label>
       <button disabled={busy||!invitation} type="submit" style={{padding:14,borderRadius:22,background:"#050002",color:"white"}}>
         {busy?"Verificando…":"Recibir mi enlace de acceso"}
       </button>
       {error&&<p role="alert">{error}</p>}
       {success&&<p role="status">Solicitamos tu enlace de acceso. Revisá tu correo; después ingresá a Mi VERLO para aceptar la invitación y presentar la documentación.</p>}
       {!invitation&&<p role="alert">Este enlace de invitación está incompleto.</p>}
     </form>
     <p style={{fontSize:13,color:"#666",marginTop:20}}>La invitación no te convierte automáticamente en garante: primero revisás la operación y después firmás el contrato si aceptás sus obligaciones.</p>
   </section>
 </main>
}
