"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  supabase,
} from "@/lib/supabase/client"

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
`

type Status =
  | "loading"
  | "linking"
  | "ok"
  | "error"

async function wait(
  milliseconds: number
) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        milliseconds
      )
  )
}

export default function AuthCallbackPage() {
  const router =
    useRouter()

  const [
    status,
    setStatus,
  ] =
    useState<Status>(
      "loading"
    )

  const [
    message,
    setMessage,
  ] =
    useState(
      "Estamos confirmando tu acceso."
    )

  useEffect(() => {
    let cancelled =
      false

    async function getSessionWithRetry() {
      for (
        let attempt = 0;
        attempt < 6;
        attempt += 1
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .auth
            .getSession()

        if (
          error
        ) {
          console.error(
            "auth callback getSession error:",
            error
          )
        }

        if (
          data.session
        ) {
          return data.session
        }

        await wait(
          350
        )
      }

      return null
    }

    async function finishLogin() {
      try {
        const session =
          await getSessionWithRetry()

        if (
          cancelled
        ) {
          return
        }

        if (
          !session
        ) {
          setStatus(
            "error"
          )

          setMessage(
            "No pudimos confirmar tu acceso. Probá abrir nuevamente el enlace que recibiste por email."
          )

          return
        }

        const source =
          String(
            session.user
              .user_metadata
              ?.source ||
              ""
          )

        // =====================================================
        // FLUJO NUEVO: CUENTA POST-CONTRATO
        // =====================================================

        if (
          source ===
          "rental_activation"
        ) {
          setStatus(
            "linking"
          )

          setMessage(
            "Tu acceso está confirmado. Estamos preparando Mi alquiler."
          )

          const response =
            await fetch(
              "/api/auth/complete-rental-profile",
              {
                method:
                  "POST",

                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              }
            )

          const result =
            await response
              .json()
              .catch(
                () => ({})
              )

          if (
            !response.ok ||
            !result?.ok
          ) {
            console.error(
              "complete rental profile error:",
              result
            )

            setStatus(
              "error"
            )

            setMessage(
              result?.error ||
                "No pudimos terminar de preparar tu cuenta."
            )

            return
          }

          if (
            cancelled
          ) {
            return
          }

          setStatus(
            "ok"
          )

          setMessage(
            "Tu cuenta quedó lista. Ya podés administrar tu alquiler desde Verlo."
          )

          await wait(
            900
          )

          if (
            cancelled
          ) {
            return
          }

          router.replace(
            "/mi-alquiler"
          )

          return
        }

        // =====================================================
        // FLUJOS VIEJOS DE AUTH
        // =====================================================

        setStatus(
          "ok"
        )

        setMessage(
          "Tu cuenta quedó confirmada."
        )
      } catch (
        error
      ) {
        console.error(
          "auth callback error:",
          error
        )

        if (
          cancelled
        ) {
          return
        }

        setStatus(
          "error"
        )

        setMessage(
          "No pudimos completar tu acceso. Probá nuevamente desde el enlace del email."
        )
      }
    }

    finishLogin()

    return () => {
      cancelled =
        true
    }
  }, [
    router,
  ])

  return (
    <main className="auth-root">
      <style>
        {styles}
      </style>

      <section className="auth-card">
        <VerloBrand
          width={132}
        />

        <h1>
          {status ===
          "error"
            ? "No pudimos confirmar"
            : status ===
                "ok"
              ? "Cuenta lista"
              : status ===
                  "linking"
                ? "Preparando tu espacio"
                : "Entrando a Verlo"}
        </h1>

        <p>
          {message}
        </p>

        {status ===
          "ok" && (
          <a
            className="auth-button"
            href={
              String(
                typeof window !==
                  "undefined"
                  ? window
                      .location
                      .pathname
                  : ""
              )
                ? "/mi-alquiler"
                : "/mi-alquiler"
            }
          >
            Ir a Mi alquiler
          </a>
        )}

        {status ===
          "error" && (
          <a
            className="auth-button"
            href="/"
          >
            Volver a Verlo
          </a>
        )}
      </section>
    </main>
  )
}
