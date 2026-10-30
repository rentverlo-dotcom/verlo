"use client"
import {useEffect,useState} from "react"
import {supabase} from "@/lib/supabase/client"
import VerloBrand from "@/components/VerloBrand"
export default function ResetPassword(){
 const [ready,setReady]=useState(false),[password,setPassword]=useState(""),[message,setMessage]=useState(""),[saving,setSaving]=useState(false)
 useEffect(()=>{
  let active=true
  const init=async()=>{
   const hash=new URLSearchParams(window.location.hash.slice(1))
   const access=hash.get("access_token"),refresh=hash.get("refresh_token")
   if(access&&refresh){const {error}=await supabase.auth.setSession({access_token:access,refresh_token:refresh});if(error&&active)setMessage("El enlace venció. Solicitá otro desde Supabase.")}
   const {data}=await supabase.auth.getSession()
   if(active){setReady(!!data.session);window.history.replaceState(null,"","/reset-password")}
  }
  void init();return()=>{active=false}
 },[])
 async function save(e:React.FormEvent){e.preventDefault();if(password.length<10){setMessage("Usá al menos 10 caracteres");return}setSaving(true);const {error}=await supabase.auth.updateUser({password});if(error){setMessage(error.message)}else{setMessage("Contraseña creada. Ya podés entrar al dashboard PowerMarket.");setPassword("")}setSaving(false)}
 return <main style={{minHeight:"100vh",background:"#f2ebec",color:"#050002",padding:"60px 20px",fontFamily:"system-ui,sans-serif"}}><div style={{maxWidth:430,margin:"0 auto",background:"#fff",padding:30,borderRadius:22}}><VerloBrand width={45}/><h1 style={{fontSize:28,margin:"24px 0"}}>Crear contraseña</h1>{ready?<form onSubmit={save}><label>Nueva contraseña<input type="password" autoComplete="new-password" required minLength={10} value={password} onChange={e=>setPassword(e.target.value)} style={{display:"block",width:"100%",padding:12,margin:"10px 0 18px"}}/></label><button disabled={saving} style={{padding:"12px 18px",background:"#050002",color:"#fff",border:0,borderRadius:12}}>Guardar contraseña</button></form>:<p>Necesitás abrir el enlace de recuperación recibido por correo.</p>}{message&&<p role="status">{message}</p>}</div></main>
}
