"use client"
import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import VerloBrand from "@/components/VerloBrand"
import { shell, container, nav, navInner, panel, field, fieldLabel, button, heading, script } from "../brand"

function destination(): string {
  const params = new URLSearchParams(window.location.search)
  const next = params.get("next")
  return next === "/temporarios/publicar" || next === "/temporarios/buscar"
    ? next : "/temporarios/qa"
}

export default function TemporaryAccess() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session))
    }).catch(() => {})
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(Boolean(session))
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setMessage("")
    const next = destination()
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin + "/temporarios/acceso?next=" + encodeURIComponent(next),
        },
      })
      setMessage(error ? "No se pudo enviar el enlace. Probá nuevamente en unos minutos." :
        "Te enviamos un enlace de acceso por email. Abrilo para regresar a VERLO Temporarios.")
    } catch {
      setMessage("No se pudo contactar al servicio de acceso.")
    } finally { setLoading(false) }
  }

  return <main style={shell}>
    <header style={nav}><div style={navInner}><VerloBrand width={112}/><Link href="/temporarios">Volver a temporarios</Link></div></header>
    <div style={{...container,maxWidth:760,paddingTop:60,paddingBottom:90}}>
      <section style={panel}>
        <h1 style={{...heading,fontSize:"clamp(42px,7vw,68px)"}}>Entrá a <em style={script}>Temporarios.</em></h1>
        {signedIn ? <>
          <p>Tu sesión ya está iniciada. Podés continuar con tu publicación o búsqueda.</p>
          <button style={button} type="button" onClick={() => router.push(destination())}>Continuar en Temporarios</button>
        </> : <>
          <p>Usamos la misma cuenta de VERLO. Si todavía no tenés una, el enlace permitirá crearla con tu email.</p>
          <form onSubmit={sendLink} style={{display:"grid",gap:18,marginTop:22}}>
            <label style={fieldLabel}>Email
              <input type="email" required autoComplete="email" style={field} value={email}
                onChange={event => setEmail(event.target.value)} placeholder="tu@email.com" />
            </label>
            <button type="submit" disabled={loading} style={{...button,opacity:loading?.6:1}}>
              {loading ? "Enviando..." : "Recibir Magic Link"}
            </button>
          </form>
          {message && <p role="status">{message}</p>}
        </>}
        <p style={{fontSize:13,marginTop:24}}>El acceso no guarda publicaciones ni búsquedas. Solo verifica tu identidad para continuar.</p>
      </section>
    </div>
  </main>
}
