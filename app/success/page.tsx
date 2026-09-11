"use client"

import {
  useEffect,
  useState,
} from "react"
import { useSearchParams } from "next/navigation"
import VerloBrand from "@/components/VerloBrand"
import PushSubscribeButton from "@/components/PushSubscribeButton"

type Role =
  | "tenant"
  | "owner"

type BeforeInstallPromptEvent =
  Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{
      outcome:
        | "accepted"
        | "dismissed"
      platform: string
    }>
  }

const styles = `
  .success-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --blue: #74bedc;
    --yellow: #e7c776;

    min-height: 100vh;
    background:
      radial-gradient(
        circle at 18% 15%,
        rgba(242, 168, 169, 0.42),
        transparent 32%
      ),
      radial-gradient(
        circle at 82% 82%,
        rgba(116, 190, 220, 0.28),
        transparent 30%
      ),
      var(--soft);

    color: var(--black);

    font-family:
      Inter,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;

    overflow: hidden;
    position: relative;
  }

  .success-root * {
    box-sizing: border-box;
  }

  .success-nav {
    height: 76px;
    display: flex;
    align-items: center;
    border-bottom:
      1px solid
      rgba(5, 0, 2, 0.08);

    background:
      rgba(242, 235, 236, 0.72);

    backdrop-filter:
      blur(18px);
  }

  .success-container {
    width:
      min(
        920px,
        calc(100% - 40px)
      );

    margin:
      0 auto;
  }

  .success-main {
    min-height:
      calc(100vh - 76px);

    display:
      flex;

    align-items:
      center;

    justify-content:
      center;

    padding:
      64px 0 86px;

    position:
      relative;

    z-index:
      2;
  }

  .success-card {
    width:
      100%;

    max-width:
      720px;

    padding:
      56px;

    border-radius:
      42px;

    background:
      rgba(
        255,
        255,
        255,
        0.76
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    box-shadow:
      0 28px 90px
      rgba(
        5,
        0,
        2,
        0.10
      );

    backdrop-filter:
      blur(18px);

    text-align:
      center;

    position:
      relative;

    overflow:
      hidden;
  }

  .success-badge {
    display:
      inline-flex;

    align-items:
      center;

    justify-content:
      center;

    padding:
      9px 14px;

    border-radius:
      999px;

    background:
      rgba(
        242,
        168,
        169,
        0.24
      );

    color:
      var(--pink-dark);

    font-size:
      12px;

    font-weight:
      950;

    letter-spacing:
      0.12em;

    text-transform:
      uppercase;

    margin-bottom:
      24px;
  }

  .success-icon {
    width:
      90px;

    height:
      90px;

    border-radius:
      999px;

    display:
      grid;

    place-items:
      center;

    margin:
      0 auto 28px;

    background:
      var(--black);

    color:
      white;

    font-size:
      40px;

    box-shadow:
      0 18px 48px
      rgba(
        5,
        0,
        2,
        0.18
      );
  }

  .success-title {
    margin:
      0;

    font-size:
      clamp(
        46px,
        7vw,
        76px
      );

    line-height:
      0.94;

    letter-spacing:
      -0.07em;

    font-weight:
      950;
  }

  .success-title em {
    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-style:
      italic;

    font-weight:
      400;

    letter-spacing:
      -0.04em;
  }

  .success-copy {
    max-width:
      520px;

    margin:
      24px auto 0;

    color:
      rgba(
        5,
        0,
        2,
        0.66
      );

    font-size:
      18px;

    line-height:
      1.55;

    font-weight:
      650;
  }

  .success-actions {
    display:
      grid;

    gap:
      12px;

    max-width:
      430px;

    margin:
      34px auto 0;
  }

  .push-wrap button,
  .install-button {
    width:
      100%;

    min-height:
      58px;

    padding:
      0 24px;

    border-radius:
      999px;

    font-family:
      inherit;

    font-size:
      16px;

    font-weight:
      950;

    cursor:
      pointer;

    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      background 160ms ease;
  }

  .push-wrap button {
    border:
      1px solid
      var(--black);

    background:
      var(--black);

    color:
      white;

    box-shadow:
      0 18px 45px
      rgba(
        5,
        0,
        2,
        0.18
      );
  }

  .push-wrap button:not(:disabled):hover,
  .install-button:hover {
    transform:
      translateY(-2px);
  }

  .push-wrap button:disabled {
    cursor:
      default;

    opacity:
      0.76;
  }

  .install-button {
    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.14
      );

    background:
      rgba(
        255,
        255,
        255,
        0.88
      );

    color:
      var(--black);
  }

  .install-button:disabled {
    opacity:
      0.52;

    cursor:
      default;
  }

  .success-help {
    margin:
      18px auto 0;

    max-width:
      430px;

    color:
      rgba(
        5,
        0,
        2,
        0.48
      );

    font-size:
      13px;

    line-height:
      1.45;

    font-weight:
      700;
  }

  .confetti {
    position:
      fixed;

    top:
      -40px;

    width:
      12px;

    height:
      20px;

    border-radius:
      3px;

    z-index:
      1;

    pointer-events:
      none;

    animation:
      confetti-fall
      linear
      forwards;
  }

  @keyframes confetti-fall {
    0% {
      transform:
        translate3d(
          0,
          -10vh,
          0
        )
        rotate(0deg);

      opacity:
        1;
    }

    100% {
      transform:
        translate3d(
          var(--drift),
          115vh,
          0
        )
        rotate(760deg);

      opacity:
        0.12;
    }
  }

  @media (
    max-width: 620px
  ) {
    .success-nav {
      height:
        66px;
    }

    .success-container {
      width:
        min(
          100% - 28px,
          920px
        );
    }

    .success-main {
      min-height:
        calc(
          100vh - 66px
        );

      padding:
        38px 0 56px;
    }

    .success-card {
      padding:
        38px 22px;

      border-radius:
        32px;
    }

    .success-icon {
      width:
        78px;

      height:
        78px;

      font-size:
        34px;
    }

    .success-copy {
      font-size:
        16px;
    }
  }
`

