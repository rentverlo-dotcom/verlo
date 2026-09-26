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
    --green: #5bbf9a;
    --green-dark: #15745c;
    --white: #ffffff;

    min-height: 100vh;

    background:
      radial-gradient(
        circle at 14% 12%,
        rgba(242, 168, 169, 0.34),
        transparent 30%
      ),
      radial-gradient(
        circle at 86% 82%,
        rgba(116, 190, 220, 0.22),
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
    box-sizing:
      border-box;
  }

  .success-nav {
    min-height:
      72px;

    display:
      flex;

    align-items:
      center;

    border-bottom:
      1px solid
      rgba(
        5,
        0,
        2,
        0.07
      );

    background:
      rgba(
        242,
        235,
        236,
        0.76
      );

    backdrop-filter:
      blur(18px);

    position:
      sticky;

    top:
      0;

    z-index:
      20;
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
      36px;

    border-radius:
      36px;

    background:
      rgba(
        255,
        255,
        255,
        0.82
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.07
      );

    box-shadow:
      0 24px 70px
      rgba(
        5,
        0,
        2,
        0.08
      );

    backdrop-filter:
      blur(18px);
  }

  .success-top {
    text-align:
      center;
  }

  .success-icon {
    width:
      92px;

    height:
      92px;

    margin:
      0 auto;

    display:
      grid;

    place-items:
      center;

    border-radius:
      999px;

    background:
      linear-gradient(
        145deg,
        rgba(
          91,
          191,
          154,
          0.14
        ),
        rgba(
          116,
          190,
          220,
          0.20
        )
      );

    border:
      1px solid
      rgba(
        21,
        116,
        92,
        0.10
      );

    font-size:
      44px;

    font-weight:
      950;

    color:
      var(--green-dark);
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

    margin:
      22px auto 0;

    padding:
      8px 13px;

    border-radius:
      999px;

    background:
      rgba(
        242,
        168,
        169,
        0.20
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
      14px 0 0;

    font-size:
      clamp(
        46px,
        8vw,
        72px
      );

    line-height:
      0.94;

    letter-spacing:
      -0.065em;

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
      520px;

    margin:
      16px auto 0;

    color:
      rgba(
        5,
        0,
        2,
        0.60
      );

    font-size:
      17px;

    line-height:
      1.45;

    font-weight:
      700;
  }

  .success-role-note {
    max-width:
      520px;

    margin:
      10px auto 0;

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
      1.4;

    font-weight:
      700;
  }

  .actions-title {
    margin:
      34px 0 14px;

    text-align:
      center;

    font-size:
      18px;

    font-weight:
      950;

    letter-spacing:
      -0.02em;
  }

  .actions {
    display:
      grid;

    gap:
      14px;
  }

  .action-card {
    position:
      relative;

    overflow:
      hidden;

    display:
      grid;

    grid-template-columns:
      58px 1fr;

    gap:
      16px;

    align-items:
      center;

    padding:
      18px;

    border-radius:
      26px;

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.06
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
          0.17
        ),
        rgba(
          255,
          255,
          255,
          0.80
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
          0.16
        ),
        rgba(
          255,
          255,
          255,
          0.80
        )
      );
  }

  .action-card.access {
    background:
      linear-gradient(
        135deg,
        rgba(
          91,
          191,
          154,
          0.16
        ),
        rgba(
          255,
          255,
          255,
          0.80
        )
      );
  }

  .action-icon {
    width:
      58px;

    height:
      58px;

    display:
      grid;

    place-items:
      center;

    border-radius:
      18px;

    font-size:
      27px;

    font-weight:
      950;
  }

  .notifications .action-icon {
    background:
      rgba(
        242,
        168,
        169,
        0.25
      );

    color:
      #bc4352;
  }

  .install .action-icon {
    background:
      rgba(
        116,
        190,
        220,
        0.23
      );

    color:
      #2f7193;
  }

  .access .action-icon {
    background:
      rgba(
        91,
        191,
        154,
        0.20
      );

    color:
      var(--green-dark);
  }

  .action-content h2 {
    margin:
      0;

    font-size:
      18px;

    line-height:
      1.05;

    font-weight:
      950;

    letter-spacing:
      -0.025em;
  }

  .notifications .action-content h2 {
    color:
      #b23a49;
  }

  .install .action-content h2 {
    color:
      #225f82;
  }

  .access .action-content h2 {
    color:
      var(--green-dark);
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
      700;
  }

  .action-control {
    grid-column:
      1 /
      -1;

    margin-top:
      4px;
  }

  .push-wrap button,
  .action-button {
    width:
      100%;

    min-height:
      54px;

    padding:
      0 20px;

    border-radius:
      999px;

    font-family:
      inherit;

    font-size:
      14px;

    font-weight:
      950;

    cursor:
      pointer;

    transition:
      transform 160ms ease,
      opacity 160ms ease,
      box-shadow 160ms ease;
  }

  .push-wrap button {
    border:
      1px solid
      #b23a49;

    background:
      #b23a49;

    color:
      white;
  }

  .install-button {
    border:
      1px solid
      #225f82;

    background:
      #225f82;

    color:
      white;
  }

  .access-button {
    border:
      1px solid
      var(--green-dark);

    background:
      var(--green-dark);

    color:
      white;
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
        0.10
      );
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
      10px 0 0;

    padding:
      11px 13px;

    border-radius:
      14px;

    font-size:
      12px;

    line-height:
      1.4;

    font-weight:
      800;
  }

  .message.ok {
    background:
      rgba(
        91,
        191,
        154,
        0.14
      );

    color:
      var(--green-dark);
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
    display:
      flex;

    gap:
      10px;

    align-items:
      flex-start;

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
  }

  .important-note-icon {
    flex:
      0 0 auto;

    width:
      22px;

    height:
      22px;

    display:
      grid;

    place-items:
      center;

    border-radius:
      999px;

    background:
      rgba(
        5,
        0,
        2,
        0.08
      );

    color:
      var(--black);

    font-size:
      12px;

    font-weight:
      950;
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
        22px 0 36px;
    }

    .success-card {
      padding:
        26px 16px;

      border-radius:
        28px;
    }

    .success-icon {
      width:
        78px;

      height:
        78px;

      font-size:
        38px;
    }

    .success-title {
      font-size:
        clamp(
          42px,
          14vw,
          60px
        );
    }

    .success-copy {
      font-size:
        15px;
    }

    .actions-title {
      margin-top:
        28px;
    }

    .action-card {
      grid-template-columns:
        50px 1fr;

      gap:
        13px;

      padding:
        15px;

      border-radius:
        22px;
    }

    .action-icon {
      width:
        50px;

      height:
        50px;

      border-radius:
        16px;

      font-size:
        23px;
    }

    .action-content h2 {
      font-size:
        17px;
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

  const roleCopy =
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

              <div className="success-top">
                <div className="success-icon">
                  ✓
                </div>

                <div className="success-badge">
                  Todo listo
                </div>

                <h1 className="success-title">
                  ¡Listo!
                </h1>

                <p className="success-copy">
                  Ahora hacé estos 3 pasos para no perderte tus coincidencias.
                </p>

                <p className="success-role-note">
                  {roleCopy}
                </p>
              </div>

              <h2 className="actions-title">
                Dejá tu Verlo listo ahora
              </h2>

              <div className="actions">

                <article className="action-card notifications">
                  <div className="action-icon">
                    🔔
                  </div>

                  <div className="action-content">
                    <h2>
                      ACTIVÁ LAS NOTIFICACIONES
                    </h2>

                    <p>
                      Te avisamos cuando aparezcan nuevos matches o tengas algo pendiente.
                    </p>
                  </div>

                  <div className="action-control">
                    {iosNeedsInstall ? (
                      <>
                        <button
                          type="button"
                          className="action-button install-button"
                          onClick={
                            installApp
                          }
                        >
                          PRIMERO INSTALÁ VERLO EN IPHONE
                        </button>

                        <p className="message error">
                          En iPhone primero agregá Verlo a Inicio y después abrilo desde el ícono para activar notificaciones.
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
                  <div className="action-icon">
                    ↓
                  </div>

                  <div className="action-content">
                    <h2>
                      DESCARGÁ ACCESO DIRECTO
                    </h2>

                    <p>
                      Tené Verlo siempre a mano desde el ícono de tu dispositivo.
                    </p>
                  </div>

                  <div className="action-control">
                    <button
                      type="button"
                      className="action-button install-button"
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
                  <div className="action-icon">
                   ⌂
                  </div>

                  <div className="action-content">
                    <h2>
                      ENTRÁ YA A MI VERLO
                    </h2>

                    <p>
                      Pedí tu acceso seguro y entrá a tu espacio personal.
                    </p>
                  </div>

                  <div className="action-control">
                    <button
                      type="button"
                      className="action-button access-button"
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
                <div className="important-note-icon">
                  i
                </div>

                <div>
                  Si no activás las notificaciones, podés perderte nuevos matches o acciones importantes.
                </div>
              </div>

            </section>
          </div>
        </main>
      </div>
    </>
  )
}
