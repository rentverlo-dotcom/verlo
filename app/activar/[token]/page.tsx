"use client"

import {
  useEffect,
  useState,
} from "react"
import {
  useParams,
} from "next/navigation"
import VerloBrand from "@/components/VerloBrand"
import PushSubscribeButton from "@/components/PushSubscribeButton"

type Role =
  | "tenant"
  | "owner"

type ActivationData = {
  leadId: string
  role: Role
}

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
  .activation-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --blue: #74bedc;
    --yellow: #e7c776;

    min-height: 100vh;
    background:
      radial-gradient(
        circle at 84% 10%,
        rgba(242, 168, 169, 0.48),
        transparent 28%
      ),
      radial-gradient(
        circle at 10% 48%,
        rgba(195, 121, 134, 0.16),
        transparent 26%
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

  .activation-root * {
    box-sizing: border-box;
  }

  .container {
    width:
      min(
        1160px,
        calc(100% - 40px)
      );

    margin:
      0 auto;
  }

  .nav {
    position: sticky;
    top: 0;
    z-index: 50;

    backdrop-filter:
      blur(18px);

    background:
      rgba(
        242,
        235,
        236,
        0.84
      );

    border-bottom:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );
  }

  .nav-inner {
    height: 76px;

    display:
      flex;

    align-items:
      center;

    justify-content:
      space-between;

    gap:
      24px;
  }

  .nav-pill {
    padding:
      9px 12px;

    border-radius:
      999px;

    background:
      rgba(
        255,
        255,
        255,
        0.58
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    color:
      rgba(
        5,
        0,
        2,
        0.64
      );

    font-size:
      13px;

    font-weight:
      850;
  }

  .activation-main {
    min-height:
      calc(
        100vh - 76px
      );

    display:
      grid;

    place-items:
      center;

    padding:
      64px 0 86px;
  }

  .activation-grid {
    display:
      grid;

    grid-template-columns:
      0.9fr 1.1fr;

    gap:
      48px;

    align-items:
      center;
  }

  .activation-copy {
    max-width:
      580px;
  }

  .eyebrow {
    margin:
      0;

    color:
      var(--pink-dark);

    text-transform:
      uppercase;

    letter-spacing:
      0.14em;

    font-size:
      12px;

    font-weight:
      950;
  }

  .activation-title {
    margin:
      18px 0 0;

    font-size:
      clamp(
        48px,
        7vw,
        92px
      );

    line-height:
      0.9;

    letter-spacing:
      -0.075em;

    font-weight:
      950;
  }

  .activation-title em {
    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-weight:
      400;

    font-style:
      italic;

    letter-spacing:
      -0.035em;
  }

  .activation-description {
    margin:
      24px 0 0;

    max-width:
      540px;

    color:
      rgba(
        5,
        0,
        2,
        0.68
      );

    font-size:
      19px;

    line-height:
      1.5;

    font-weight:
      650;
  }

  .trust-row {
    display:
      flex;

    flex-wrap:
      wrap;

    gap:
      10px;

    margin-top:
      26px;
  }

  .trust-row span {
    padding:
      9px 12px;

    border-radius:
      999px;

    background:
      rgba(
        255,
        255,
        255,
        0.58
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    color:
      rgba(
        5,
        0,
        2,
        0.64
      );

    font-size:
      13px;

    font-weight:
      850;
  }

  .activation-card {
    padding:
      36px;

    border-radius:
      38px;

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
        0.09
      );

    box-shadow:
      0 28px 80px
      rgba(
        5,
        0,
        2,
        0.10
      );
  }

  .activation-card-label {
    display:
      inline-flex;

    align-items:
      center;

    gap:
      8px;

    padding:
      8px 11px;

    border-radius:
      999px;

    background:
      rgba(
        242,
        168,
        169,
        0.28
      );

    color:
      rgba(
        5,
        0,
        2,
        0.74
      );

    font-size:
      12px;

    font-weight:
      950;
  }

  .activation-dot {
    width:
      8px;

    height:
      8px;

    border-radius:
      999px;

    background:
      var(--pink-dark);

    box-shadow:
      0 0 0 5px
      rgba(
        195,
        121,
        134,
        0.16
      );
  }

  .activation-card h2 {
    margin:
      22px 0 0;

    font-size:
      clamp(
        34px,
        4.6vw,
        54px
      );

    line-height:
      0.94;

    letter-spacing:
      -0.065em;

    font-weight:
      950;
  }

  .activation-card p {
    margin:
      16px 0 0;

    color:
      rgba(
        5,
        0,
        2,
        0.62
      );

    font-size:
      16px;

    line-height:
      1.5;

    font-weight:
      700;
  }

  .activation-actions {
    display:
      grid;

    gap:
      12px;

    margin-top:
      28px;
  }

  .push-wrap button,
  .install-button,
  .continue-button {
    width:
      100%;

    min-height:
      58px;

    padding:
      0 22px;

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
  }

  .push-wrap button,
  .continue-button {
    border:
      0;

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

  .push-wrap button:disabled {
    opacity:
      0.7;

    cursor:
      default;
  }

  .install-button {
    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.12
      );

    background:
      white;

    color:
      var(--black);
  }

  .install-button:disabled {
    opacity:
      0.55;

    cursor:
      default;
  }

  .continue-button {
    display:
      inline-flex;

    align-items:
      center;

    justify-content:
      center;

    text-decoration:
      none;
  }

  .device-note {
    margin-top:
      18px !important;

    padding:
      16px;

    border-radius:
      22px;

    background:
      rgba(
        242,
        168,
        169,
        0.14
      );

    color:
      rgba(
        5,
        0,
        2,
        0.68
      ) !important;

    font-size:
      13px !important;

    line-height:
      1.45 !important;

    font-weight:
      800 !important;
  }

  .loading-card,
  .error-card {
    max-width:
      620px;

    margin:
      0 auto;

    padding:
      38px;

    border-radius:
      38px;

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
        0.09
      );

    box-shadow:
      0 28px 80px
      rgba(
        5,
        0,
        2,
        0.10
      );

    text-align:
      center;
  }

  .loading-card h1,
  .error-card h1 {
    margin:
      0;

    font-size:
      42px;

    line-height:
      0.95;

    letter-spacing:
      -0.06em;
  }

  .loading-card p,
  .error-card p {
    margin:
      16px 0 0;

    color:
      rgba(
        5,
        0,
        2,
        0.62
      );

    line-height:
      1.5;

    font-weight:
      700;
  }

  @media (
    max-width: 900px
  ) {
    .activation-grid {
      grid-template-columns:
        1fr;
    }

    .activation-copy {
      max-width:
        760px;
    }
  }

  @media (
    max-width: 620px
  ) {
    .container {
      width:
        min(
          100% - 26px,
          1160px
        );
    }

    .nav-inner {
      height:
        68px;
    }

    .nav-pill {
      display:
        none;
    }

    .activation-main {
      min-height:
        calc(
          100vh - 68px
        );

      padding:
        44px 0 60px;
    }

    .activation-title {
      font-size:
        48px;
    }

    .activation-description {
      font-size:
        17px;
    }

    .activation-card {
      padding:
        26px 20px;

      border-radius:
        30px;
    }
  }
