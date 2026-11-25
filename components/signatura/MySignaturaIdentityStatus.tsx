"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type Status = "not_started" | "pending" | "verified" | "failed"

export default function MySignaturaIdentityStatus() {
  const [status, setStatus] = useState<Status | null>(null)
  const [opening, setOpening] = useState(false)
  const [openError, setOpenError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function refresh() {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return
      try {
        const response = await fetch("/api/signatura/identity-status", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: "no-store",
        })
        if (!response.ok) return
        const body = await response.json()
        if (active && body.ok && ["not_started","pending","verified","failed"].includes(body.status)) {
          setStatus(body.status as Status)
          if (body.status === "pending") {
            // Verify the provider's signed event AND approved BI via the
            // authenticated reconciliation endpoint, never a local timer.
            const reconcile = await fetch("/api/signatura/identity-reconcile", {
              method: "POST",
              headers: { Authorization: `Bearer ${data.session.access_token}` },
              cache: "no-store",
            })
            if (reconcile.ok) {
              const checked = await reconcile.json().catch(() => ({}))
              if (active && checked.ok && checked.status === "verified") {
                setStatus("verified")
              }
            }
          }
        }
      } catch {
        // Never claim identity is verified if status lookup failed.
      }
    }
    void refresh()
    return () => { active = false }
  }, [])

  async function openOwnInvitation() {
    if (opening || status !== "pending") return
    setOpening(true)
    setOpenError(null)
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) throw new Error("Iniciá sesión para continuar.")
      const response = await fetch("/api/signatura/my-signing-url", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        cache: "no-store",
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.ok || typeof result.signing_url !== "string") {
        throw new Error("Todavía no está disponible tu enlace de validación.")
      }
      const url = new URL(result.signing_url)
      if (url.protocol !== "https:" ||
          !(url.hostname === "signatura.co" || url.hostname.endsWith(".signatura.co"))) {
        throw new Error("El enlace de firma no es válido.")
      }
      // Navigating in the same tab keeps the single-signer URL private.
      window.location.assign(url.toString())
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : "No pudimos abrir el enlace.")
      setOpening(false)
    }
  }

  async function beginIdentityDeclaration() {
    if (opening || status !== "not_started") return
    if (!window.confirm("QA: vas a iniciar una declaración de identidad con validación biométrica en Signatura. ¿Continuar?")) return
    setOpening(true)
    setOpenError(null)
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) throw new Error("Iniciá sesión para continuar.")
      const response = await fetch("/api/signatura/identity-start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ acknowledged: true }),
        cache: "no-store",
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.ok) throw new Error(
        "No pudimos iniciar la declaración. Revisaremos el intento antes de repetirlo."
      )
      setStatus(result.status === "verified" ? "verified" : "pending")
      if (typeof result.signing_url === "string") {
        const url = new URL(result.signing_url)
        if (url.protocol === "https:" &&
            (url.hostname === "signatura.co" || url.hostname.endsWith(".signatura.co"))) {
          window.location.assign(url.toString())
          return
        }
      }
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : "No pudimos iniciar.")
    } finally {
      setOpening(false)
    }
  }

  // QA-only: hide status entirely if there is no verified response.
  if (!status) return null
  const verified = status === "verified"

  return (
    <section style={{
      marginBottom: "16px", padding: "16px 20px", borderRadius: "14px",
      border: verified ? "1px solid #93c5fd" : "1px solid #e5e7eb",
      background: verified ? "#eff6ff" : "#f9fafb",
      color: verified ? "#1e3a8a" : "#374151",
    }} aria-label="Estado de identidad VERLO">
      <strong style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden="true">{verified ? "✓" : "○"}</span>
        {verified ? "Identidad verificada" : "Identidad VERLO"}
      </strong>
      <p style={{ margin: "6px 0 0", fontSize: 14 }}>
        {verified ? "Tu identidad está verificada para solicitar visitas."
          : status === "pending" ? "Tu verificación de identidad está pendiente."
          : status === "failed" ? "No se pudo completar la verificación de identidad."
          : "Todavía no activaste tu identidad VERLO."}
      </p>
      {status === "not_started" && (
        <button type="button" onClick={beginIdentityDeclaration} disabled={opening}
          style={{ marginTop: 10, padding: "10px 14px", borderRadius: 9,
            border: "none", background: "#1d4ed8", color: "#fff" }}>
          {opening ? "Preparando declaración..." : "Validar identidad"}
        </button>
      )}
      {status === "pending" && (
        <button type="button" onClick={openOwnInvitation} disabled={opening}
          style={{ marginTop: 10, padding: "10px 14px", borderRadius: 9,
            border: "none", background: "#1d4ed8", color: "#fff",
            cursor: opening ? "wait" : "pointer" }}>
          {opening ? "Abriendo validación..." : "Continuar validación"}
        </button>
      )}
      {openError && <p role="alert" style={{ fontSize: 13, color: "#b91c1c" }}>{openError}</p>}
    </section>
  )
}
