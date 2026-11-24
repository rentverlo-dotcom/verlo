"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type Status = "not_started" | "pending" | "verified" | "failed"

export default function MySignaturaIdentityStatus() {
  const [status, setStatus] = useState<Status | null>(null)

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
        }
      } catch {
        // Never claim identity is verified if status lookup failed.
      }
    }
    void refresh()
    return () => { active = false }
  }, [])

  // QA-only: hide status entirely if there is no verified response.
  if (!status) return null
  const verified = status === "verified"

  return (
    <section style={{
      marginBottom: "16px", padding: "16px 20px", borderRadius: "14px",
      border: "1px solid #dbeafe", background: "#eff6ff", color: "#1e3a8a",
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
    </section>
  )
}
