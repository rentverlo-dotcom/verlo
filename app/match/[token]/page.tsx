"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"
import { useParams } from "next/navigation"
import VerloBrand from "@/components/VerloBrand"

type MediaItem = {
  id: string
  type: "photo" | "video"
  url: string | null
  key: string
  content_type: string | null
  filename: string | null
}

type MatchData = {
  match: {
    id: string
    score: number
    reasons: Record<string, unknown>
    ready_to_connect: boolean
  }

  property: {
    owner_lead_id: string
    neighborhood: string | null
    property_type: string | null
    rooms: string | null
    price: number | null
    availability: string | null
    expenses: number | null
    floor_unit: string | null
    requirements: unknown
    visit_conditions: string | null
    notes: string | null
    accepted_income_proof_types: string[]
    min_income_ratio: number | null
    accepted_guarantee_types: string[]
  }

  media: MediaItem[]

  tenant: {
    desired_property_type: string | null
    desired_rooms: string | null
    budget_max: number | null
    move_timing: string | null
    neighborhoods: string[]
  } | null
}

function money(
  value: number | null
) {
  if (!value) return null

  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }
  ).format(value)
}

function humanize(
  value: string | null
) {
  if (!value) return null

  const dictionary:
    Record<string, string> = {
      apartment: "Departamento",
      house: "Casa",
      ph: "PH",
      studio: "Monoambiente",

      property_guarantee:
        "Garantía propietaria",

      surety_insurance:
        "Seguro de caución",

      salary_guarantors:
        "Garantes con recibo",

      salary_receipt:
        "Recibo de sueldo",

      monotributo:
        "Monotributo",

      self_employed:
        "Autónomo",

      other_formal:
        "Otros ingresos formales",

      any:
        "Cualquiera",
    }

  return (
    dictionary[value] ||
    value
      .replace(/_/g, " ")
      .replace(/-/g, " ")
  )
}

