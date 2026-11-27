"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

function applicationKey(value:string) {
  const padding="=".repeat((4-value.length%4)%4)
  const raw=atob((value+padding).replace(/-/g,"+").replace(/_/g,"/"))
  return Uint8Array.from(raw,c=>c.charCodeAt(0))
}
async function authorization(){
  const {data}=await supabase.auth.getSession()
  if(!data.session)throw new Error("Iniciá sesión")
  return data.session.access_token
}
export default function GuarantorPushSubscribe(){
  const [status,setStatus]=useState<"idle"|"busy"|"active"|"unsupported"|"error">("idle")
  const [message,setMessage]=useState("")
  useEffect(()=>{
    if(typeof window==="undefined"||!("PushManager" in window)||
       !("Notification" in window)||!("serviceWorker" in navigator))setStatus("unsupported")
  },[])
  async function activate(){
    setStatus("busy");setMessage("")
    try{
      const key=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if(!key)throw new Error("Notificaciones no configuradas")
      if(await Notification.requestPermission()!=="granted")
        throw new Error("No se autorizó el permiso de notificación")
      const registration=await navigator.serviceWorker.ready
      const existing=await registration.pushManager.getSubscription()
      const subscription=existing||await registration.pushManager.subscribe({
        userVisibleOnly:true,applicationServerKey:applicationKey(key),
      })
      const access=await authorization()
      const response=await fetch("/api/guarantors/push",{method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${access}`},
        body:JSON.stringify({acknowledged:true,subscription:subscription.toJSON()}),
      })
      const body=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(body.error||"No se pudo registrar el dispositivo")
      setStatus("active")
    }catch(e){
      setStatus("error")
      setMessage(e instanceof Error?e.message:"Error de notificaciones")
    }
  }
  return <div style={{margin:"14px 0"}}>
    <button type="button" disabled={status==="busy"||status==="active"||status==="unsupported"}
      onClick={()=>void activate()} style={{padding:"10px 16px",borderRadius:22}}>
      {status==="active"?"Notificaciones activadas":status==="busy"?"Activando…":
        status==="unsupported"?"Web Push no disponible":"Activar notificaciones"}
    </button>
    {message&&<p role="alert">{message}</p>}
  </div>
}
