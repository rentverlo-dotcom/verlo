"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import VerloBrand from "@/components/VerloBrand"

const styles = `
  .auth-root {
    --pink: #f2a8a9;
    --black: #050002;
    --soft: #f2ebec;
    min-height: 100vh;
    background: var(--soft);
    color: var(--black);
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    display: grid;
    place-items: center;
    padding: 24px;
    overflow: hidden;
    position: relative;
  }

  .auth-card {
    width: min(680px, 100%);
    border-radius: 42px;
    padding: 44px;
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid rgba(5, 0, 2, 0.08);
    box-shadow: 0 28px 80px rgba(5, 0, 2, 0.08);
    text-align: center;
    position: relative;
    z-index: 2;
  }

  .auth-card h1 {
    margin: 28px 0 0;
    font-size: clamp(42px, 6vw, 76px);
    line-height: 0.95;
    letter-spacing: -0.075em;
    font-weight: 950;
  }

  .auth-card p {
    margin: 20px auto 0;
    max-width: 520px;
    font-size: 18px;
    line-height: 1.5;
    color: rgba(5, 0, 2, 0.68);
  }

  .auth-button {
    margin-top: 30px;
    min-height: 58px;
    padding: 0 26px;
    border-radius: 999px;
    border: 1px solid rgba(5, 0, 2, 0.12);
    background: var(--black);
    color: white;
    font-size: 16px;
    font-weight: 950;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
  }

  .confetti {
    position: fixed;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 1;
  }

  .confetti span {
    position: absolute;
    top: -24px;
    left: var(--x);
    width: var(--size);
    height: calc(var(--size) * 1.45);
    border-radius: 3px;
    background: hsl(var(--hue), 90%, 62%);
    animation: confetti-fall var(--duration) cubic-bezier(0.17, 0.67, 0.28, 1.01) forwards;
    animation-delay: var(--delay);
    opacity: 0.95;
  }

  .confetti span:nth-child(3n) {
    border-radius: 999px;
  }

  .confetti span:nth-child(4n) {
    height: var(--size);
  }

  @keyframes confetti-fall {
    0% {
      transform: translate3d(0, -30px, 0) rotate(0deg);
      opacity: 1;
    }

    35% {
      transform: translate3d(28px, 34vh, 0) rotate(var(--rotate));
    }

    70% {
      transform: translate3d(-22px, 72vh, 0) rotate(calc(var(--rotate) * 1.5));
      opacity: 1;
    }

    100% {
      transform: translate3d(18px, 110vh, 0) rotate(calc(var(--rotate) * 2));
      opacity: 0;
    }
  }
`

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading")
  const [message, setMessage] = useState("Estamos confirmando tu acceso.")

  useEffect(() => {
    async function finishLogin() {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        setStatus("ok")
        setMessage("Tu cuenta quedó confirmada. Ya podés avanzar con Verlo.")
        return
      }

      setTimeout(async () => {
        const { data: retryData } = await supabase.auth.getSession()

        if (retryData.session) {
          setStatus("ok")
          setMessage("Tu cuenta quedó confirmada. Ya podés avanzar con Verlo.")
        } else {
          setStatus("error")
          setMessage("No pudimos confirmar tu acceso. Probá abrir el link del email nuevamente.")
        }
      }, 700)
    }

    finishLogin()
  }, [])

  return (
    <main className="auth-root">
      <style>{styles}</style>

      {status === "ok" && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 90 }).map((_, index) => (
            <span
              key={index}
              style={
                {
                  "--x": `${Math.random() * 100}%`,
                  "--delay": `${Math.random() * 0.55}s`,
                  "--duration": `${1.9 + Math.random() * 1.4}s`,
                  "--size": `${7 + Math.random() * 8}px`,
                  "--rotate": `${Math.random() * 720}deg`,
                  "--hue": `${Math.random() * 360}`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <section className="auth-card">
        <VerloBrand width={132} />

        <h1>
          {status === "ok"
            ? "Cuenta confirmada"
            : status === "error"
              ? "No pudimos confirmar"
              : "Entrando a Verlo"}
        </h1>

        <p>{message}</p>

        {status === "ok" && (
          <a className="auth-button" href="/">
            Ir a Verlo
          </a>
        )}

        {status === "error" && (
          <a className="auth-button" href="/test-captacion">
            Volver a intentar
          </a>
        )}
      </section>
    </main>
  )
}
