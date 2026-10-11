"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import VerloBrand from "@/components/VerloBrand"
import { shell, container, panel, nav, navInner, button } from "../brand"

type Identity = { id: string; email: string; verified: boolean } | null

export default function TemporaryQaIdentity() {
  const [identity, setIdentity] = useState<Identity>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(async ({ data: sessionData, error: sessionError }) => {
      if (!active) return
      if (sessionError) {
        setError("No se pudo leer la sesión local. Volvé a ingresar a VERLO.")
        setLoading(false)
        return
      }
      if (!sessionData.session) {
        setError("No hay una sesión iniciada en este Preview.")
        setLoading(false)
        return
      }
      const { data, error: authError } = await supabase.auth.getUser()
      if (!active) return
      if (authError || !data.user) {
        setError("Hay una sesión local, pero Supabase no pudo validarla. Ingresá nuevamente a VERLO.")
      } else {
        const user = data.user
        setIdentity({ id: user.id, email: user.email || "", verified: Boolean(user.email_confirmed_at) })
      }
      setLoading(false)
    }).catch(() => { if (active) { setError("Error de conexión con Supabase."); setLoading(false) } })
    return () => { active = false }
  }, [])
  return <main style={shell}>
    <header style={nav}><div style={navInner}><VerloBrand width={112} /><Link href="/temporarios">Volver a temporarios</Link></div></header>
    <div style={{...container,maxWidth:800,paddingTop:60}}>
      <section style={panel}>
        <h1 style={{fontSize:"clamp(30px,5vw,48px)",fontWeight:950,letterSpacing:"-.05em"}}>Acceso de prueba · Temporarios</h1>
        <p>Esta pantalla solo consulta tu sesión. No escribe datos ni habilita publicaciones.</p>
        {loading ? <p role="status">Comprobando sesión...</p> :
          identity ? <>
            <p><strong>Sesión:</strong> {identity.email}</p>
            <p><strong>Email verificado:</strong> {identity.verified ? "Sí" : "No"}</p>
            <p><strong>ID de usuario QA:</strong></p>
            <code style={{wordBreak:"break-all",display:"block",padding:15,background:"#fff",borderRadius:12}}>{identity.id}</code>
            <button type="button" style={{...button,marginTop:15}} onClick={() => void navigator.clipboard.writeText(identity.id)}>Copiar ID de usuario</button>
          </> : <>
            <p role="status">{error || "No hay una sesión activa."}</p>
            <Link href="/login" style={{...button,display:"block",textAlign:"center"}}>Iniciar sesión en VERLO</Link>
          </>}
        <p style={{fontSize:13,marginTop:20}}>Nunca compartas contraseñas, enlaces mágicos ni tokens de acceso. El ID de usuario no es una credencial secreta.</p>
      </section>
    </div>
  </main>
}
