"use client"
import {useState} from "react"
import {supabase} from "@/lib/supabase/client"
import {trackPostHog} from "@/lib/posthog-client"
function decode(base64:string) {
  const normalized = (base64+"=".repeat((4-base64.length%4)%4)).replace(/-/g,"+").replace(/_/g,"/")
  return Uint8Array.from(atob(normalized),ch=>ch.charCodeAt(0))
}
export default function TemporariosPushButton() {
  const [status,setStatus]=useState<"idle"|"loading"|"ok"|"error">("idle")
  async function activate() {
    setStatus("loading")
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) throw new Error("No disponible")
      const {data:{session}}=await supabase.auth.getSession()
      if (!session) throw new Error("Ingresá a VERLO")
      const permission=await Notification.requestPermission()
      if(permission!=="granted")throw new Error("Sin permiso")
      const registration=await navigator.serviceWorker.ready
      const key=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if(!key)throw new Error("Sin configuración")
      const subscription=await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(key)})
      const response=await fetch("/api/temporarios/push/subscribe",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({subscription:subscription.toJSON()})})
      if(!response.ok)throw new Error("No se guardó la suscripción")
      trackPostHog("temporary_push_activation_succeeded",{product:"temporary"})
      setStatus("ok")
    }catch{
      trackPostHog("temporary_push_activation_failed",{product:"temporary"})
      setStatus("error")
    }
  }
  return <button type="button" disabled={status==="loading"||status==="ok"} onClick={()=>void activate()} style={{padding:"12px 18px",borderRadius:10,background:"#242026",color:"white",border:0,cursor:"pointer"}}>
    {status==="ok"?"Notificaciones activadas":status==="loading"?"Activando...":status==="error"?"Reintentar notificaciones":"Activar notificaciones push"}
  </button>
}
