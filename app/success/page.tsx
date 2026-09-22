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
      54px 0 80px;
  }

  .success-card {
    width:
      100%;

    max-width:
      760px;

    padding:
      52px;

    border-radius:
      42px;

    background:
      rgba(
        255,
        255,
        255,
        0.78
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
      12px;

    font-weight:
      950;

    letter-spacing:
      0.12em;

    text-transform:
      uppercase;

    margin-bottom:
      22px;
  }

  .success-title {
    margin:
      0;

    font-size:
      clamp(
        42px,
        7vw,
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
      580px;

    margin:
      20px 0 0;

    color:
      rgba(
        5,
        0,
        2,
        0.64
      );

    font-size:
      17px;

    line-height:
      1.5;

    font-weight:
      650;
  }

  .steps-title {
    margin:
      38px 0 18px;

    font-size:
      22px;

    font-weight:
      950;

    letter-spacing:
      -0.03em;
  }

  .steps {
    display:
      grid;

    gap:
      14px;
  }

  .step {
    display:
      grid;

    grid-template-columns:
      42px 1fr;

    gap:
      14px;

    padding:
      20px;

    border-radius:
      26px;

    background:
      rgba(
        255,
        255,
        255,
        0.72
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );
  }

  .step-number {
    width:
      42px;

    height:
      42px;

    border-radius:
      999px;

    display:
      grid;

    place-items:
      center;

    background:
      var(--black);

    color:
      white;

    font-size:
      15px;

    font-weight:
      950;
  }

  .step-content h2 {
    margin:
      2px 0 0;

    font-size:
      18px;

    font-weight:
      950;

    letter-spacing:
      -0.025em;
  }

  .step-content p {
    margin:
      7px 0 0;

    color:
      rgba(
        5,
        0,
        2,
        0.58
      );

    font-size:
      14px;

    line-height:
      1.5;

    font-weight:
      650;
  }

  .step-action {
    margin-top:
      16px;
  }

  .push-wrap button,
  .action-button {
    width:
      100%;

    min-height:
      56px;

    padding:
      0 22px;

    border-radius:
      999px;

    font-family:
      inherit;

    font-size:
      15px;

    font-weight:
      950;

    cursor:
      pointer;

    transition:
      transform 160ms ease,
      opacity 160ms ease;
  }

  .push-wrap button,
  .primary-button {
    border:
      1px solid
      var(--black);

    background:
      var(--black);

    color:
      white;
  }

  .secondary-button {
    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.14
      );

    background:
      white;

    color:
      var(--black);
  }

  .push-wrap button:not(:disabled):hover,
  .action-button:not(:disabled):hover {
    transform:
      translateY(-2px);
  }

  .push-wrap button:disabled,
  .action-button:disabled {
    opacity:
      0.55;

    cursor:
      default;
  }

  .message {
    margin:
      12px 0 0;

    padding:
      12px 14px;

    border-radius:
      16px;

    font-size:
      13px;

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
        34px 0 54px;
    }

    .success-card {
      padding:
        34px 20px;

      border-radius:
        32px;
    }

    .success-copy {
      font-size:
        16px;
    }

    .step {
      grid-template-columns:
        36px 1fr;

      padding:
        17px;
    }

    .step-number {
      width:
        36px;

      height:
        36px;
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

  const [
    deviceChecked,
    setDeviceChecked,
  ] =
    useState(false)

  const [
    magicLoading,
    setMagicLoading,
  ] =
    useState(false)

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
          .platform || ""

      const maxTouchPoints =
        window.navigator
          .maxTouchPoints || 0

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

  const copy =
    role ===
    "owner"
      ? "Recibimos los datos de tu propiedad. Ahora dejá preparado tu acceso para poder seguir todo desde Verlo."
      : "Guardamos tu búsqueda. Ahora dejá preparado tu acceso para poder seguir todo desde Verlo."

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
                {copy}
              </p>

              {iosNeedsInstall ? (
                <>
                  <h2 className="steps-title">
                    Seguí estos pasos en orden:
                  </h2>

                  <div className="steps">

                    <article className="step">
                      <div className="step-number">
                        1
                      </div>

                      <div className="step-content">
                        <h2>
                          Instalá Verlo
                        </h2>

                        <p>
                          En iPhone o iPad, abrí esta página en Safari.
                          Desde Safari agregá Verlo a Inicio como app web.
                          Recién después vas a poder activar notificaciones.
                        </p>

                        <div className="step-action">
                          <button
                            type="button"
                            className="action-button primary-button"
                            onClick={
                              installApp
                            }
                          >
                            CÓMO INSTALAR VERLO EN IPHONE
                          </button>
                        </div>
                      </div>
                    </article>

                    <article className="step">
                      <div className="step-number">
                        2
                      </div>

                      <div className="step-content">
                        <h2>
                          Abrí Verlo desde el ícono
                        </h2>

                        <p>
                          Después de agregar Verlo a la
                          pantalla de inicio, cerrá esta
                          pestaña y abrí Verlo tocando el
                          nuevo ícono. Vamos a traerte de
                          vuelta a este paso automáticamente.
                        </p>
                      </div>
                    </article>

                    <article className="step">
                      <div className="step-number">
                        3
                      </div>

                      <div className="step-content">
                        <h2>
                          Activá las notificaciones
                        </h2>

                        <p>
                          Una vez que abras Verlo desde el
                          ícono, vas a poder habilitar las
                          notificaciones para recibir matches
                          y acciones pendientes.
                        </p>
                      </div>
                    </article>

                    <article className="step">
                      <div className="step-number">
                        4
                      </div>

                      <div className="step-content">
                        <h2>
                          Entrá a Mi Verlo
                        </h2>

                        <p>
                          Después vas a poder pedir tu enlace
                          seguro de acceso a Mi Verlo.
                        </p>
                      </div>
                    </article>

                  </div>
                </>
              ) : (
                <>
                  <h2 className="steps-title">
                    Seguí estos 3 pasos en orden:
                  </h2>

                  <div className="steps">

                    <article className="step">
                      <div className="step-number">
                        1
                      </div>

                      <div className="step-content">
                        <h2>
                          Activá las notificaciones
                        </h2>

                        <p>
                          Te vamos a avisar cuando tengas
                          nuevos matches, cuando alguien quiera
                          avanzar con vos y cuando tengas una
                          acción pendiente.
                        </p>

                        <div className="step-action">
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
                          ) : (
                            <p className="message error">
                              No encontramos tu registro para
                              activar las notificaciones.
                            </p>
                          )}
                        </div>
                      </div>
                    </article>

                    <article className="step">
                      <div className="step-number">
                        2
                      </div>

                      <div className="step-content">
                        <h2>
                          Entrá a Mi Verlo
                        </h2>

                        <p>
                          Tocá el botón y revisá tu email.
                          Te va a llegar un enlace seguro para
                          entrar a tu espacio personal.
                          Revisá también Spam o Correo no deseado.
                        </p>

                        <div className="step-action">
                          <button
                            type="button"
                            className="action-button primary-button"
                            onClick={
                              sendMagicLink
                            }
                            disabled={
                              !leadId ||
                              magicLoading
                            }
                          >
                            {magicLoading
                              ? "Enviando acceso..."
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
                      </div>
                    </article>

                    <article className="step">
                      <div className="step-number">
                        3
                      </div>

                      <div className="step-content">
                        <h2>
                          Instalá Verlo en este dispositivo.
                        </h2>

                        <p>
                          Consejo: no ocupa prácticamente espacio
                          en tu memoria y vas a tener el ícono de
                          Verlo en tu pantalla para entrar y operar
                          más rápido.
                        </p>

                        <div className="step-action">
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
                              : "INSTALAR VERLO"}
                          </button>
                        </div>
                      </div>
                    </article>

                  </div>
                </>
              )}

            </section>
          </div>
        </main>
      </div>
    </>
  )
}
