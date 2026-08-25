"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import VerloBrand from "@/components/VerloBrand"

import {
  supabase,
} from "@/lib/supabase/client"

type RentalData = {
  ok: boolean

  user: {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    role:
      | "tenant"
      | "owner"
  }

  rental: {
    id: string
    status: string
    start_date: string | null
    end_date: string | null
    activated_at: string | null
  }

  contract: {
    id: string
    status: string
    monthly_price: number | null
    deposit: number | null
    start_date: string | null
    end_date: string | null
    adjustment_method: string | null
    content: string | null
    tenant_agreed_at: string | null
    owner_agreed_at: string | null
  }

  property: {
    street: string | null
    number: string | null
    floor: string | null
    unit: string | null
    city: string | null
    province: string | null
    country: string | null
    postal_code: string | null
  }

  counterpart: {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
  }
}

const styles = `
  .rental-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --paper: #fffaf8;

    min-height: 100vh;
    background:
      radial-gradient(
        circle at top right,
        rgba(242, 168, 169, 0.34),
        transparent 34%
      ),
      var(--paper);

    color: var(--black);
    font-family:
      Inter,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .rental-shell {
    width: min(
      1180px,
      calc(100% - 32px)
    );
    margin: 0 auto;
    padding: 28px 0 80px;
  }

  .rental-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .logout-button {
    border: 1px solid rgba(5, 0, 2, 0.12);
    background: rgba(255, 255, 255, 0.72);
    border-radius: 999px;
    min-height: 44px;
    padding: 0 18px;
    font-weight: 850;
    cursor: pointer;
    color: var(--black);
  }

  .hero {
    margin-top: 42px;
    display: grid;
    grid-template-columns:
      minmax(0, 1.5fr)
      minmax(260px, 0.7fr);
    gap: 20px;
  }

  .hero-main,
  .hero-status {
    border-radius: 34px;
    border:
      1px solid
      rgba(5, 0, 2, 0.08);
    box-shadow:
      0 24px 70px
      rgba(5, 0, 2, 0.06);
  }

  .hero-main {
    padding: 36px;
    background:
      rgba(
        255,
        255,
        255,
        0.82
      );
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0 13px;
    border-radius: 999px;
    background: var(--soft);
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .hero h1 {
    margin: 20px 0 0;
    font-family:
      Georgia,
      "Times New Roman",
      serif;
    font-style: italic;
    font-size:
      clamp(
        42px,
        6vw,
        78px
      );
    line-height: 0.96;
    letter-spacing: -0.055em;
    font-weight: 500;
  }

  .hero-copy {
    margin: 22px 0 0;
    max-width: 680px;
    color:
      rgba(
        5,
        0,
        2,
        0.64
      );
    font-size: 17px;
    line-height: 1.55;
  }

  .hero-status {
    padding: 30px;
    background: var(--black);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .status-label {
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    opacity: 0.58;
  }

  .status-main {
    margin-top: 28px;
    font-size: 32px;
    font-weight: 950;
    letter-spacing: -0.045em;
  }

  .status-dates {
    margin-top: 26px;
    color:
      rgba(
        255,
        255,
        255,
        0.68
      );
    line-height: 1.55;
    font-size: 14px;
  }

  .grid {
    margin-top: 20px;
    display: grid;
    grid-template-columns:
      repeat(
        12,
        minmax(0, 1fr)
      );
    gap: 20px;
  }

  .card {
    border-radius: 30px;
    border:
      1px solid
      rgba(5, 0, 2, 0.08);
    background:
      rgba(
        255,
        255,
        255,
        0.82
      );
    box-shadow:
      0 18px 55px
      rgba(5, 0, 2, 0.045);
    padding: 28px;
  }

  .card-large {
    grid-column: span 7;
  }

  .card-small {
    grid-column: span 5;
  }

  .card-full {
    grid-column: span 12;
  }

  .card-title {
    margin: 0;
    font-size: 13px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color:
      rgba(
        5,
        0,
        2,
        0.48
      );
  }

  .property-address {
    margin: 18px 0 0;
    font-size:
      clamp(
        28px,
        4vw,
        44px
      );
    line-height: 1.02;
    letter-spacing: -0.045em;
    font-weight: 950;
  }

  .property-location {
    margin-top: 12px;
    font-size: 16px;
    line-height: 1.5;
    color:
      rgba(
        5,
        0,
        2,
        0.58
      );
  }

  .amount {
    margin-top: 18px;
    font-size:
      clamp(
        34px,
        5vw,
        54px
      );
    letter-spacing: -0.055em;
    font-weight: 950;
  }

  .amount-caption {
    margin-top: 8px;
    color:
      rgba(
        5,
        0,
        2,
        0.56
      );
  }

  .facts {
    margin-top: 22px;
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
    gap: 12px;
  }

  .fact {
    padding: 16px;
    border-radius: 20px;
    background: var(--soft);
  }

  .fact-label {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 950;
    color:
      rgba(
        5,
        0,
        2,
        0.45
      );
  }

  .fact-value {
    display: block;
    margin-top: 7px;
    font-weight: 850;
    line-height: 1.35;
  }

  .actions {
    margin-top: 22px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .button {
    min-height: 50px;
    padding: 0 21px;
    border-radius: 999px;
    border: none;
    font-weight: 950;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }

  .button-primary {
    background: var(--black);
    color: white;
  }

  .button-secondary {
    background: var(--pink);
    color: var(--black);
  }

  .button-disabled {
    background: var(--soft);
    color:
      rgba(
        5,
        0,
        2,
        0.42
      );
    cursor: default;
  }

  .future-box {
    margin-top: 20px;
    padding: 22px;
    border-radius: 24px;
    background:
      linear-gradient(
        135deg,
        rgba(
          242,
          168,
          169,
          0.36
        ),
        rgba(
          242,
          235,
          236,
          0.82
        )
      );
  }

  .future-box strong {
    display: block;
    font-size: 18px;
  }

  .future-box p {
    margin: 8px 0 0;
    color:
      rgba(
        5,
        0,
        2,
        0.6
      );
    line-height: 1.5;
  }

  .loading,
  .error-state {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 28px;
    background: var(--paper);
  }

  .state-card {
    width: min(
      620px,
      100%
    );
    border-radius: 34px;
    padding: 36px;
    text-align: center;
    background: white;
    border:
      1px solid
      rgba(5, 0, 2, 0.08);
  }

  .state-card h1 {
    margin: 24px 0 0;
    font-size: 38px;
    letter-spacing: -0.05em;
  }

  .state-card p {
    color:
      rgba(
        5,
        0,
        2,
        0.62
      );
    line-height: 1.5;
  }

  @media (
    max-width: 820px
  ) {
    .hero {
      grid-template-columns: 1fr;
    }

    .card-large,
    .card-small,
    .card-full {
      grid-column: span 12;
    }

    .hero-main,
    .hero-status,
    .card {
      border-radius: 26px;
    }

    .hero-main {
      padding: 28px;
    }
  }

  @media (
    max-width: 560px
  ) {
    .rental-shell {
      width:
        min(
          100% - 22px,
          1180px
        );
      padding-top: 18px;
    }

    .facts {
      grid-template-columns:
        1fr;
    }

    .hero-main,
    .hero-status,
    .card {
      padding: 22px;
    }
  }
`