export default function SuccessPage() {
  const searchParams =
    useSearchParams()

  const rawRole =
    searchParams.get(
      "role"
    )

  const leadId =
    searchParams.get(
      "lead"
    ) || ""

  const role: Role =
    rawRole ===
    "owner"
      ? "owner"
      : "tenant"

  const [
    installPrompt,
    setInstallPrompt,
  ] =
    useState<BeforeInstallPromptEvent | null>(
      null
    )

  const [
    installed,
    setInstalled,
  ] =
    useState(false)

  const [
    isIos,
    setIsIos,
  ] =
    useState(false)

  useEffect(
    () => {
      const standalone =
        window.matchMedia(
          "(display-mode: standalone)"
        ).matches

      const navigatorStandalone =
        (
          window.navigator as Navigator & {
            standalone?: boolean
          }
        ).standalone === true

      if (
        standalone ||
        navigatorStandalone
      ) {
        setInstalled(
          true
        )
      }

      const ua =
        window.navigator
          .userAgent
          .toLowerCase()

      setIsIos(
        /iphone|ipad|ipod/.test(
          ua
        )
      )

      function handleBeforeInstallPrompt(
        event: Event
      ) {
        event.preventDefault()

        setInstallPrompt(
          event as BeforeInstallPromptEvent
        )
      }

      function handleInstalled() {
        setInstalled(
          true
        )

        setInstallPrompt(
          null
        )
      }

      window.addEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )

      window.addEventListener(
        "appinstalled",
        handleInstalled
      )

      return () => {
        window.removeEventListener(
          "beforeinstallprompt",
          handleBeforeInstallPrompt
        )

        window.removeEventListener(
          "appinstalled",
          handleInstalled
        )
      }
    },
    []
  )

  useEffect(
    () => {
      const colors = [
        "#f2a8a9",
        "#c37986",
        "#050002",
        "#74bedc",
        "#e7c776",
      ]

      const pieces =
        Array.from(
          {
            length:
              42,
          }
        )

      const nodes =
        pieces.map(
          (_, index) => {
            const element =
              document.createElement(
                "span"
              )

            element.className =
              "confetti"

            element.style.left =
              `${
                Math.random() *
                100
              }vw`

            element.style.background =
              colors[
                index %
                  colors.length
              ]

            element.style.animationDuration =
              `${
                2.8 +
                Math.random() *
                  2.4
              }s`

            element.style.animationDelay =
              `${
                Math.random() *
                0.8
              }s`

            element.style.setProperty(
              "--drift",
              `${
                -120 +
                Math.random() *
                  240
              }px`
            )

            document.body.appendChild(
              element
            )

            return element
          }
        )

      const timeout =
        window.setTimeout(
          () => {
            nodes.forEach(
              (node) =>
                node.remove()
            )
          },
          6500
        )

      return () => {
        window.clearTimeout(
          timeout
        )

        nodes.forEach(
          (node) =>
            node.remove()
        )
      }
    },
    []
  )

  async function installApp() {
    if (
      installed
    ) {
      return
    }

    if (
      installPrompt
    ) {
      await installPrompt.prompt()

      const choice =
        await installPrompt.userChoice

      if (
        choice.outcome ===
        "accepted"
      ) {
        setInstalled(
          true
        )
      }

      setInstallPrompt(
        null
      )

      return
    }

    if (
      isIos
    ) {
      window.alert(
        "En iPhone: tocá Compartir y después “Agregar a pantalla de inicio”."
      )

      return
    }

    window.alert(
      "Podés instalar Verlo desde el menú de tu navegador usando la opción “Instalar Verlo” o “Instalar aplicación”."
    )
  }

  const copy =
    role ===
    "owner"
      ? "Recibimos los datos de tu propiedad. Activá las notificaciones para enterarte cuando aparezcan interesados compatibles."
      : "Guardamos tu búsqueda. Activá las notificaciones para enterarte apenas aparezca una propiedad compatible."

  return (
    <>
      <style>
        {styles}
      </style>

      <div className="success-root">
        <header className="success-nav">
          <div className="success-container">
            <VerloBrand />
          </div>
        </header>

        <main className="success-main">
          <div className="success-container">
            <section className="success-card">
              <div className="success-badge">
                Todo listo
              </div>

              <div
                className="success-icon"
                aria-hidden="true"
              >
                ✓
              </div>

              <h1 className="success-title">
                Ya estás en{" "}
                <em>
                  Verlo
                </em>
              </h1>

              <p className="success-copy">
                {copy}
              </p>

              <div className="success-actions">
                {leadId ? (
                  <div className="push-wrap">
                    <PushSubscribeButton
                      leadId={
                        leadId
                      }
                      role={
                        role
                      }
                    />
                  </div>
                ) : null}

                <button
                  type="button"
                  className="install-button"
                  onClick={
                    installApp
                  }
                  disabled={
                    installed
                  }
                >
                  {installed
                    ? "Verlo ya está instalado"
                    : "Instalar Verlo"}
                </button>
              </div>

              <p className="success-help">
                Las notificaciones te avisan
                solamente cuando haya novedades
                importantes sobre tu búsqueda o
                propiedad.
              </p>
            </section>
          </div>
        </main>
      </div>
    </>
  )
}