export default function MatchPage() {
  const params =
    useParams<{
      token: string
    }>()

  const token =
    String(
      params?.token || ""
    )

  const [data, setData] =
    useState<MatchData | null>(
      null
    )

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [selectedMedia, setSelectedMedia] =
    useState(0)

  const [sendingInterest, setSendingInterest] =
    useState(false)

  const [interested, setInterested] =
    useState(false)

  useEffect(() => {
    async function load() {
      try {
        const response =
          await fetch(
            `/api/match-view?token=${encodeURIComponent(
              token
            )}`
          )

        const json =
          await response.json()

        if (
          !response.ok ||
          !json?.ok
        ) {
          throw new Error(
            json?.error ||
              "No pudimos cargar esta propiedad."
          )
        }

        setData(json)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No pudimos cargar esta propiedad."
        )
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      load()
    }
  }, [token])

  const currentMedia =
    data?.media?.[
      selectedMedia
    ] || null

  const propertyFacts =
    useMemo(() => {
      if (!data) return []

      return [
        {
          label: "Tipo",
          value:
            humanize(
              data.property
                .property_type
            ),
        },

        {
          label: "Ambientes",
          value:
            data.property.rooms,
        },

        {
          label: "Alquiler",
          value:
            money(
              data.property.price
            ),
        },

        {
          label: "Expensas",
          value:
            money(
              data.property.expenses
            ),
        },

        {
          label: "Disponible",
          value:
            data.property
              .availability,
        },

        {
          label: "Piso / unidad",
          value:
            data.property
              .floor_unit,
        },
      ].filter(
        (item) =>
          item.value !== null &&
          item.value !== ""
      )
    }, [data])

  async function sendInterest() {
    setSendingInterest(true)
    setError("")

    try {
      const response =
        await fetch(
          "/api/match-interest",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token,
                action:
                  "tenant_interest",
              }),
          }
        )

      const json =
        await response.json()

      if (
        !response.ok ||
        !json?.ok
      ) {
        throw new Error(
          json?.error ||
            "No pudimos registrar tu interés."
        )
      }

      setInterested(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos registrar tu interés."
      )
    } finally {
      setSendingInterest(false)
    }
  }

  if (loading) {
    return (
      <>
        <GlobalStyles />

        <main className="page centered">
          <div className="loading-card">
            <VerloBrand />

            <div className="loader" />

            <strong>
              Cargando tu match...
            </strong>
          </div>
        </main>

        <PageStyles />
      </>
    )
  }

  if (
    error &&
    !data
  ) {
    return (
      <>
        <GlobalStyles />

        <main className="page centered">
          <div className="error-card">
            <VerloBrand />

            <h1>
              No pudimos abrir
              <br />
              <em>este match.</em>
            </h1>

            <p>
              {error}
            </p>
          </div>
        </main>

        <PageStyles />
      </>
    )
  }

  if (!data) {
    return null
  }

  return (
    <>
      <GlobalStyles />

      <main className="page">
        <div className="orb orb-pink" />
        <div className="orb orb-blue" />
        <div className="orb orb-yellow" />

        <header className="header">
          <VerloBrand />

          <div className="match-pill">
            MATCH {data.match.score}%
          </div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              ENCONTRAMOS ALGO PARA VOS
            </div>

            <h1>
              Una propiedad
              <br />
              que puede ser
              <br />
              <em>tu lugar.</em>
            </h1>

            <p>
              Coincide con tu búsqueda.
              Mirala completa y decidí
              si querés avanzar.
            </p>
          </div>

          <div className="score-card">
            <span>
              compatibilidad
            </span>

            <strong>
              {data.match.score}%
            </strong>

            <p>
              VERLO cruzó tu búsqueda
              con las condiciones de
              esta propiedad.
            </p>
          </div>
        </section>

        <section className="gallery">
          <div className="main-media">
            {currentMedia?.url ? (
              currentMedia.type ===
              "video" ? (
                <video
                  src={
                    currentMedia.url
                  }
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={
                    currentMedia.url
                  }
                  alt="Propiedad"
                />
              )
            ) : (
              <div className="missing-media">
                Multimedia no disponible
              </div>
            )}

            <div className="media-counter">
              {selectedMedia + 1}
              {" / "}
              {data.media.length}
            </div>
          </div>

          {data.media.length > 1 && (
            <div className="thumbs">
              {data.media.map(
                (
                  item,
                  index
                ) => (
                  <button
                    key={item.id}
                    className={
                      selectedMedia ===
                      index
                        ? "thumb active"
                        : "thumb"
                    }
                    onClick={() =>
                      setSelectedMedia(
                        index
                      )
                    }
                  >
                    {item.url ? (
                      item.type ===
                      "video" ? (
                        <>
                          <video
                            src={
                              item.url
                            }
                            muted
                            playsInline
                          />

                          <span className="video-badge">
                            VIDEO
                          </span>
                        </>
                      ) : (
                        <img
                          src={
                            item.url
                          }
                          alt=""
                        />
                      )
                    ) : null}
                  </button>
                )
              )}
            </div>
          )}
        </section>

        <section className="property-head">
          <div>
            <div className="location">
              {
                data.property
                  .neighborhood
              }
            </div>

            <h2>
              {humanize(
                data.property
                  .property_type
              ) || "Propiedad"}
              {data.property.rooms
                ? ` · ${data.property.rooms}`
                : ""}
            </h2>
          </div>

          {data.property.price && (
            <div className="price">
              <strong>
                {money(
                  data.property
                    .price
                )}
              </strong>

              <span>
                por mes
              </span>
            </div>
          )}
        </section>

        <section className="facts">
          {propertyFacts.map(
            (fact) => (
              <div
                className="fact"
                key={
                  fact.label
                }
              >
                <span>
                  {fact.label}
                </span>

                <strong>
                  {fact.value}
                </strong>
              </div>
            )
          )}
        </section>

        <section className="content-grid">
          <div className="section-card">
            <div className="card-label">
              CONDICIONES
            </div>

            <h3>
              Lo que pide el
              propietario
            </h3>

            {data.property
              .accepted_income_proof_types
              .length > 0 && (
              <InfoRow
                title="Comprobantes de ingresos"
                values={
                  data.property
                    .accepted_income_proof_types
                }
              />
            )}

            {data.property
              .accepted_guarantee_types
              .length > 0 && (
              <InfoRow
                title="Garantías aceptadas"
                values={
                  data.property
                    .accepted_guarantee_types
                }
              />
            )}

            {data.property
              .min_income_ratio && (
              <InfoRow
                title="Relación ingreso / alquiler"
                values={[
                  `${data.property.min_income_ratio}x`,
                ]}
              />
            )}

            {data.property
              .requirements && (
              <InfoText
                title="Otros requisitos"
                value={String(
                  data.property
                    .requirements
                )}
              />
            )}
          </div>

          <div className="section-card blue">
            <div className="card-label">
              VISITA
            </div>

            <h3>
              Antes de avanzar
            </h3>

            <InfoText
              title="Disponibilidad"
              value={
                data.property
                  .availability
              }
            />

            <InfoText
              title="Condiciones para visitar"
              value={
                data.property
                  .visit_conditions
              }
            />

            <InfoText
              title="Información adicional"
              value={
                data.property
                  .notes
              }
            />
          </div>
        </section>

        <section className="privacy-card">
          <div className="privacy-icon">
            ✦
          </div>

          <div>
            <strong>
              Primero deciden los dos.
            </strong>

            <p>
              VERLO todavía no muestra
              dirección exacta ni datos
              de contacto. Si vos y el
              propietario quieren avanzar,
              los conectamos para coordinar
              la visita.
            </p>
          </div>
        </section>

        <section className="decision">
          {!interested ? (
            <>
              <div className="decision-copy">
                <span>
                  TU DECISIÓN
                </span>

                <h2>
                  ¿Te interesa
                  <br />
                  <em>avanzar?</em>
                </h2>

                <p>
                  Si das el OK, vamos a
                  pedirle también el OK
                  al propietario.
                </p>
              </div>

              <button
                onClick={
                  sendInterest
                }
                disabled={
                  sendingInterest
                }
                className="interest-button"
              >
                {sendingInterest
                  ? "Guardando..."
                  : "Sí, me interesa"}
              </button>
            </>
          ) : (
            <div className="interest-success">
              <div className="check">
                ✓
              </div>

              <div>
                <span>
                  TU OK QUEDÓ REGISTRADO
                </span>

                <h2>
                  Ahora vamos con el
                  propietario.
                </h2>

                <p>
                  Si él también quiere
                  avanzar, VERLO los conecta
                  para coordinar la visita.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="inline-error">
              {error}
            </div>
          )}
        </section>

        <footer>
          <VerloBrand
            width={28}
          />

          <span>
            Matching inmobiliario
            sin vueltas.
          </span>
        </footer>
      </main>

      <PageStyles />
    </>
  )
}

