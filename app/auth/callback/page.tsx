"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function finishLogin() {
      const next = searchParams.get("next") || "/"

      const { data } = await supabase.auth.getSession()

      if (data.session) {
        router.replace(next)
        return
      }

      setTimeout(async () => {
        const { data: retryData } = await supabase.auth.getSession()

        if (retryData.session) {
          router.replace(next)
        } else {
          router.replace("/login")
        }
      }, 500)
    }

    finishLogin()
  }, [router, searchParams])

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f2ebec",
        color: "#050002",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 42, letterSpacing: "-0.06em" }}>
          Entrando a Verlo...
        </h1>
        <p style={{ marginTop: 12, color: "rgba(5,0,2,0.62)" }}>
          Estamos confirmando tu acceso.
        </p>
      </div>
    </main>
  )
}
