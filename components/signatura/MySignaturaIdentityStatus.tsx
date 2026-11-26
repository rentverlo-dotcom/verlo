"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { trackPostHog } from "@/lib/posthog-client"

type Status = "not_started" | "pending" | "verified" | "failed"

/**
 * QA-only identity verification inside Mi VERLO. The provider link belongs
 * to the authenticated signer; never put it into URLs, storage or logs.
 * Signatura hosts the biometric and signing UI on its own HTTPS origin.
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
  const [openError, setOpenError] = useState<string | null>(null)
  const checking = useRef(false)
  const verifiedAlreadyObserved = useRef(false)

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
        // A verified state is not a purchase or a new verification event.
        // It can be seen many times by this returning user.
        if (current.status === "verified") verifiedAlreadyObserved.current = true
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
        // This is a UX observation, not an authoritative conversion count.
        if (!verifiedAlreadyObserved.current) {
          verifiedAlreadyObserved.current = true
          trackPostHog("identity_verification_state_observed", {
            area: "tradicionales", role: "tenant", provider: "signatura", state: "verified",
          })
        }
      }
    } catch {
      // A network failure must never mark an identity as verified.
    } finally {
      checking.current = false
    }
  }, [])

  useEffect(() => { void checkVerification() }, [checkVerification])

  function openSigningSession(value: unknown) {
    // Signatura hosts this protected session on its own origin.
    // The provider complete_url returns the signer to Mi VERLO.
    window.location.assign(validatedSignaturaUrl(value))
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
      trackPostHog("identity_verification_resumed", {area: "tradicionales", role: "tenant", provider: "signatura"})
      openSigningSession(result.signing_url)
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : "No pudimos abrir la validación.")
    } finally {
      setOpening(false)
    }
  }

  async function beginIdentityDeclaration() {
    if (opening || status !== "not_started") return
    if (!window.confirm("Vas a validar tu identidad en el sitio seguro de Signatura y después volverás a Mi VERLO. ¿Continuar?")) return
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
      trackPostHog("identity_verification_initiated", {
        area: "tradicionales", role: "tenant", provider: "signatura",
        created: result.created === true,
      })
      const nextStatus: Status = result.status === "verified" ? "verified" : "pending"
      setStatus(nextStatus)
      if (nextStatus === "verified") return

      if (typeof result.signing_url === "string") {
        openSigningSession(result.signing_url)
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
        openSigningSession(link.signing_url)
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
          {opening ? "Preparando validación..." : "Validar mi identidad"}
        </button>
      )}
      {status === "pending" && (
        <button type="button" onClick={openOwnInvitation} disabled={opening}
          style={{ marginTop: 10, padding: "10px 14px", borderRadius: 9,
            border: "none", background: "#1d4ed8", color: "#fff",
            cursor: opening ? "wait" : "pointer" }}>
          {opening ? "Abriendo validación..." : "Retomar validación"}
        </button>
      )}
      {openError && <p role="alert" style={{ fontSize: 13, color: "#b91c1c" }}>{openError}</p>}

      {(status === "not_started" || status === "pending") && (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "#596274", lineHeight: 1.5 }}>
          Para proteger tus datos, la validación se realiza en el sitio seguro
          de Signatura. Al terminar, volvés automáticamente a Mi VERLO.
        </p>
      )}
    </section>
  )
}