function formatDate(
  value:
    string | null
) {
  if (!value) {
    return "—"
  }

  const [
    year,
    month,
    day,
  ] =
    value.split("-")

  if (
    !year ||
    !month ||
    !day
  ) {
    return value
  }

  return `${day}/${month}/${year}`
}

function formatMoney(
  value:
    number | null
) {
  if (
    value === null ||
    !Number.isFinite(
      Number(value)
    )
  ) {
    return "A definir"
  }

  return new Intl.NumberFormat(
    "es-AR",
    {
      style:
        "currency",

      currency:
        "ARS",

      maximumFractionDigits:
        0,
    }
  ).format(
    Number(value)
  )
}

function clean(
  value:
    string | null
) {
  return String(
    value || ""
  ).trim()
}

export default function MyRentalPage() {
  const router =
    useRouter()

  const [
    data,
    setData,
  ] =
    useState<
      RentalData | null
    >(
      null
    )

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    )

  const [
    error,
    setError,
  ] =
    useState(
      ""
    )

  useEffect(() => {
    let cancelled =
      false

    async function load() {
      try {
        const {
          data:
            sessionData,
        } =
          await supabase
            .auth
            .getSession()

        const session =
          sessionData
            .session

        if (
          !session
        ) {
          router.replace(
            "/login"
          )

          return
        }

        const response =
          await fetch(
            "/api/my-rental",
            {
              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },

              cache:
                "no-store",
            }
          )

        const result =
          await response
            .json()
            .catch(
              () => ({})
            )

        if (
          cancelled
        ) {
          return
        }

        if (
          !response.ok ||
          !result?.ok
        ) {
          setError(
            result?.error ||
              "No pudimos cargar tu alquiler."
          )

          return
        }

        setData(
          result as RentalData
        )
      } catch (
        loadError
      ) {
        console.error(
          "mi-alquiler load error:",
          loadError
        )

        if (
          !cancelled
        ) {
          setError(
            "No pudimos cargar tu alquiler."
          )
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          )
        }
      }
    }

    load()

    return () => {
      cancelled =
        true
    }
  }, [
    router,
  ])

  const propertyAddress =
    useMemo(
      () => {
        if (
          !data
        ) {
          return ""
        }

        return [
          clean(
            data
              .property
              .street
          ),

          clean(
            data
              .property
              .number
          ),
        ]
          .filter(
            Boolean
          )
          .join(
            " "
          )
      },
      [
        data,
      ]
    )

  const propertyDetail =
    useMemo(
      () => {
        if (
          !data
        ) {
          return ""
        }

        const floorUnit =
          [
            data
              .property
              .floor
              ? `Piso ${data.property.floor}`
              : "",

            data
              .property
              .unit
              ? `Unidad ${data.property.unit}`
              : "",
          ]
            .filter(
              Boolean
            )
            .join(
              " · "
            )

        const place =
          [
            clean(
              data
                .property
                .city
            ),

            clean(
              data
                .property
                .province
            ),

            clean(
              data
                .property
                .country
            ),
          ]
            .filter(
              Boolean
            )
            .join(
              ", "
            )

        return [
          floorUnit,
          place,
        ]
          .filter(
            Boolean
          )
          .join(
            " · "
          )
      },
      [
        data,
      ]
    )

  async function logout() {
    await supabase
      .auth
      .signOut()

    router.replace(
      "/"
    )
  }

  function printContract() {
    if (
      !data
        ?.contract
        .content
    ) {
      return
    }

    const popup =
      window.open(
        "",
        "_blank",
        "noopener,noreferrer"
      )

    if (!popup) {
      return
    }

    const safeText =
      data
        .contract
        .content
        .replace(
          /&/g,
          "&amp;"
        )
        .replace(
          /</g,
          "&lt;"
        )
        .replace(
          />/g,
          "&gt;"
        )

    popup.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Contrato de locación</title>

          <style>
            @page {
              size: A4;
              margin: 22mm 18mm;
            }

            body {
              margin: 0;
              font-family:
                Georgia,
                "Times New Roman",
                serif;
              color: #050002;
              font-size: 12pt;
              line-height: 1.62;
            }

            .contract {
              white-space: pre-wrap;
            }
          </style>
        </head>

        <body>
          <div class="contract">${safeText}</div>

          <script>
            window.onload = function () {
              window.print()
            }
          </script>
        </body>
      </html>
    `)

    popup.document.close()
  }

  if (
    loading
  ) {
    return (
      <main className="rental-root loading">
        <style>
          {styles}
        </style>

        <section className="state-card">
          <VerloBrand
            width={126}
          />

          <h1>
            Cargando tu alquiler
          </h1>

          <p>
            Estamos preparando tu espacio.
          </p>
        </section>
      </main>
    )
  }

  if (
    error ||
    !data
  ) {
    return (
      <main className="rental-root error-state">
        <style>
          {styles}
        </style>

        <section className="state-card">
          <VerloBrand
            width={126}
          />

          <h1>
            No pudimos abrir Mi alquiler
          </h1>

          <p>
            {error ||
              "No encontramos un alquiler activo asociado a tu cuenta."}
          </p>

          <button
            type="button"
            className="button button-primary"
            onClick={
              logout
            }
          >
            Volver a Verlo
          </button>
        </section>
      </main>
    )
  }

  const isTenant =
    data.user.role ===
    "tenant"

  const counterpartLabel =
    isTenant
      ? "Propietario"
      : "Inquilino"

  return (
    <main className="rental-root">
      <style>
        {styles}
      </style>

      <div className="rental-shell">
        <header className="rental-header">
          <VerloBrand
            width={122}
          />

          <button
            type="button"
            className="logout-button"
            onClick={
              logout
            }
          >
            Cerrar sesión
          </button>
        </header>

        <section className="hero">
          <div className="hero-main">
            <span className="eyebrow">
              Mi alquiler
            </span>

            <h1>
              Hola,{" "}
              {data
                .user
                .full_name ||
                "bienvenido"}.
            </h1>

            <p className="hero-copy">
              Este es tu espacio para acompañar el alquiler durante toda su vigencia. Acá vas a poder consultar el contrato, llevar los pagos y, más adelante, gestionar todo lo relacionado con esta relación.
            </p>
          </div>

          <aside className="hero-status">
            <div>
              <div className="status-label">
                Estado del alquiler
              </div>

              <div className="status-main">
                Activo
              </div>
            </div>

            <div className="status-dates">
              Desde{" "}
              <strong>
                {formatDate(
                  data
                    .rental
                    .start_date
                )}
              </strong>
              <br />
              hasta{" "}
              <strong>
                {formatDate(
                  data
                    .rental
                    .end_date
                )}
              </strong>
            </div>
          </aside>
        </section>

        <section className="grid">
          <article className="card card-large">
            <h2 className="card-title">
              Propiedad
            </h2>

            <div className="property-address">
              {propertyAddress ||
                "Tu propiedad"}
            </div>

            <div className="property-location">
              {propertyDetail ||
                "Datos del inmueble"}
            </div>

            <div className="facts">
              <div className="fact">
                <span className="fact-label">
                  Inicio
                </span>

                <span className="fact-value">
                  {formatDate(
                    data
                      .contract
                      .start_date
                  )}
                </span>
              </div>

              <div className="fact">
                <span className="fact-label">
                  Finalización
                </span>

                <span className="fact-value">
                  {formatDate(
                    data
                      .contract
                      .end_date
                  )}
                </span>
              </div>
            </div>
          </article>

          <article className="card card-small">
            <h2 className="card-title">
              Alquiler mensual
            </h2>

            <div className="amount">
              {formatMoney(
                data
                  .contract
                  .monthly_price
              )}
            </div>

            <div className="amount-caption">
              Importe base según el contrato actual.
            </div>

            <div className="facts">
              <div className="fact">
                <span className="fact-label">
                  Depósito
                </span>

                <span className="fact-value">
                  {formatMoney(
                    data
                      .contract
                      .deposit
                  )}
                </span>
              </div>

              <div className="fact">
                <span className="fact-label">
                  Ajuste
                </span>

                <span className="fact-value">
                  {data
                    .contract
                    .adjustment_method ||
                    "Según contrato"}
                </span>
              </div>
            </div>
          </article>

          <article className="card card-small">
            <h2 className="card-title">
              {counterpartLabel}
            </h2>

            <div
              className="property-address"
              style={{
                fontSize:
                  "32px",
              }}
            >
              {data
                .counterpart
                .full_name ||
                counterpartLabel}
            </div>

            <div className="property-location">
              {data
                .counterpart
                .email ||
                "Email no disponible"}

              <br />

              {data
                .counterpart
                .phone ||
                "Teléfono no disponible"}
            </div>
          </article>

          <article className="card card-large">
            <h2 className="card-title">
              Contrato
            </h2>

            <div
              className="property-address"
              style={{
                fontSize:
                  "34px",
              }}
            >
              Contrato confirmado
            </div>

            <div className="property-location">
              Ambas partes aceptaron este contrato. Podés abrir el diálogo de impresión para guardarlo como PDF.
            </div>

            <div className="actions">
              <button
                type="button"
                className="button button-primary"
                onClick={
                  printContract
                }
              >
                Ver / guardar PDF
              </button>
            </div>
          </article>

          <article className="card card-full">
            <h2 className="card-title">
              Gestión del alquiler
            </h2>

            <div className="future-box">
              <strong>
                Próximamente: pagos y comprobantes
              </strong>

              <p>
                {isTenant
                  ? "Desde acá vas a poder subir tus comprobantes mensuales y consultar todo el historial del alquiler."
                  : "Desde acá vas a poder revisar comprobantes, confirmar pagos recibidos y consultar todo el historial del alquiler."}
              </p>
            </div>

            <div className="actions">
              <button
                type="button"
                className="button button-disabled"
                disabled
              >
                {isTenant
                  ? "Subir comprobante"
                  : "Ver pagos"}
              </button>

              <button
                type="button"
                className="button button-disabled"
                disabled
              >
                Historial
              </button>
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}
