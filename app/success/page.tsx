"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"


const logoUrl =
  "https://pub-804525ac911240ab845e611b752528e4.r2.dev/WhatsApp%20Image%202026-06-14%20at%2016.35.42.jpeg"

const pendingLeadStorageKey = "verlo_pending_user_data"

type PendingLead = {
  full_name: string
  email: string
  phone: string
  role: string
  need: string
}

function clean(value: unknown) {
  return String(value || "").trim()
}

export default function SuccessPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Estamos confirmando tus datos.")

  useEffect(() => {
    let mounted = true

    async function completeRegistration() {
      try {
        const storedLead = localStorage.getItem(pendingLeadStorageKey)

        if (!storedLead) {
          throw new Error("No encontramos los datos del formulario. Volvé a completarlo.")
        }

        const lead = JSON.parse(storedLead) as PendingLead

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session?.user) {
          throw new Error("No pudimos confirmar tu email. Abrí nuevamente el link del correo.")
        }

        const sessionEmail = clean(session.user.email).toLowerCase()
        const leadEmail = clean(lead.email).toLowerCase()

        if (!sessionEmail || sessionEmail !== leadEmail) {
          throw new Error("El email confirmado no coincide con el email del formulario.")
        }

        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: lead.full_name,
            phone: lead.phone,
            role: lead.role,
            need: lead.need,
            source: "home_magic_link",
            registered_at: new Date().toISOString(),
          },
        })

        if (updateError) {
          throw new Error(updateError.message || "No pudimos guardar tus datos.")
        }

        localStorage.removeItem(pendingLeadStorageKey)

        if (mounted) {
          setStatus("success")
          if (typeof window !== "undefined" && window.fbq) {
  window.fbq("track", "Lead", {
    content_name: "Verlo acceso anticipado confirmado",
    source: "success_magic_link",
  })
}
          setMessage(
            "Hemos tomado tus datos correctamente. Te vamos a escribir cuando Verlo esté listo para el lanzamiento."
          )
        }
      } catch (err) {
        console.error(err)

        if (mounted) {
          setStatus("error")

          if (err instanceof Error) {
            setMessage(err.message)
          } else {
            setMessage("No pudimos completar el registro. Probá de nuevo.")
          }
        }
      }
    }

    completeRegistration()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="successPage">
      <style jsx>{`
        .successPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at 18% 18%, rgba(32, 212, 102, 0.16), transparent 28%),
            radial-gradient(circle at 82% 22%, rgba(32, 212, 102, 0.12), transparent 28%),
            linear-gradient(180deg, #ffffff 0%, #f7fff9 100%);
          color: #050505;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
          overflow: hidden;
          position: relative;
        }
        .brandWord {
  color: #050505;
  font-weight: 950;
  letter-spacing: -0.06em;
}

.brandWord span {
  color: #20d466;
}
        .successButton {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 22px;
  border-radius: 999px;
  background: #20d466 !important;
  background-color: #20d466 !important;
  color: #06140a !important;
  text-decoration: none !important;
  font-weight: 950;
  border: 0 !important;
}

        .confetti {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .piece {
          position: absolute;
          top: -30px;
          width: 10px;
          height: 18px;
          border-radius: 3px;
          background: #20d466;
          animation: fall 4.8s linear infinite;
          opacity: 0.85;
        }

        .piece:nth-child(1) {
          left: 8%;
          animation-delay: 0s;
          background: #20d466;
        }

        .piece:nth-child(2) {
          left: 16%;
          animation-delay: 0.7s;
          background: #050505;
        }

        .piece:nth-child(3) {
          left: 25%;
          animation-delay: 1.2s;
          background: #35b864;
        }

        .piece:nth-child(4) {
          left: 34%;
          animation-delay: 0.4s;
          background: #20d466;
        }

        .piece:nth-child(5) {
          left: 43%;
          animation-delay: 1.7s;
          background: #050505;
        }

        .piece:nth-child(6) {
          left: 52%;
          animation-delay: 0.2s;
          background: #20d466;
        }

        .piece:nth-child(7) {
          left: 61%;
          animation-delay: 1.1s;
          background: #35b864;
        }

        .piece:nth-child(8) {
          left: 70%;
          animation-delay: 0.9s;
          background: #050505;
        }

        .piece:nth-child(9) {
          left: 79%;
          animation-delay: 1.5s;
          background: #20d466;
        }

        .piece:nth-child(10) {
          left: 88%;
          animation-delay: 0.5s;
          background: #35b864;
        }

        .piece:nth-child(11) {
          left: 94%;
          animation-delay: 2s;
          background: #050505;
        }

        @keyframes fall {
          0% {
            transform: translateY(-30px) rotate(0deg);
          }

          100% {
            transform: translateY(110vh) rotate(520deg);
          }
        }

        .card {
          position: relative;
          z-index: 2;
          width: min(560px, 100%);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px);
          border: 2px solid rgba(32, 212, 102, 0.58);
          border-radius: 32px;
          padding: 34px;
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.12);
          text-align: center;
        }

        .logo {
          width: 190px;
          height: auto;
          margin: 0 auto 24px;
          display: block;
        }

        .badge {
          width: 82px;
          height: 82px;
          margin: 0 auto 18px;
          border-radius: 999px;
          background: #20d466;
          color: white;
          display: grid;
          place-items: center;
          font-size: 42px;
          font-weight: 950;
          box-shadow: 0 16px 42px rgba(32, 212, 102, 0.42);
        }

        h1 {
          margin: 0;
          font-size: clamp(34px, 7vw, 54px);
          line-height: 0.95;
          letter-spacing: -0.06em;
          font-weight: 950;
        }

        p {
          margin: 18px auto 0;
          max-width: 450px;
          font-size: 18px;
          line-height: 1.32;
          color: rgba(0, 0, 0, 0.72);
          font-weight: 650;
        }

        .green {
          color: #20d466;
        }

        .loader {
          width: 56px;
          height: 56px;
          margin: 8px auto 20px;
          border-radius: 999px;
          border: 6px solid rgba(32, 212, 102, 0.18);
          border-top-color: #20d466;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .errorBadge {
          width: 82px;
          height: 82px;
          margin: 0 auto 18px;
          border-radius: 999px;
          background: #b00020;
          color: white;
          display: grid;
          place-items: center;
          font-size: 42px;
          font-weight: 950;
          box-shadow: 0 16px 42px rgba(176, 0, 32, 0.24);
        }

        .actions {
          margin-top: 26px;
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .button {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 22px;
          border-radius: 999px;
          background: #20d466 !important;
          color: #06140a !important;
          text-decoration: none !important;
          font-weight: 950;
        }

        .button:visited,
        .button:hover,
        .button:active {
          background: #20d466 !important;
          color: #06140a !important;
        }

        .buttonSecondary {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 22px;
          border-radius: 999px;
          background: #050505;
          color: white;
          text-decoration: none;
          font-weight: 950;
        }

        .small {
          margin-top: 18px;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.48);
          font-weight: 650;
        }

        @media (max-width: 640px) {
          .card {
            padding: 28px 22px;
            border-radius: 26px;
          }

          .logo {
            width: 160px;
          }
        }
      `}</style>

      <div className="confetti">
        <span className="piece" />
        <span className="piece" />
        <span className="piece" />
        <span className="piece" />
        <span className="piece" />
        <span className="piece" />
        <span className="piece" />
        <span className="piece" />
        <span className="piece" />
        <span className="piece" />
        <span className="piece" />
      </div>

      <section className="card">
        <img src={logoUrl} alt="Verlo" className="logo" />

        {status === "loading" ? (
          <>
            <div className="loader" />
            <h1>Confirmando tus datos</h1>
            <p>{message}</p>
          </>
        ) : status === "success" ? (
          <>
            <div className="badge">✓</div>
           <h1>
  Listo, ya sos parte de{" "}
  <span className="brandWord">
    <span>V</span>erlo
  </span>
</h1>
            <p>{message}</p>

            <div className="actions">
             <Link
  className="successButton"
  href="/"
  style={{
    background: "#20d466",
    backgroundColor: "#20d466",
    color: "#06140a",
    textDecoration: "none",
  }}
>
  Volver al inicio
</Link>
            </div>

            <div className="small">
              Guardamos tus datos dentro de tu usuario verificado.
            </div>
          </>
        ) : (
          <>
            <div className="errorBadge">!</div>
            <h1>No pudimos completar el registro</h1>
            <p>{message}</p>

            <div className="actions">
              <Link className="button" href="/">
                Completar de nuevo
              </Link>
              <a className="buttonSecondary" href="mailto:rentverlo@gmail.com">
                Contactar a Verlo
              </a>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
