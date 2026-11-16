"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type Signing = { contractId: string; role: "owner" | "tenant"; signingUrl: string }

export default function MyIdentikSigning() {
  const [items, setItems] = useState<Signing[]>([])
  const [ready, setReady] = useState<Array<{ contractId: string }>>([])
  const [signed, setSigned] = useState<Array<{ contractId: string }>>([])
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) { setItems([]); setReady([]); setSigned([]); return }
      const res = await fetch("/api/identik/my-signing", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        cache: "no-store",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error || "No se pudieron consultar las firmas"); setItems([]); return }
      setError("")
      setItems(Array.isArray(body.items) ? body.items : [])
      setReady(Array.isArray(body.ready) ? body.ready : [])
      const completed = await fetch("/api/identik/my-signed", { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: "no-store" })
      if (completed.ok) { const result = await completed.json().catch(() => ({})); setSigned(Array.isArray(result.contracts) ? result.contracts : []) }
    } catch {
      setError("No se pudieron consultar las firmas")
    } finally { setLoading(false) }
  }

  useEffect(() => { void refresh() }, [])
  async function prepare(contractId: string) {
    if (starting) return
    setStarting(true)
    setError("")
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) throw new Error("Ingresá nuevamente a Mi VERLO")
      const res = await fetch("/api/identik/my-signing", {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ contractId }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "No se pudo iniciar la firma")
      await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo iniciar la firma") }
    finally { setStarting(false) }
  }
  async function openSigned(contractId: string) {
    const popup = window.open("", "_blank")
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) throw new Error("Ingresá nuevamente a Mi VERLO")
      const res = await fetch("/api/identik/my-signed", {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ contractId }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.url) throw new Error(body.error || "No se pudo abrir el PDF firmado")
      if (popup) popup.location.href = body.url
      else setError("Permití ventanas emergentes para abrir el contrato firmado")
    } catch (e) {
      popup?.close()
      setError(e instanceof Error ? e.message : "No se pudo abrir el PDF firmado")
    }
  }
  // Hide the section if there is no eligible session or archived signed PDF.
  if (items.length === 0 && ready.length === 0 && signed.length === 0 && !error) return null
  return <section style={{ border:"1px solid #e8dfe1", borderRadius:16, padding:20, background:"#fff", margin:"18px 0", color:"#050002" }}>
    <h2 style={{ margin:"0 0 10px", fontSize:22 }}>Tus contratos pendientes de firma</h2>
    <p style={{ fontSize:14 }}>Firmá desde VERLO. Se abrirá la página segura de Identik en una pestaña nueva; no necesitás ninguna invitación por email.</p>
    {ready.map(item => <div key={item.contractId} style={{ margin:"12px 0" }}>
      <p>Las partes aceptaron las condiciones y se verificaron los requisitos previos.</p>
      <button type="button" disabled={starting || loading} onClick={() => void prepare(item.contractId)}
        style={{ background:"#050002", color:"#fff", border:0, borderRadius:24, padding:"12px 20px", fontWeight:700, cursor:"pointer" }}>
        {starting ? "Preparando firma…" : "Preparar firma del contrato"}
      </button>
    </div>)}
    {items.map(item => <div key={item.contractId} style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center", marginTop:12 }}>
      <span>Contrato · {item.role === "owner" ? "Propietario" : "Inquilino"}</span>
      <a href={item.signingUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
        style={{ background:"#050002", color:"#fff", borderRadius:24, padding:"12px 20px", textDecoration:"none", fontWeight:700 }}>
        Firmar contrato
      </a>
    </div>)}
    {signed.map(item => <div key={"signed-" + item.contractId} style={{ marginTop:12 }}>
      <span style={{ fontWeight:700 }}>Contrato firmado electrónicamente</span>{" "}
      <button type="button" onClick={() => void openSigned(item.contractId)}
        style={{ border:"1px solid #ddd5d7", borderRadius:22, padding:"10px 16px", background:"#fff", cursor:"pointer" }}>
        Descargar PDF firmado
      </button>
    </div>)}
    {error && <p role="alert" style={{ color:"#892b40" }}>{error}</p>}
    <button type="button" onClick={() => void refresh()} disabled={loading}
      style={{ marginTop:16, border:"1px solid #d4c9cc", borderRadius:18, padding:"8px 12px", background:"#fff", cursor:"pointer" }}>
      {loading ? "Actualizando…" : "Actualizar estado"}
    </button>
  </section>
}
