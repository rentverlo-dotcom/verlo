"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type Signing = { contractId: string; role: "owner" | "tenant"; signingUrl: string }

export default function MyIdentikSigning() {
  const [items, setItems] = useState<Signing[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) { setItems([]); return }
      const res = await fetch("/api/identik/my-signing", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        cache: "no-store",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error || "No se pudieron consultar las firmas"); setItems([]); return }
      setError("")
      setItems(Array.isArray(body.items) ? body.items : [])
    } catch {
      setError("No se pudieron consultar las firmas")
    } finally { setLoading(false) }
  }

  useEffect(() => { void refresh() }, [])
  // No box at all when there are no existing, eligible signing sessions.
  if (items.length === 0 && !error) return null
  return <section style={{ border:"1px solid #e8dfe1", borderRadius:16, padding:20, background:"#fff", margin:"18px 0", color:"#050002" }}>
    <h2 style={{ margin:"0 0 10px", fontSize:22 }}>Tus contratos pendientes de firma</h2>
    <p style={{ fontSize:14 }}>Firmá desde VERLO. Se abrirá la página segura de Identik en una pestaña nueva; no necesitás ninguna invitación por email.</p>
    {items.map(item => <div key={item.contractId} style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center", marginTop:12 }}>
      <span>Contrato · {item.role === "owner" ? "Propietario" : "Inquilino"}</span>
      <a href={item.signingUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
        style={{ background:"#050002", color:"#fff", borderRadius:24, padding:"12px 20px", textDecoration:"none", fontWeight:700 }}>
        Firmar contrato
      </a>
    </div>)}
    {error && <p role="alert" style={{ color:"#892b40" }}>{error}</p>}
    <button type="button" onClick={() => void refresh()} disabled={loading}
      style={{ marginTop:16, border:"1px solid #d4c9cc", borderRadius:18, padding:"8px 12px", background:"#fff", cursor:"pointer" }}>
      {loading ? "Actualizando…" : "Actualizar estado"}
    </button>
  </section>
}
