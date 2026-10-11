"use client"
import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { readPendingTemporaryDraft, clearPendingTemporaryDraft } from "@/lib/temporarios/pending-draft"
import VerloBrand from "@/components/VerloBrand"
import { shell, container, nav, navInner, panel, field, fieldLabel, button, heading, script } from "../brand"

function destination(): string {
  const params = new URLSearchParams(window.location.search)
  const next = params.get("next")
  return next === "/temporarios/publicar" || next === "/temporarios/buscar" || next === "/temporarios/mi-verlo"
    ? next : "/temporarios/qa"
}

export default function TemporaryAccess() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [signedIn, setSignedIn] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const processing = useRef(false)

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

  useEffect(() => {
    if (!signedIn || processing.current) return
    const next = destination()
    const kind = next === "/temporarios/publicar" ? "owner" :
      next === "/temporarios/buscar" ? "tenant" : null
    if (!kind) return
    const pending = readPendingTemporaryDraft(kind)
    if (!pending) return
    const lockKey = "verlo-temporarios-inflight-" + kind
    const existing = Number(window.localStorage.getItem(lockKey) || 0)
    if (existing && Date.now() - existing < 120000) {
      setMessage("Estamos procesando tu registro. Esperá un momento antes de reintentar.")
      return
    }
    window.localStorage.setItem(lockKey, String(Date.now()))
    processing.current = true
    setFinishing(true)
    setMessage("Guardando tu formulario de Temporarios...")
    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) throw new Error("Sesión no disponible")
        const response = await fetch(kind === "owner" ? "/api/temporarios/properties" : "/api/temporarios/demands", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
          body: JSON.stringify(pending),
        })
        const data: { ok?: boolean; id?: string; error?: string } = await response.json()
        if (!response.ok || !data.ok || !data.id) {
          setMessage(data.error || "No se pudo guardar. Tu formulario sigue disponible en este navegador.")
          return
        }
        clearPendingTemporaryDraft(kind)
        window.localStorage.removeItem(lockKey)
        router.replace((kind === "owner" ? "/temporarios/success/propietario" : "/temporarios/success/inquilino") +
          "?registro=" + encodeURIComponent(data.id))
      } catch {
        setMessage("No se pudo guardar por un problema de conexión. Tu formulario sigue disponible en este navegador.")
      } finally {
        setFinishing(false)
        processing.current = false
      }
    })()
  }, [signedIn, router])

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
          <p>{finishing ? "Guardando tu formulario..." : "Tu sesión ya está iniciada. Podés continuar con tu publicación o búsqueda."}</p>
          {message && <p role="status">{message}</p>}
          <button style={button} disabled={finishing} type="button" onClick={() => router.push(destination())}>Continuar en Temporarios</button>
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