`

export default function ActivationPage() {
  const params =
    useParams<{
      token: string
    }>()

  const token =
    String(
      params?.token ||
        ""
    ).trim()

  const [
    activation,
    setActivation,
  ] =
    useState<ActivationData | null>(
      null
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState("")

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
      async function resolveToken() {
        if (
          !token
        ) {
          setError(
            "El enlace no es válido."
          )

          setLoading(
            false
          )

          return
        }

        try {
          const response =
            await fetch(
              `/api/activation-token?token=${encodeURIComponent(
                token
              )}`
            )

          const data =
            await response
              .json()
              .catch(
                () =>
                  null
              )

          if (
            !response.ok ||
            !data?.ok ||
            !data?.lead_id
          ) {
            throw new Error(
              "Este enlace ya no está disponible."
            )
          }

          if (
            data.role !==
              "tenant" &&
            data.role !==
              "owner"
          ) {
            throw new Error(
              "No pudimos identificar tu acceso."
            )
          }

          setActivation({
            leadId:
              String(
                data.lead_id
              ),

            role:
              data.role,
          })
        } catch (
          resolveError
        ) {
          console.error(
            resolveError
          )

          setError(
            resolveError instanceof
            Error
              ? resolveError.message
              : "No pudimos abrir este acceso."
          )
        } finally {
          setLoading(
            false
          )
        }
      }

      resolveToken()
    },
    [
      token,
    ]
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
        "En iPhone, tocá Compartir y después “Agregar a pantalla de inicio”. Luego abrí Verlo desde el ícono instalado."
      )

      return
    }

    window.alert(
      "Podés instalar Verlo desde el menú de tu navegador usando “Instalar Verlo” o “Instalar aplicación”."
    )
  }

  const description =
    activation?.role ===
    "owner"
      ? "Entrá a Verlo para seguir tu propiedad y recibir avisos cuando haya novedades o personas compatibles."
      : "Entrá a Verlo para seguir tu búsqueda y recibir avisos cuando aparezcan propiedades compatibles o tengas novedades."

  return (
    <main className="activation-root">
      <style>
        {styles}
      </style>

      <header className="nav">
        <div className="container nav-inner">
          <VerloBrand
            width={112}
          />

          <span className="nav-pill">
            Tu acceso a Verlo
          </span>
        </div>
      </header>

      <section className="activation-main">
        <div className="container">
          {loading ? (
            <div className="loading-card">
              <h1>
                Abriendo Verlo...
              </h1>

              <p>
                Estamos preparando tu acceso.
              </p>
            </div>
          ) : error ||
            !activation ? (
            <div className="error-card">
              <h1>
                No pudimos abrir este enlace
              </h1>

              <p>
                {error ||
                  "El acceso no es válido."}
              </p>
            </div>
          ) : (
            <div className="activation-grid">
              <div className="activation-copy">
                <p className="eyebrow">
                  Volvé a Verlo
                </p>

                <h1 className="activation-title">
                  Que no se te escape{" "}
                  <em>
                    ningún match.
                  </em>
                </h1>

                <p className="activation-description">
                  {description}
                </p>

                <div className="trust-row">
                  <span>
                    Matching gratis
                  </span>

                  <span>
                    Avisos directos
                  </span>

                  <span>
                    Sin comisión inmobiliaria
                  </span>
                </div>
              </div>

              <div className="activation-card">
                <div className="activation-card-label">
                  <span className="activation-dot" />

                  Activá este dispositivo
                </div>

                <h2>
                  Recibí los avisos de Verlo acá
                </h2>

                <p>
                  Activá las notificaciones en este dispositivo. Si usás Verlo también desde otro celular o computadora, podés activarlas ahí también.
                </p>

                <div className="activation-actions">
                  <div className="push-wrap">
                    <PushSubscribeButton
                      leadId={
                        activation.leadId
                      }
                      role={
                        activation.role
                      }
                    />
                  </div>

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

                  <a
                    href="/"
                    className="continue-button"
                  >
                    Seguir en Verlo
                  </a>
                </div>

                <p className="device-note">
                  Podés activar notificaciones en más de un dispositivo. Verlo va a asociarlos a tu mismo registro para avisarte donde estés usando la plataforma.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
