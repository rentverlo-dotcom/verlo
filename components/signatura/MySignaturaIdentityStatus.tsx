"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type Status = "not_started" | "pending" | "verified" | "failed"

/**
 * QA-only identity verification inside Mi VERLO. The provider link belongs
 * to the authenticated signer; never put it into URLs, storage or logs.
 * Signatura owns DNI, liveness and signature UI inside the frame.
 */
function validatedSignaturaUrl(value: unknown): string {
  if (typeof value !== "string") throw new Error("No hay una sesión de validación disponible.")
  const url = new URL(value)
  if (url.protocol !== "https:" || url.username || url.password ||
      (url.hostname !== "signatura.co" && !url.hostname.endsWith(".signatura.co"))) {
    throw new Error("Signatura devolvió una dirección no autorizada.")
  }
  return url.toString()
}

export default function MySignaturaIdentityStatus() {
  const [status, setStatus] = useState<Status | null>(null)
  const [opening, setOpening] = useState(false)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)
  const checking = useRef(false)

  const checkVerification = useCallback(async () => {
    if (checking.current) return
    checking.current = true
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return
      const headers = { Authorization: "Bearer " + data.session.access_token }
      const statusRes = await fetch("/api/signatura/identity-status", {
        headers, cache: "no-store",
      })
      if (!statusRes.ok) return
      const current = await statusRes.json().catch(() => ({}))
      if (!current.ok || !["not_started", "pending", "verified", "failed"].includes(current.status)) return
      if (current.status !== "pending") {
        setStatus(current.status as Status)
        if (current.status === "verified") setEmbedUrl(null)
        return
      }
      setStatus("pending")
      // Never infer completion from an iframe navigation or a visible PDF seal.
      // The backend only verifies after an authenticated Signatura webhook,
      // completed document/signature and BI.validated === true.
      const reconcile = await fetch("/api/signatura/identity-reconcile", {
        method: "POST", headers, cache: "no-store",
      })
      if (!reconcile.ok) return
      const confirmed = await reconcile.json().catch(() => ({}))
      if (confirmed.ok && confirmed.status === "verified") {
        setStatus("verified")
        setEmbedUrl(null)
      }
    } catch {
      // A network failure must never mark an identity as verified.
    } finally {
      checking.current = false
    }
  }, [])

  useEffect(() => { void checkVerification() }, [checkVerification])

  useEffect(() => {
    if (!embedUrl) return
    // While embedded, reconcile asynchronously as the signed webhook arrives.
    // No extra declarations or provider signing sessions are created.
    const interval = window.setInterval(() => { void checkVerification() }, 6000)
    return () => window.clearInterval(interval)
  }, [embedUrl, checkVerification])

  useEffect(() => {
    if (!embedUrl) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEmbedUrl(null)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [embedUrl])

  function showEmbeddedSession(value: unknown) {
    const url = validatedSignaturaUrl(value)
    setEmbedUrl(url)
  }

  async function openOwnInvitation() {
    if (opening || status !== "pending") return
    setOpening(true)
    setOpenError(null)
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) throw new Error("Iniciá sesión para continuar.")
      const response = await fetch("/api/signatura/my-signing-url", {
        headers: { Authorization: "Bearer " + data.session.access_token },
        cache: "no-store",
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.ok) {
        throw new Error("Todavía no está disponible tu enlace de validación.")
      }
      showEmbeddedSession(result.signing_url)
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : "No pudimos abrir la validación.")
    } finally {
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
      const headers = {
        Authorization: "Bearer " + data.session.access_token,
        "Content-Type": "application/json",
      }
      const response = await fetch("/api/signatura/identity-start", {
        method: "POST", headers,
        body: JSON.stringify({ acknowledged: true }), cache: "no-store",
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.ok) {
        throw new Error("No pudimos iniciar la declaración. Revisaremos el intento antes de repetirlo.")
      }
      const nextStatus: Status = result.status === "verified" ? "verified" : "pending"
      setStatus(nextStatus)
      if (nextStatus === "verified") return

      if (typeof result.signing_url === "string") {
        showEmbeddedSession(result.signing_url)
      } else {
        // The document can exist even if Signatura didn't return its link
        // on creation; use the same authorized read-only resume endpoint.
        const own = await fetch("/api/signatura/my-signing-url", {
          headers: { Authorization: headers.Authorization }, cache: "no-store",
        })
        const link = await own.json().catch(() => ({}))
        if (!own.ok || !link.ok) {
          throw new Error("Tu declaración quedó guardada. Usá Continuar validación cuando esté disponible.")
        }
        showEmbeddedSession(link.signing_url)
      }
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : "No pudimos iniciar.")
    } finally {
      setOpening(false)
    }
  }

  if (!status) return null
  const verified = status === "verified"

  return (
    <section style={{
      marginBottom: 16, padding: "16px 20px", borderRadius: 14,
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

      {embedUrl && status === "pending" && (
        <div role="dialog" aria-modal="true" aria-labelledby="verlo-signatura-title"
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "#f4f0f1", display: "flex", flexDirection: "column",
          }}>
          <header style={{
            padding: "12px 18px", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12, background: "#fff",
            borderBottom: "1px solid #e6dfe2",
          }}>
            <div>
              <strong id="verlo-signatura-title" style={{ fontSize: 19, color: "#090607" }}>
                VERLO · Validación de identidad
              </strong>
              <div style={{ fontSize: 12, color: "#5d565a" }}>
                Documento, biometría y firma segura
              </div>
            </div>
            <button type="button" onClick={() => { setEmbedUrl(null); void checkVerification() }}
              style={{
                border: "1px solid #e1dadd", borderRadius: 20, background: "#fff",
                padding: "10px 16px", color: "#171314", cursor: "pointer",
              }}>
              Volver a Mi VERLO
            </button>
          </header>
          <main style={{
            flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", padding: 24,
          }}>
            <div style={{
              background: "#fff", border: "1px solid #e7e0e2",
              borderRadius: 20, maxWidth: 520, width: "100%",
              padding: 30, textAlign: "center", color: "#171314",
            }}>
              <h2 style={{ fontSize: 24, margin: "0 0 12px" }}>
                Continuar la validación segura
              </h2>
              <p style={{ lineHeight: 1.5, margin: "0 0 18px" }}>
                Signatura no permite mostrar esta sesión dentro de otra página.
                Abriremos la validación en la misma pestaña y, cuando termines,
                volverás automáticamente a Mi VERLO.
              </p>
              <button type="button"
                onClick={() => window.location.assign(embedUrl)}
                style={{
                  padding: "14px 20px", background: "#101010", color: "#fff",
                  border: 0, borderRadius: 24, fontWeight: 700,
                  cursor: "pointer",
                }}>
                Continuar con Signatura
              </button>
              <p style={{ fontSize: 12, color: "#555", marginTop: 16 }}>
                Este botón utiliza tu declaración pendiente. No crea
                un nuevo documento ni vuelve a cobrar su creación.
              </p>
            </div>
          </main>
          <div style={{
            padding: "7px 16px", textAlign: "center", fontSize: 12,
            color: "#5d565a", background: "#fff",
          }}>
            La identidad se habilita solamente después de la confirmación biométrica de Signatura.
          </div>
        </div>
      )}
    </section>
  )
}
