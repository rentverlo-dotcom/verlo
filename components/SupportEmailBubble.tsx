"use client"
import {useState, type FormEvent} from "react"
export default function SupportEmailBubble(){
 const [open,setOpen]=useState(false)
 const [name,setName]=useState("")
 const [email,setEmail]=useState("")
 const [message,setMessage]=useState("")
 const [busy,setBusy]=useState(false)
 const [notice,setNotice]=useState("")
 const [sent,setSent]=useState(false)
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return
  setBusy(true);setNotice("")
  try{
   const response=await fetch("/api/support/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,message})})
   const data=await response.json().catch(()=>({}))
   if(!response.ok||!data.ok)setNotice(data.error||"No se pudo enviar")
   else{setSent(true);setNotice("Consulta enviada a soporte@verlo.lat");setMessage("")}
  }catch{setNotice("No hay conexión. Intentá nuevamente.")}
  finally{setBusy(false)}
 }
 const field:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:10,border:"1px solid #c9c1c3",borderRadius:8,background:"#fff",color:"#050002"}
 return <>
  {open&&<section role="dialog" aria-label="Soporte VERLO" style={{position:"fixed",right:16,bottom:84,zIndex:1001,width:"min(360px,calc(100vw - 32px))",maxHeight:"calc(100dvh - 110px)",overflowY:"auto",boxSizing:"border-box",padding:20,background:"#fff",color:"#050002",borderRadius:16,boxShadow:"0 12px 45px #0004"}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><strong>Soporte VERLO</strong><button aria-label="Cerrar" onClick={()=>setOpen(false)} type="button" style={{border:0,background:"transparent",fontSize:24,cursor:"pointer"}}>×</button></div>
   {sent?<p role="status">{notice}</p>:<form onSubmit={submit} style={{display:"grid",gap:12}}>
    <p style={{fontSize:13,margin:0}}>Escribinos desde VERLO, sin abrir tu correo.</p>
    <label>Nombre<input required minLength={2} maxLength={100} style={field} value={name} onChange={e=>setName(e.target.value)}/></label>
    <label>Email<input required type="email" maxLength={254} style={field} value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Consulta<textarea required minLength={10} maxLength={2000} style={{...field,minHeight:100}} value={message} onChange={e=>setMessage(e.target.value)}/></label>
    {notice&&<p role="alert" style={{color:"#a01d38",fontSize:13}}>{notice}</p>}
    <button disabled={busy} type="submit" style={{background:"#050002",color:"white",padding:12,borderRadius:99,border:0,cursor:"pointer"}}>{busy?"Enviando...":"Enviar consulta"}</button>
   </form>}
  </section>}
  <button type="button" aria-expanded={open} onClick={()=>{setOpen(!open);setNotice("");if(!open)setSent(false)}} style={{position:"fixed",right:20,bottom:22,zIndex:1002,padding:"15px 19px",border:0,borderRadius:999,background:"#050002",color:"#fff",fontWeight:850,cursor:"pointer",boxShadow:"0 10px 30px #0003"}}>✉ ¿Necesitás ayuda?</button>
 </>
}