function InfoRow({
  title,
  values,
}: {
  title: string
  values: string[]
}) {
  return (
    <div className="info-row">
      <span>
        {title}
      </span>

      <div className="chips">
        {values.map(
          (value) => (
            <strong
              key={value}
            >
              {humanize(
                value
              )}
            </strong>
          )
        )}
      </div>
    </div>
  )
}

function InfoText({
  title,
  value,
}: {
  title: string
  value:
    | string
    | null
    | undefined
}) {
  if (!value) return null

  return (
    <div className="info-text">
      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  )
}

function GlobalStyles() {
  return (
    <style jsx global>{`
      :root {
        --pink: #f2a8a9;
        --pink-dark: #c37986;
        --black: #050002;
        --soft: #f2ebec;
        --blue: #74bedc;
        --yellow: #e7c776;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: var(--soft);
        color: var(--black);
        font-family:
          Inter,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      button {
        font: inherit;
      }
    `}</style>
  )
}

function PageStyles() {
  return (
    <style jsx global>{`
      .page {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        padding: 28px 22px 60px;
        background:
          radial-gradient(
            circle at 8% 5%,
            rgba(242, 168, 169, 0.5),
            transparent 24%
          ),
          radial-gradient(
            circle at 92% 42%,
            rgba(116, 190, 220, 0.28),
            transparent 26%
          ),
          radial-gradient(
            circle at 80% 8%,
            rgba(231, 199, 118, 0.22),
            transparent 18%
          ),
          var(--soft);
      }

      .centered {
        display: grid;
        place-items: center;
      }

      .header,
      .hero,
      .gallery,
      .property-head,
      .facts,
      .content-grid,
      .privacy-card,
      .decision,
      footer {
        position: relative;
        z-index: 2;
        width:
          min(
            1080px,
            100%
          );
        margin-left: auto;
        margin-right: auto;
      }

      .header {
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content:
          space-between;
        gap: 20px;
      }

      .match-pill {
        padding:
          11px 16px;
        border-radius:
          999px;
        background:
          var(--black);
        color: white;
        font-size: 12px;
        font-weight: 950;
        letter-spacing:
          0.08em;
      }

      .hero {
        display: grid;
        grid-template-columns:
          minmax(0, 1fr)
          260px;
        gap: 50px;
        align-items: end;
        padding:
          76px 0 48px;
      }

      .eyebrow,
      .card-label,
      .decision-copy > span,
      .interest-success span {
        font-size: 11px;
        font-weight: 950;
        letter-spacing:
          0.16em;
      }

      .hero h1 {
        margin:
          16px 0 0;
        font-size:
          clamp(
            58px,
            8vw,
            108px
          );
        line-height: 0.91;
        letter-spacing:
          -0.06em;
        font-weight: 950;
      }

      .hero h1 em,
      .decision h2 em {
        font-family:
          Georgia,
          "Times New Roman",
          serif;
        font-style: italic;
        font-weight: 400;
        letter-spacing:
          -0.04em;
      }

      .hero-copy > p {
        margin:
          28px 0 0;
        max-width: 590px;
        font-size: 20px;
        line-height: 1.48;
        color:
          rgba(
            5,
            0,
            2,
            0.65
          );
      }

      .score-card {
        padding: 24px;
        border-radius:
          26px;
        background:
          var(--pink);
      }

      .score-card span {
        font-size: 12px;
        font-weight: 850;
      }

      .score-card strong {
        display: block;
        margin:
          8px 0 4px;
        font-size: 58px;
        line-height: 1;
        letter-spacing:
          -0.06em;
      }

      .score-card p {
        margin:
          14px 0 0;
        font-size: 14px;
        line-height: 1.45;
        color:
          rgba(
            5,
            0,
            2,
            0.63
          );
      }

      .gallery {
        display: grid;
        gap: 13px;
      }

      .main-media {
        position: relative;
        width: 100%;
        aspect-ratio:
          16 / 9;
        border-radius:
          32px;
        overflow: hidden;
        background:
          var(--black);
        box-shadow:
          0 30px 80px
          rgba(
            5,
            0,
            2,
            0.18
          );
      }

      .main-media img,
      .main-media video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .media-counter {
        position: absolute;
        right: 18px;
        bottom: 18px;
        padding:
          9px 13px;
        border-radius:
          999px;
        background:
          rgba(
            5,
            0,
            2,
            0.76
          );
        color: white;
        font-size: 12px;
        font-weight: 900;
        backdrop-filter:
          blur(10px);
      }

      .thumbs {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 3px;
      }

      .thumb {
        position: relative;
        flex:
          0 0 110px;
        height: 82px;
        padding: 0;
        border: 3px solid
          transparent;
        border-radius:
          16px;
        overflow: hidden;
        background: #ddd;
        cursor: pointer;
      }

      .thumb.active {
        border-color:
          var(--black);
      }

      .thumb img,
      .thumb video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .video-badge {
        position: absolute;
        bottom: 5px;
        left: 5px;
        padding:
          4px 6px;
        border-radius:
          999px;
        background:
          var(--black);
        color: white;
        font-size: 8px;
        font-weight: 900;
      }

      .property-head {
        padding:
          54px 0 28px;
        display: flex;
        align-items:
          flex-end;
        justify-content:
          space-between;
        gap: 30px;
      }

      .location {
        font-size: 14px;
        font-weight: 950;
        text-transform:
          uppercase;
        letter-spacing:
          0.08em;
        color:
          var(
            --pink-dark
          );
      }

      .property-head h2 {
        margin:
          8px 0 0;
        font-size:
          clamp(
            36px,
            5vw,
            62px
          );
        line-height: 1;
        letter-spacing:
          -0.045em;
      }

      .price {
        text-align: right;
      }

      .price strong {
        display: block;
        font-size:
          clamp(
            26px,
            4vw,
            40px
          );
        letter-spacing:
          -0.04em;
      }

      .price span {
        font-size: 13px;
        color:
          rgba(
            5,
            0,
            2,
            0.55
          );
      }

      .facts {
        display: grid;
        grid-template-columns:
          repeat(
            3,
            1fr
          );
        gap: 10px;
      }

      .fact {
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
            0.07
          );
        border-radius:
          20px;
        padding: 18px;
      }

      .fact span {
        display: block;
        margin-bottom: 6px;
        font-size: 11px;
        font-weight: 850;
        color:
          rgba(
            5,
            0,
            2,
            0.52
          );
        text-transform:
          uppercase;
      }

      .fact strong {
        font-size: 17px;
      }

      .content-grid {
        display: grid;
        grid-template-columns:
          1fr 1fr;
        gap: 18px;
        margin-top: 18px;
      }

      .section-card {
        border-radius:
          28px;
        padding: 28px;
        background:
          var(--pink);
      }

      .section-card.blue {
        background:
          var(--blue);
      }

      .section-card h3 {
        margin:
          12px 0 28px;
        font-size: 28px;
        letter-spacing:
          -0.035em;
      }

      .info-row,
      .info-text {
        padding:
          16px 0;
        border-top:
          1px solid
          rgba(
            5,
            0,
            2,
            0.12
          );
      }

      .info-row > span,
      .info-text > span {
        display: block;
        margin-bottom: 10px;
        font-size: 12px;
        color:
          rgba(
            5,
            0,
            2,
            0.56
          );
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }

      .chips strong {
        padding:
          8px 10px;
        border-radius:
          999px;
        background:
          rgba(
            255,
            255,
            255,
            0.55
          );
        font-size: 13px;
      }

      .info-text strong {
        display: block;
        font-size: 16px;
        line-height: 1.45;
      }

      .privacy-card {
        margin-top: 18px;
        display: flex;
        gap: 18px;
        align-items:
          flex-start;
        padding: 24px;
        background:
          rgba(
            255,
            255,
            255,
            0.7
          );
        border-radius:
          24px;
        border:
          1px solid
          rgba(
            5,
            0,
            2,
            0.07
          );
      }

      .privacy-icon {
        width: 44px;
        height: 44px;
        flex:
          0 0 44px;
        border-radius:
          999px;
        display: grid;
        place-items:
          center;
        background:
          var(--yellow);
        font-weight: 950;
      }

      .privacy-card strong {
        font-size: 17px;
      }

      .privacy-card p {
        margin:
          7px 0 0;
        max-width: 760px;
        font-size: 14px;
        line-height: 1.5;
        color:
          rgba(
            5,
            0,
            2,
            0.62
          );
      }

      .decision {
        margin-top: 56px;
        border-radius:
          36px;
        padding:
          42px;
        background:
          var(--black);
        color: white;
      }

      .decision {
        display: grid;
        grid-template-columns:
          minmax(
            0,
            1fr
          )
          auto;
        align-items: center;
        gap: 36px;
      }

      .decision h2 {
        margin:
          12px 0 16px;
        font-size:
          clamp(
            42px,
            6vw,
            72px
          );
        line-height: 0.95;
        letter-spacing:
          -0.05em;
      }

      .decision p {
        margin: 0;
        max-width: 530px;
        color:
          rgba(
            255,
            255,
            255,
            0.66
          );
        line-height: 1.5;
      }

      .interest-button {
        min-width: 240px;
        min-height: 62px;
        padding:
          0 26px;
        border: 0;
        border-radius:
          999px;
        background:
          var(--pink);
        color:
          var(--black);
        font-size: 18px;
        font-weight: 950;
        cursor: pointer;
      }

      .interest-button:disabled {
        opacity: 0.5;
        cursor:
          not-allowed;
      }

      .interest-success {
        grid-column:
          1 / -1;
        display: flex;
        gap: 22px;
        align-items:
          flex-start;
      }

      .check {
        width: 64px;
        height: 64px;
        flex:
          0 0 64px;
        border-radius:
          999px;
        display: grid;
        place-items:
          center;
        background:
          var(--pink);
        color:
          var(--black);
        font-size: 30px;
        font-weight: 950;
      }

      .interest-success h2 {
        font-size:
          clamp(
            34px,
            5vw,
            56px
          );
      }

      .inline-error {
        grid-column:
          1 / -1;
        margin-top: 8px;
        border-radius:
          14px;
        padding:
          12px 14px;
        background:
          rgba(
            242,
            168,
            169,
            0.16
          );
        color:
          #ffdcdc;
        font-size: 13px;
      }

      footer {
        padding:
          44px 0 0;
        display: flex;
        justify-content:
          space-between;
        align-items: center;
        gap: 20px;
        color:
          rgba(
            5,
            0,
            2,
            0.55
          );
        font-size: 13px;
      }

      .loading-card,
      .error-card {
        position: relative;
        z-index: 2;
        width:
          min(
            520px,
            100%
          );
        border-radius:
          30px;
        padding: 34px;
        background:
          rgba(
            255,
            255,
            255,
            0.8
          );
      }

      .loader {
        width: 36px;
        height: 36px;
        margin:
          42px 0 18px;
        border:
          3px solid
          rgba(
            5,
            0,
            2,
            0.15
          );
        border-top-color:
          var(--black);
        border-radius:
          999px;
        animation:
          spin 0.8s
          linear infinite;
      }

      .error-card h1 {
        margin:
          38px 0 16px;
        font-size: 50px;
        line-height: 0.95;
        letter-spacing:
          -0.05em;
      }

      .error-card h1 em {
        font-family:
          Georgia,
          serif;
        font-weight: 400;
      }

      @keyframes spin {
        to {
          transform:
            rotate(
              360deg
            );
        }
      }

      .orb {
        position: fixed;
        border-radius:
          999px;
        filter:
          blur(80px);
        pointer-events:
          none;
      }

      .orb-pink {
        width: 300px;
        height: 300px;
        top: -100px;
        left: -100px;
        background:
          var(--pink);
        opacity: 0.5;
      }

      .orb-blue {
        width: 300px;
        height: 300px;
        right: -100px;
        top: 40%;
        background:
          var(--blue);
        opacity: 0.28;
      }

      .orb-yellow {
        width: 180px;
        height: 180px;
        right: 10%;
        top: 2%;
        background:
          var(--yellow);
        opacity: 0.2;
      }

      @media (
        max-width: 760px
      ) {
        .page {
          padding:
            16px 12px
            38px;
        }

        .hero {
          grid-template-columns:
            1fr;
          padding:
            50px 0 30px;
          gap: 26px;
        }

        .score-card {
          width: 100%;
        }

        .main-media {
          aspect-ratio:
            4 / 3;
          border-radius:
            24px;
        }

        .property-head {
          align-items:
            flex-start;
          flex-direction:
            column;
        }

        .price {
          text-align: left;
        }

        .facts {
          grid-template-columns:
            1fr 1fr;
        }

        .content-grid {
          grid-template-columns:
            1fr;
        }

        .decision {
          grid-template-columns:
            1fr;
          padding: 28px;
        }

        .interest-button {
          width: 100%;
          position: sticky;
          bottom: 12px;
        }

        footer {
          flex-direction:
            column;
          align-items:
            flex-start;
        }
      }
    `}</style>
  )
}
