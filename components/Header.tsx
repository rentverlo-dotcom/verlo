"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

export default function Header() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "76px",
        background: "rgba(242,235,236,0.78)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        zIndex: 100,
        borderBottom: "1px solid rgba(5,0,2,0.08)",
      }}
    >
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          textDecoration: "none",
          color: "#050002",
          fontSize: 28,
          fontWeight: 950,
          letterSpacing: "-0.06em",
          lineHeight: 1,
        }}
      >
        verlo
        <span
          style={{
            width: 34,
            height: 28,
            position: "relative",
            display: "inline-block",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 21,
              height: 28,
              border: "6px solid #050002",
              borderRadius: 999,
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: 21,
              height: 28,
              border: "6px solid #050002",
              borderRadius: 999,
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: 4,
              transform: "translateX(-50%)",
              width: 10,
              height: 20,
              borderRadius: 999,
              background: "#f2a8a9",
              zIndex: 2,
            }}
          />
        </span>
      </Link>

      <nav
        style={{
          display: "flex",
          gap: 18,
          alignItems: "center",
          fontSize: 14,
          fontWeight: 850,
        }}
      >
        <Link
          href="/#como-funciona"
          style={{
            color: "rgba(5,0,2,0.68)",
            textDecoration: "none",
          }}
        >
          Cómo funciona
        </Link>

        <Link
          href="/propietario/publicar-v2"
          style={{
            color: "rgba(5,0,2,0.68)",
            textDecoration: "none",
          }}
        >
          Publicar
        </Link>

        {user && (
          <Link
            href="/owner"
            style={{
              color: "rgba(5,0,2,0.68)",
              textDecoration: "none",
            }}
          >
            Mis propiedades
          </Link>
        )}

        {user ? (
          <Link
            href="/logout"
            style={{
              minHeight: 42,
              padding: "0 16px",
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#050002",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 950,
            }}
          >
            Salir
          </Link>
        ) : (
          <Link
            href="/login"
            style={{
              minHeight: 42,
              padding: "0 16px",
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#050002",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 950,
            }}
          >
            Ingresar
          </Link>
        )}
      </nav>
    </header>
  )
}
