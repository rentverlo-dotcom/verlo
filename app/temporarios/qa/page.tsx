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
  const [matchPreview, setMatchPreview] = useState("")
  const [checkingMatches, setCheckingMatches] = useState(false)
  const [candidate, setCandidate] = useState<{propertyId:string;demandId:string}|null>(null)
  const [committing, setCommitting] = useState(false)
  const [commitMessage, setCommitMessage] = useState("")
  async function commitMatch() {
    if (!candidate || committing) return
    setCommitting(true)
    setCommitMessage("")
    try {
      const {data:{session}}=await supabase.auth.getSession()
      if(!session?.access_token) throw new Error("Sesión no disponible")
      const response=await fetch("/api/temporarios/matches/commit",{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},
        body:JSON.stringify(candidate),
      })
      const data:{ok?:boolean;id?:string;error?:string;reused?:boolean}=await response.json()
      if(!response.ok||!data.ok||!data.id)throw new Error(data.error||"No se pudo guardar la coincidencia")
      setCommitMessage(data.reused?"Coincidencia ya registrada: "+data.id:"Coincidencia registrada: "+data.id)
    } catch(error){setCommitMessage(error instanceof Error?error.message:"Error de conexión")}
    finally{setCommitting(false)}
  }
  async function checkMatches() {
    setCheckingMatches(true)
    setMatchPreview("")
    setCandidate(null)
    setCommitMessage("")
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error("Sesión no disponible")
      const response = await fetch("/api/temporarios/matches/preview", {headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"})
      const body: {ok?:boolean;error?:string;candidateCount?:number;propertyCount?:number;demandCount?:number;truncated?:boolean;candidates?:Array<{propertyId:string;demandId:string}>} = await response.json()
      if (!response.ok || !body.ok) throw new Error(body.error || "No pudimos consultar las coincidencias")
      if(body.candidateCount===1 && !body.truncated && body.candidates?.length===1) setCandidate(body.candidates[0])
      setMatchPreview("Propiedades publicadas: "+body.propertyCount+" · Búsquedas activas: "+body.demandCount+" · Coincidencias compatibles: "+body.candidateCount+(body.truncated?" · Resultado parcial":""))
    } catch (error) { setMatchPreview(error instanceof Error ? error.message : "Error de conexión") }
    finally { setCheckingMatches(false) }
  }
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
            <button type="button" disabled={checkingMatches} style={{...button,marginTop:12}} onClick={() => void checkMatches()}>{checkingMatches ? "Comprobando..." : "Verificar matching sin guardar"}</button>
            {matchPreview && <p role="status">{matchPreview}</p>}
            {candidate && <button type="button" disabled={committing} style={{...button,marginTop:12}} onClick={() => void commitMatch()}>{committing?"Guardando...":"Registrar única coincidencia QA"}</button>}
            {commitMessage && <p role="status">{commitMessage}</p>}
          </> : <>
            <p role="status">{error || "No hay una sesión activa."}</p>
            <Link href="/login" style={{...button,display:"block",textAlign:"center"}}>Iniciar sesión en VERLO</Link>
          </>}
        <p style={{fontSize:13,marginTop:20}}>Nunca compartas contraseñas, enlaces mágicos ni tokens de acceso. El ID de usuario no es una credencial secreta.</p>
      </section>
    </div>
  </main>
}
