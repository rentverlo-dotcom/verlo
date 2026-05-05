"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import VerloBrand from "@/components/VerloBrand"

type Role = "tenant" | "owner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()

    if (!role) {
      setError("Elegí si ingresás como inquilino o propietario")
      return
    }

    setLoading(true)
    setError(null)
    setInfo(null)

const next =
  role === "owner"
    ? "/propietario/publicar-v2"
    : "/buscar"

const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: redirectTo,
    shouldCreateUser: true,
  },
})

    if (error) {
      setError("No se pudo enviar el link. Revisá el email.")
    } else {
      setInfo("Te enviamos un link a tu mail para ingresar.")
    }

    setLoading(false)
  }

  return (
    <main className="login-page">
      <style jsx global>{`
        :root {
          --pink: #f2a8a9;
          --pink-dark: #c37986;
          --black: #050002;
          --soft: #f2ebec;
          --cream: #efefea;
          --blue: #74bedc;
          --yellow: #e7c776;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: var(--soft);
          color: var(--black);
        }

        .login-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 110px 20px 60px;
          background:
            radial-gradient(circle at 15% 18%, rgba(242, 168, 169, 0.5), transparent 28%),
            radial-gradient(circle at 82% 26%, rgba(231, 199, 118, 0.26), transparent 24%),
            radial-gradient(circle at 80% 84%, rgba(116, 190, 220, 0.2), transparent 28%),
            var(--soft);
        }

        .login-card {
          width: min(100%, 560px);
          border-radius: 42px;
          padding: 42px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(5, 0, 2, 0.08);
          box-shadow: 0 28px 80px rgba(5, 0, 2, 0.08);
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--black);
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.06em;
          line-height: 1;
        }

        .mark {
          width: 34px;
          height: 28px;
          position: relative;
          display: inline-block;
        }

        .mark::before,
        .mark::after {
          content: "";
          position: absolute;
          top: 0;
          width: 21px;
          height: 28px;
          border: 6px solid var(--black);
          border-radius: 999px;
        }

        .mark::before {
          left: 0;
        }

        .mark::after {
          right: 0;
        }

        .mark span {
          position: absolute;
          left: 50%;
          top: 4px;
          transform: translateX(-50%);
          width: 10px;
          height: 20px;
          border-radius: 999px;
          background: var(--pink);
          z-index: 2;
        }

        .eyebrow {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 34px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(5, 0, 2, 0.08);
          color: rgba(5, 0, 2, 0.64);
          font-size: 13px;
          font-weight: 900;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--pink-dark);
          box-shadow: 0 0 0 5px rgba(195, 121, 134, 0.14);
        }

        .login-title {
          margin: 24px 0 0;
          font-size: clamp(52px, 7vw, 82px);
          line-height: 0.9;
          letter-spacing: -0.085em;
          font-weight: 950;
        }

        .login-title em {
          font-family: Georgia, "Times New Roman", serif;
          font-style: italic;
          font-weight: 400;
        }

        .login-copy {
          margin: 18px 0 0;
          color: rgba(5, 0, 2, 0.64);
          line-height: 1.5;
          font-size: 17px;
        }

        .form {
          margin-top: 32px;
          display: grid;
          gap: 18px;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .field label {
          font-size: 13px;
          font-weight: 950;
          color: rgba(5, 0, 2, 0.72);
          padding-left: 4px;
        }

        .input {
          width: 100%;
          min-height: 58px;
          border: 1px solid rgba(5, 0, 2, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.86);
          padding: 0 18px;
          color: var(--black);
          font-size: 16px;
          outline: none;
        }

        .input:focus {
          border-color: var(--pink-dark);
          box-shadow: 0 0 0 5px rgba(195, 121, 134, 0.12);
          background: white;
        }

        .role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 6px;
          border-radius: 24px;
          background: rgba(5, 0, 2, 0.05);
          border: 1px solid rgba(5, 0, 2, 0.06);
        }

        .role-button {
          min-height: 58px;
          border-radius: 18px;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(5, 0, 2, 0.62);
          cursor: pointer;
          font-weight: 950;
          font-size: 15px;
          transition: 150ms ease;
        }

        .role-button.active {
          background: var(--black);
          color: white;
          box-shadow: 0 16px 34px rgba(5, 0, 2, 0.16);
        }

        .submit {
          min-height: 58px;
          border-radius: 999px;
          border: 1px solid rgba(5, 0, 2, 0.12);
          background: var(--black);
          color: white;
          font-size: 16px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
        }

        .submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .error,
        .info {
          margin: 0;
          padding: 14px 16px;
          border-radius: 18px;
          font-size: 14px;
          font-weight: 850;
        }

        .error {
          background: rgba(195, 121, 134, 0.14);
          color: #7f2435;
        }

        .info {
          background: rgba(116, 190, 220, 0.16);
          color: #255a6d;
        }

        @media (max-width: 560px) {
          .login-card {
            padding: 28px;
            border-radius: 32px;
          }

          .role-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="login-card">
      <VerloBrand width={104} />

        <div className="eyebrow">
          <span className="dot" />
          Acceso seguro
        </div>

        <h1 className="login-title">
          Entrá a <em>Verlo.</em>
        </h1>

        <p className="login-copy">
          Usá el mismo usuario para publicar propiedades, buscar alquileres y avanzar en el flujo cuando haya match.
        </p>

        <form className="form" onSubmit={sendMagicLink}>
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>¿Cómo querés ingresar ahora?</label>

            <div className="role-grid">
              <button
                type="button"
                className={`role-button ${role === "tenant" ? "active" : ""}`}
                onClick={() => setRole("tenant")}
              >
                Soy inquilino
              </button>

              <button
                type="button"
                className={`role-button ${role === "owner" ? "active" : ""}`}
                onClick={() => setRole("owner")}
              >
                Soy propietario
              </button>
            </div>
          </div>

          {error && <p className="error">{error}</p>}
          {info && <p className="info">{info}</p>}

          <button className="submit" type="submit" disabled={loading}>
            {loading ? "Enviando link..." : "Enviar link de acceso"}
          </button>
        </form>
      </section>
    </main>
  )
}
