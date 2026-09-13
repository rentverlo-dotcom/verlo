"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useParams,
} from "next/navigation"

import VerloBrand from "@/components/VerloBrand"

type FinalData = {
  ok: boolean

  viewer: {
    role:
      | "tenant"
      | "owner"

    lead_id:
      string
  }

  contract: {
    status:
      string

    start_date:
      string | null

    end_date:
      string | null

    tenant_agreed:
      boolean

    owner_agreed:
      boolean
  }

  tenant: {
    full_name:
      string
  }

  owner: {
    full_name:
      string
  }
}

function formatDate(
  value:
    string | null
) {
  if (!value) {
    return ""
  }

  const parts =
    value.split("-")

  if (
    parts.length === 3
  ) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  return value
}

export default function FinalPage() {
  const params =
    useParams<{
      token:
        string
    }>()

  const token =
    String(
      params?.token ||
        ""
    ).trim()

  const [
    data,
    setData,
  ] =
    useState<FinalData | null>(
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

  const whatsappBase =
    process.env
      .NEXT_PUBLIC_VERLO_WHATSAPP_URL ||
    ""

  const instagramUrl =
    process.env
      .NEXT_PUBLIC_VERLO_INSTAGRAM_URL ||
    ""

  useEffect(
    () => {
      async function load() {
        if (!token) {
          setError(
            "El acceso no es válido."
          )

          setLoading(
            false
          )

          return
        }

        try {
          const response =
            await fetch(
              `/api/closing-view?token=${encodeURIComponent(
                token
              )}`
            )

          const json =
            await response
              .json()
              .catch(
                () =>
                  null
              )

          if (
            !response.ok ||
            !json?.ok
          ) {
            throw new Error(
              json?.error ||
                "No pudimos abrir el cierre."
            )
          }

          if (
            json.contract
              ?.status !==
              "agreed" ||
            !json.contract
              ?.tenant_agreed ||
            !json.contract
              ?.owner_agreed
          ) {
            throw new Error(
              "El alquiler todavía no está cerrado."
            )
          }

          setData(
            json
          )
        } catch (
          loadError
        ) {
          console.error(
            loadError
          )

          setError(
            loadError instanceof
            Error
              ? loadError.message
              : "No pudimos abrir el cierre."
          )
        } finally {
          setLoading(
            false
          )
        }
      }

      load()
    },
    [
      token,
    ]
  )

  const firstName =
    useMemo(
      () => {
        if (!data) {
          return ""
        }

        const fullName =
          data.viewer.role ===
          "tenant"
            ? data.tenant
                ?.full_name
            : data.owner
                ?.full_name

        return String(
          fullName ||
            ""
        )
          .trim()
          .split(/\s+/)[0]
      },
      [
        data,
      ]
    )

  const whatsappUrl =
    useMemo(
      () => {
        if (
          !whatsappBase
        ) {
          return ""
        }

        const separator =
          whatsappBase.includes(
            "?"
          )
            ? "&"
            : "?"

        const text =
          `Hola Verlo 👋 Soy ${firstName || "usuario de Verlo"}. Quiero contarles cómo fue mi experiencia usando Verlo.`

        return `${whatsappBase}${separator}text=${encodeURIComponent(
          text
        )}`
      },
      [
        whatsappBase,
        firstName,
      ]
    )

  if (loading) {
    return (
      <main className="finalPage">
        <style>
          {styles}
        </style>

        <div className="loadingCard">
          <VerloBrand
            width={116}
          />

          <h1>
            Cerrando todo...
          </h1>

          <p>
            Un segundo.
          </p>
        </div>
      </main>
    )
  }

  if (
    error ||
    !data
  ) {
    return (
      <main className="finalPage">
        <style>
          {styles}
        </style>

        <div className="loadingCard">
          <VerloBrand
            width={116}
          />

          <h1>
            No pudimos abrir este cierre
          </h1>

          <p>
            {error}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="finalPage">
      <style>
        {styles}
      </style>

      <header className="topbar">
        <div className="shell topbarInner">
          <VerloBrand
            width={112}
          />

          <span className="closedPill">
            Alquiler confirmado
          </span>
        </div>
      </header>

      <section className="hero">
        <div className="shell finalGrid">
          <div className="heroCopy">
            <p className="eyebrow">
              Cerraron por Verlo
            </p>

            <h1>
              ¡Listo
              {firstName
                ? `, ${firstName}`
                : ""}
              !
              <br />

              <em>
                Ya está.
              </em>
            </h1>

            <p className="lead">
              Las dos partes aceptaron el contrato y el alquiler quedó confirmado.
            </p>

            <div className="statusCard">
              <div className="statusIcon">
                ✓
              </div>

              <div>
                <strong>
                  Alquiler activo
                </strong>

                <span>
                  Tu proceso en Verlo quedó cerrado correctamente.
                </span>
              </div>
            </div>

            {data.contract
              .end_date && (
              <div className="renewalBox">
                <span className="smallLabel">
                  Más adelante
                </span>

                <h2>
                  Nos volvemos a encontrar para renovar.
                </h2>

                <p>
                  Tu contrato vence el{" "}
                  <strong>
                    {formatDate(
                      data.contract
                        .end_date
                    )}
                  </strong>
                  . Cuando se acerque la fecha te vamos a avisar por si querés renovarlo o volver a buscar con Verlo.
                </p>

                <p className="noObligation">
                  Sin obligación ni compromiso.
                </p>
              </div>
            )}
          </div>

          <aside className="thanksCard">
            <span className="cardTag">
              Gracias por confiar en Verlo
            </span>

            <h2>
              ¿Nos contás cómo fue tu experiencia?
            </h2>

            <p>
              Tu historia puede ayudar a que más personas se animen a alquilar directo.
            </p>

            <div className="actions">
              {whatsappUrl ? (
                <a
                  className="primaryButton"
                  href={
                    whatsappUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Contarnos por WhatsApp
                </a>
              ) : (
                <div className="disabledButton">
                  Contarnos por WhatsApp
                </div>
              )}

              {instagramUrl ? (
                <a
                  className="secondaryButton"
                  href={
                    instagramUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Escribirnos por Instagram
                </a>
              ) : (
                <div className="disabledButton">
                  Escribirnos por Instagram
                </div>
              )}
            </div>

            <div className="permissionBox">
              <strong>
                ¿Podemos compartirlo?
              </strong>

              <p>
                Si nos mandás un testimonio y queremos publicarlo en nuestra web o redes, te vamos a pedir autorización antes de hacerlo.
              </p>
            </div>

            <div className="instagramBlock">
              <span>
                Seguimos conectados
              </span>

              <h3>
                Seguinos en Instagram.
              </h3>

              <p>
                Novedades, consejos y todo lo nuevo que vayamos sumando a Verlo.
              </p>

              {instagramUrl && (
                <a
                  className="instagramButton"
                  href={
                    instagramUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Seguir a Verlo en Instagram
                </a>
              )}
            </div>

            <p className="closingLine">
              Gracias por ser parte de Verlo.
              <br />
              <em>
                Mucho mejor.
              </em>
            </p>
          </aside>
        </div>
      </section>
    </main>
  )
}

const styles = `
  .finalPage {
    --pink: #f2a8a9;
    --pinkDark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --blue: #74bedc;
    --yellow: #e7c776;

    min-height: 100vh;
    background:
      radial-gradient(
        circle at 85% 10%,
        rgba(242,168,169,.52),
        transparent 30%
      ),
      radial-gradient(
        circle at 8% 72%,
        rgba(116,190,220,.14),
        transparent 25%
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

  .finalPage * {
    box-sizing: border-box;
  }

  .shell {
    width: min(
      1160px,
      calc(100% - 40px)
    );

    margin: 0 auto;
  }

  .topbar {
    border-bottom:
      1px solid
      rgba(5,0,2,.08);

    background:
      rgba(242,235,236,.82);

    backdrop-filter:
      blur(18px);
  }

  .topbarInner {
    height: 76px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 20px;
  }

  .closedPill {
    padding:
      9px 13px;

    border-radius:
      999px;

    background:
      rgba(255,255,255,.6);

    border:
      1px solid
      rgba(5,0,2,.08);

    font-size: 13px;
    font-weight: 900;
  }

  .hero {
    padding:
      64px 0 90px;
  }

  .finalGrid {
    display: grid;

    grid-template-columns:
      minmax(0, 1fr)
      minmax(380px, .78fr);

    gap: 54px;

    align-items: start;
  }

  .heroCopy {
    padding-top: 18px;
  }

  .eyebrow {
    margin: 0;

    color:
      var(--pinkDark);

    font-size: 12px;
    font-weight: 950;

    letter-spacing:
      .15em;

    text-transform:
      uppercase;
  }

  .heroCopy h1 {
    margin:
      17px 0 0;

    font-size:
      clamp(
        58px,
        8vw,
        104px
      );

    line-height: .87;

    letter-spacing:
      -.075em;

    font-weight: 950;
  }

  .heroCopy h1 em {
    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-style: italic;

    font-weight: 400;

    letter-spacing:
      -.04em;
  }

  .lead {
    max-width: 650px;

    margin:
      26px 0 0;

    font-size: 20px;

    line-height: 1.5;

    font-weight: 700;

    color:
      rgba(5,0,2,.68);
  }

  .statusCard {
    max-width: 630px;

    margin-top: 30px;

    display: flex;
    align-items: center;

    gap: 15px;

    padding: 18px;

    border-radius: 24px;

    background:
      rgba(255,255,255,.65);

    border:
      1px solid
      rgba(5,0,2,.08);
  }

  .statusIcon {
    flex: 0 0 auto;

    width: 46px;
    height: 46px;

    display: grid;
    place-items: center;

    border-radius: 999px;

    background:
      var(--black);

    color: #fff;

    font-size: 20px;
    font-weight: 950;
  }

  .statusCard strong,
  .statusCard span {
    display: block;
  }

  .statusCard strong {
    font-size: 16px;
    font-weight: 950;
  }

  .statusCard span {
    margin-top: 3px;

    color:
      rgba(5,0,2,.58);

    font-size: 14px;
    font-weight: 700;
  }

  .renewalBox {
    max-width: 630px;

    margin-top: 22px;

    padding:
      26px;

    border-radius: 28px;

    background:
      rgba(242,168,169,.2);

    border:
      1px solid
      rgba(195,121,134,.18);
  }

  .smallLabel {
    color:
      var(--pinkDark);

    font-size: 11px;

    font-weight: 950;

    letter-spacing:
      .13em;

    text-transform:
      uppercase;
  }

  .renewalBox h2 {
    margin:
      10px 0 0;

    font-size:
      28px;

    line-height: 1;

    letter-spacing:
      -.045em;

    font-weight: 950;
  }

  .renewalBox p {
    margin:
      13px 0 0;

    color:
      rgba(5,0,2,.67);

    line-height: 1.5;

    font-weight: 700;
  }

  .renewalBox .noObligation {
    margin-top: 9px;

    color:
      var(--black);

    font-size: 13px;

    font-weight: 900;
  }

  .thanksCard {
    padding:
      34px;

    border-radius:
      40px;

    background:
      rgba(255,255,255,.8);

    border:
      1px solid
      rgba(5,0,2,.08);

    box-shadow:
      0 30px 80px
      rgba(5,0,2,.11);
  }

  .cardTag {
    display:
      inline-flex;

    padding:
      8px 11px;

    border-radius:
      999px;

    background:
      rgba(242,168,169,.28);

    font-size: 12px;

    font-weight: 950;
  }

  .thanksCard h2 {
    margin:
      20px 0 0;

    font-size:
      clamp(
        35px,
        4vw,
        51px
      );

    line-height: .95;

    letter-spacing:
      -.06em;

    font-weight: 950;
  }

  .thanksCard > p {
    margin:
      15px 0 0;

    color:
      rgba(5,0,2,.63);

    font-size: 16px;

    line-height: 1.5;

    font-weight: 700;
  }

  .actions {
    display: grid;

    gap: 11px;

    margin-top: 25px;
  }

  .primaryButton,
  .secondaryButton,
  .disabledButton,
  .instagramButton {
    min-height: 56px;

    padding:
      0 20px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius:
      999px;

    text-align: center;

    text-decoration: none;

    font-size: 15px;

    font-weight: 950;
  }

  .primaryButton {
    background:
      var(--black);

    color: #fff;

    box-shadow:
      0 15px 38px
      rgba(5,0,2,.16);
  }

  .secondaryButton {
    background: #fff;

    color:
      var(--black);

    border:
      1px solid
      rgba(5,0,2,.12);
  }

  .disabledButton {
    background:
      rgba(5,0,2,.06);

    color:
      rgba(5,0,2,.35);
  }

  .permissionBox {
    margin-top: 22px;

    padding: 17px;

    border-radius: 22px;

    background:
      rgba(116,190,220,.12);
  }

  .permissionBox strong {
    display: block;

    font-size: 14px;
    font-weight: 950;
  }

  .permissionBox p {
    margin:
      6px 0 0;

    color:
      rgba(5,0,2,.63);

    font-size: 13px;

    line-height: 1.45;

    font-weight: 700;
  }

  .instagramBlock {
    margin-top: 22px;

    padding-top: 22px;

    border-top:
      1px solid
      rgba(5,0,2,.09);
  }

  .instagramBlock > span {
    color:
      var(--pinkDark);

    font-size: 11px;

    font-weight: 950;

    text-transform:
      uppercase;

    letter-spacing:
      .12em;
  }

  .instagramBlock h3 {
    margin:
      8px 0 0;

    font-size: 24px;

    line-height: 1;

    letter-spacing:
      -.04em;

    font-weight: 950;
  }

  .instagramBlock p {
    margin:
      9px 0 0;

    color:
      rgba(5,0,2,.59);

    font-size: 13px;

    line-height: 1.45;

    font-weight: 700;
  }

  .instagramButton {
    margin-top: 14px;

    min-height: 48px;

    background:
      var(--pink);

    color:
      var(--black);
  }

  .closingLine {
    margin-top:
      25px !important;

    padding-top: 21px;

    border-top:
      1px solid
      rgba(5,0,2,.09);

    text-align: center;

    color:
      var(--black) !important;

    font-weight:
      850 !important;
  }

  .closingLine em {
    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 18px;

    font-weight: 400;
  }

  .loadingCard {
    min-height: 100vh;

    width:
      min(
        580px,
        calc(100% - 30px)
      );

    margin: 0 auto;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    text-align: center;
  }

  .loadingCard h1 {
    margin:
      24px 0 0;

    font-size: 44px;

    line-height: .95;

    letter-spacing:
      -.055em;
  }

  .loadingCard p {
    color:
      rgba(5,0,2,.6);

    font-weight: 700;
  }

  @media (
    max-width: 900px
  ) {
    .finalGrid {
      grid-template-columns:
        1fr;
    }

    .heroCopy {
      padding-top: 0;
    }
  }

  @media (
    max-width: 620px
  ) {
    .shell {
      width:
        min(
          100% - 26px,
          1160px
        );
    }

    .topbarInner {
      height: 68px;
    }

    .closedPill {
      font-size: 11px;
    }

    .hero {
      padding:
        42px 0 60px;
    }

    .heroCopy h1 {
      font-size: 55px;
    }

    .lead {
      font-size: 17px;
    }

    .thanksCard {
      padding:
        25px 20px;

      border-radius: 30px;
    }

    .renewalBox {
      padding: 21px;
    }
  }
`
