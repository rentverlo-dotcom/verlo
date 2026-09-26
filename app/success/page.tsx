"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useSearchParams,
} from "next/navigation"

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

const PWA_RESUME_URL_STORAGE_KEY =
  "verlo_pwa_resume_url"

const styles = `
  .success-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --blue: #74bedc;
    --yellow: #e7c776;
    --white: #ffffff;

    min-height: 100vh;

    background:
      radial-gradient(
        circle at 16% 14%,
        rgba(242, 168, 169, 0.42),
        transparent 32%
      ),
      radial-gradient(
        circle at 84% 84%,
        rgba(116, 190, 220, 0.28),
        transparent 30%
      ),
      var(--soft);

    color:
      var(--black);

    font-family:
      Inter,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .success-root * {
    box-sizing: border-box;
  }

  .success-nav {
    min-height: 72px;

    display: flex;
    align-items: center;

    border-bottom:
      1px solid
      rgba(5, 0, 2, 0.08);

    background:
      rgba(242, 235, 236, 0.80);

    backdrop-filter:
      blur(18px);

    position: sticky;
    top: 0;

    z-index: 20;
  }

  .success-container {
    width:
      min(
        760px,
        calc(100% - 32px)
      );

    margin:
      0 auto;
  }

  .success-main {
    padding:
      34px 0 56px;
  }

  .success-card {
    width:
      100%;

    padding:
      42px;

    border-radius:
      38px;

    background:
      rgba(
        255,
        255,
        255,
        0.80
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
  }

  .hero {
    text-align:
      center;
  }

  .success-badge {
    width:
      fit-content;

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
      11px;

    font-weight:
      950;

    letter-spacing:
      0.12em;

    text-transform:
      uppercase;
  }

  .success-title {
    margin:
      18px 0 0;

    font-size:
      clamp(
        42px,
        8vw,
        70px
      );

    line-height:
      0.95;

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
  }

  .success-copy {
    max-width:
      560px;

    margin:
      18px auto 0;

    color:
      rgba(
        5,
        0,
        2,
        0.62
      );

    font-size:
      17px;

    line-height:
      1.48;

    font-weight:
      650;
  }

  .success-status {
    max-width:
      560px;

    margin:
      8px auto 0;

    color:
      rgba(
        5,
        0,
        2,
        0.46
      );

    font-size:
      13px;

    line-height:
      1.4;

    font-weight:
      750;
  }

  .actions-heading {
    margin:
      34px 0 16px;

    text-align:
      center;

    font-size:
      18px;

    font-weight:
      950;

    letter-spacing:
      -0.03em;
  }

  .actions {
    display:
      grid;

    gap:
      14px;
  }

  .action-card {
    padding:
      20px;

    border-radius:
      28px;

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.07
      );
  }

  .action-card.notifications {
    background:
      linear-gradient(
        135deg,
        rgba(
          242,
          168,
          169,
          0.22
        ),
        rgba(
          255,
          255,
          255,
          0.86
        )
      );
  }

  .action-card.install {
    background:
      linear-gradient(
        135deg,
        rgba(
          116,
          190,
          220,
          0.20
        ),
        rgba(
          255,
          255,
          255,
          0.86
        )
      );
  }

  .action-card.access {
    background:
      linear-gradient(
        135deg,
        rgba(
          231,
          199,
          118,
          0.20
        ),
        rgba(
          255,
          255,
          255,
          0.86
        )
      );
  }

  .action-top {
    display:
      grid;

    grid-template-columns:
      54px 1fr;

    gap:
      14px;

    align-items:
      center;
  }

  .action-icon {
    width:
      54px;

    height:
      54px;

    display:
      grid;

    place-items:
      center;

    border-radius:
      18px;

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    background:
      rgba(
        255,
        255,
        255,
        0.72
      );

    color:
      var(--black);
  }

  .action-icon svg {
    width:
      25px;

    height:
      25px;

    stroke:
      currentColor;

    stroke-width:
      2;

    fill:
      none;

    stroke-linecap:
      round;

    stroke-linejoin:
      round;
  }

  .action-content h2 {
    margin:
      0;

    font-size:
      18px;

    line-height:
      1.08;

    font-weight:
      950;

    letter-spacing:
      -0.025em;

    color:
      var(--black);
  }

  .action-content p {
    margin:
      6px 0 0;

    color:
      rgba(
        5,
        0,
        2,
        0.56
      );

    font-size:
      13px;

    line-height:
      1.4;

    font-weight:
      650;
  }

  .action-control {
    margin-top:
      16px;
  }

  .push-wrap button,
  .action-button {
    width:
      100%;

    min-height:
      54px;

    padding:
      0 22px;

    border-radius:
      999px;

    border:
      1px solid
      var(--black);

    background:
      var(--black);

    color:
      white;

    font-family:
      inherit;

    font-size:
      14px;

    font-weight:
      950;

    letter-spacing:
      -0.01em;

    cursor:
      pointer;

    transition:
      transform 160ms ease,
      opacity 160ms ease,
      box-shadow 160ms ease;
  }

  .push-wrap button:not(:disabled):hover,
  .action-button:not(:disabled):hover {
    transform:
      translateY(-2px);

    box-shadow:
      0 10px 28px
      rgba(
        5,
        0,
        2,
        0.14
      );
  }

  .push-wrap button:disabled,
  .action-button:disabled {
    opacity:
      0.48;

    cursor:
      default;
  }

  .secondary-button {
    background:
      white;

    color:
      var(--black);
  }

  .message {
    margin:
      11px 0 0;

    padding:
      12px 14px;

    border-radius:
      16px;

    font-size:
      12px;

    line-height:
      1.45;

    font-weight:
      800;
  }

  .message.ok {
    background:
      rgba(
        116,
        190,
        220,
        0.16
      );

    color:
      #255a6d;
  }

  .message.error {
    background:
      rgba(
        195,
        121,
        134,
        0.14
      );

    color:
      #7f2435;
  }

  .important-note {
    margin:
      18px 0 0;

    padding:
      14px 16px;

    border-radius:
      18px;

    background:
      rgba(
        5,
        0,
        2,
        0.045
      );

    color:
      rgba(
        5,
        0,
        2,
        0.56
      );

    font-size:
      12px;

    line-height:
      1.45;

    font-weight:
      750;

    text-align:
      center;
  }

  @media (
    max-width: 620px
  ) {
    .success-nav {
      min-height:
        64px;
    }

    .success-container {
      width:
        calc(
          100% - 24px
        );
    }

    .success-main {
      padding:
        20px 0 34px;
    }

    .success-card {
      padding:
        28px 16px;

      border-radius:
        30px;
    }

    .success-title {
      font-size:
        clamp(
          42px,
          13vw,
          58px
        );
    }

    .success-copy {
      font-size:
        15px;
    }

    .actions-heading {
      margin-top:
        28px;
    }

    .action-card {
      padding:
        16px;

      border-radius:
        24px;
    }

    .action-top {
      grid-template-columns:
        48px 1fr;

      gap:
        12px;
    }

    .action-icon {
      width:
        48px;

      height:
        48px;

      border-radius:
        15px;
    }

    .action-icon svg {
      width:
        22px;

      height:
        22px;
    }

    .action-content h2 {
      font-size:
        16px;
    }

    .action-content p {
      font-size:
        12px;
    }

    .push-wrap button,
    .action-button {
      min-height:
        52px;

      font-size:
        13px;
    }
  }
`

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  )
}

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
    useState(
      false
    )

  const [
    isIos,
    setIsIos,
  ] =
    useState(
      false
    )

  const [
    deviceChecked,
    setDeviceChecked,
  ] =
    useState(
      false
    )

  const [
    magicLoading,
    setMagicLoading,
  ] =
    useState(
      false
    )

  const [
    magicMessage,
    setMagicMessage,
  ] =
    useState<string | null>(
      null
    )

  const [
    magicError,
    setMagicError,
  ] =
    useState<string | null>(
      null
    )

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
        ).standalone ===
        true

      const isStandalone =
        standalone ||
        navigatorStandalone

      if (
        isStandalone
      ) {
        setInstalled(
          true
        )
      }

      const ua =
        window.navigator
          .userAgent
          .toLowerCase()

      const platform =
        window.navigator
          .platform ||
        ""

      const maxTouchPoints =
        window.navigator
          .maxTouchPoints ||
        0

      const appleMobile =
        /iphone|ipad|ipod/.test(
          ua
        ) ||
        (
          platform ===
            "MacIntel" &&
          maxTouchPoints >
            1
        )

      setIsIos(
        appleMobile
      )

      setDeviceChecked(
        true
      )

      try {
        if (
          leadId &&
          appleMobile &&
          !isStandalone
        ) {
          window.localStorage.setItem(
            PWA_RESUME_URL_STORAGE_KEY,
            `${window.location.pathname}${window.location.search}`
          )
        }
      } catch (
        error
      ) {
        console.error(
          "success storage error:",
          error
        )
      }

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
    [
      leadId,
      role,
    ]
  )

  async function sendMagicLink() {
    if (
      !leadId ||
      magicLoading
    ) {
      return
    }

    setMagicLoading(
      true
    )

    setMagicMessage(
      null
    )

    setMagicError(
      null
    )

    try {
      const response =
        await fetch(
          "/api/auth/activate-lead",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                lead_id:
                  leadId,
              }),
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
        throw new Error(
          result?.error ||
            "No pudimos enviar el acceso."
        )
      }

      setMagicMessage(
        `Te enviamos el acceso a ${result.email}. Revisá también Spam o Correo no deseado.`
      )
    } catch (
      error
    ) {
      setMagicError(
        error instanceof
          Error
          ? error.message
          : "No pudimos enviar el acceso."
      )
    } finally {
      setMagicLoading(
        false
      )
    }
  }

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
        await installPrompt
          .userChoice

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
        "En iPhone o iPad: abrí verlo.lat en Safari. Tocá Compartir → Agregar a Inicio → activá “Abrir como app web” → Agregar. Después abrí Verlo desde el nuevo ícono."
      )

      return
    }

    window.alert(
      "Podés instalar Verlo desde el menú de tu navegador usando la opción “Instalar Verlo” o “Instalar aplicación”."
    )
  }

  const statusCopy =
    role ===
    "owner"
      ? "Tu propiedad ya quedó cargada."
      : "Tu búsqueda ya quedó guardada."

  const iosNeedsInstall =
    deviceChecked &&
    isIos &&
    !installed

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

              <div className="hero">

                <div className="success-badge">
                  Todo listo
                </div>

                <h1 className="success-title">
                  Ya estás en{" "}
                  <em>
                    Verlo
                  </em>
                </h1>

                <p className="success-copy">
                  Hacé estos 3 pasos para no perderte ningún match.
                </p>

                <p className="success-status">
                  {statusCopy}
                </p>

              </div>

              <h2 className="actions-heading">
                Dejá tu acceso listo ahora
              </h2>

              <div className="actions">

                <article className="action-card notifications">

                  <div className="action-top">

                    <div className="action-icon">
                      <BellIcon />
                    </div>

                    <div className="action-content">
                      <h2>
                        ACTIVÁ LAS NOTIFICACIONES
                      </h2>

                      <p>
                        Te avisamos cuando aparezcan nuevos matches o tengas algo pendiente.
                      </p>
                    </div>

                  </div>

                  <div className="action-control">

                    {iosNeedsInstall ? (
                      <>
                        <button
                          type="button"
                          className="action-button"
                          onClick={
                            installApp
                          }
                        >
                          PRIMERO INSTALÁ VERLO
                        </button>

                        <p className="message error">
                          En iPhone primero agregá Verlo a Inicio. Después abrilo desde el ícono y activá las notificaciones.
                        </p>
                      </>
                    ) : leadId ? (
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
                    ) : (
                      <p className="message error">
                        No encontramos tu registro para activar las notificaciones.
                      </p>
                    )}

                  </div>

                </article>

                <article className="action-card install">

                  <div className="action-top">

                    <div className="action-icon">
                      <DownloadIcon />
                    </div>

                    <div className="action-content">
                      <h2>
                        DESCARGÁ ACCESO DIRECTO
                      </h2>

                      <p>
                        Tené Verlo siempre a mano desde el ícono de tu dispositivo.
                      </p>
                    </div>

                  </div>

                  <div className="action-control">

                    <button
                      type="button"
                      className="action-button secondary-button"
                      onClick={
                        installApp
                      }
                      disabled={
                        installed
                      }
                    >
                      {installed
                        ? "VERLO YA ESTÁ INSTALADO"
                        : isIos
                          ? "AGREGAR VERLO A INICIO"
                          : "INSTALAR VERLO"}
                    </button>

                  </div>

                </article>

                <article className="action-card access">

                  <div className="action-top">

                    <div className="action-icon">
                      <HomeIcon />
                    </div>

                    <div className="action-content">
                      <h2>
                        ENTRÁ YA A MI VERLO
                      </h2>

                      <p>
                        Pedí tu enlace seguro y entrá a tu espacio personal.
                      </p>
                    </div>

                  </div>

                  <div className="action-control">

                    <button
                      type="button"
                      className="action-button"
                      onClick={
                        sendMagicLink
                      }
                      disabled={
                        !leadId ||
                        magicLoading
                      }
                    >
                      {magicLoading
                        ? "ENVIANDO ACCESO..."
                        : "ENTRAR A MI VERLO"}
                    </button>

                    {magicMessage && (
                      <p className="message ok">
                        {magicMessage}
                      </p>
                    )}

                    {magicError && (
                      <p className="message error">
                        {magicError}
                      </p>
                    )}

                  </div>

                </article>

              </div>

              <div className="important-note">
                Activá las notificaciones para que Verlo pueda avisarte cuando aparezca una nueva coincidencia.
              </div>

            </section>

          </div>
        </main>

      </div>
    </>
  )
}
