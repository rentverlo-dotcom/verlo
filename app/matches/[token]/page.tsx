"use client"

import {
  useEffect,
  useState,
} from "react"
import {
  useParams,
  useRouter,
} from "next/navigation"
import VerloBrand from "@/components/VerloBrand"

type MediaItem = {
  id: string
  type: "photo" | "video"
  url: string | null
  key: string
  content_type: string | null
  filename: string | null
}

type MatchItem = {
  id: string
  score: number
  reasons: Record<
    string,
    unknown
  >
  tenant_interested: boolean
  owner_interested: boolean
  ready_to_connect: boolean

  property: {
    neighborhood:
      | string
      | null

    property_type:
      | string
      | null

    rooms:
      | string
      | null

    price:
      | number
      | null

    availability:
      | string
      | null

    expenses:
      | number
      | null

    floor_unit:
      | string
      | null

    requirements:
      unknown

    visit_conditions:
      | string
      | null

    notes:
      | string
      | null

    accepted_income_proof_types:
      string[]

    min_income_ratio:
      | number
      | null

    accepted_guarantee_types:
      string[]
  }

  media: MediaItem[]
}

type MatchesData = {
  tenant: {
    id: string

    full_name:
      | string
      | null

    desired_property_type:
      | string
      | null

    desired_rooms:
      | string
      | null

    budget_max:
      | number
      | null

    move_timing:
      | string
      | null

    neighborhoods:
      string[]
  }

  count: number
  matches: MatchItem[]
}

function money(
  value:
    | number
    | null
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
  value:
    | string
    | null
) {
  if (!value) return null

  const dictionary:
    Record<
      string,
      string
    > = {
      apartment:
        "Departamento",

      house:
        "Casa",

      ph:
        "PH",

      studio:
        "Monoambiente",

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

export default function MatchesPage() {
  const params =
    useParams<{
      token: string
    }>()

  const router =
    useRouter()

  const token =
    String(
      params?.token ||
        ""
    )

  const [
    data,
    setData,
  ] =
    useState<
      MatchesData | null
    >(null)

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
    selected,
    setSelected,
  ] =
    useState<
      string[]
    >([])

  useEffect(() => {
    if (!token) {
      return
    }

    async function trackOpen() {
      try {
        const response =
          await fetch(
            "/api/match-link-open",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                token,
                role: "tenant",
              }),
            }
          )

        if (!response.ok) {
          const text =
            await response
              .text()
              .catch(
                () => ""
              )

          console.error(
            "tenant match link open tracking failed:",
            response.status,
            text
          )
        }
      } catch (err) {
        console.error(
          "tenant match link open tracking error:",
          err
        )
      }
    }

    trackOpen()
  }, [token])

  useEffect(() => {
    async function load() {
      try {
        const response =
          await fetch(
            `/api/tenant-matches-view?token=${encodeURIComponent(
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
              "No pudimos cargar tus propiedades."
          )
        }

        setData(json)

        const alreadyInterested =
          (
            json.matches ||
            []
          )
            .filter(
              (
                match:
                  MatchItem
              ) =>
                match
                  .tenant_interested
            )
            .map(
              (
                match:
                  MatchItem
              ) =>
                match.id
            )

        setSelected(
          alreadyInterested
        )
      } catch (err) {
        setError(
          err instanceof
            Error
            ? err.message
            : "No pudimos cargar tus propiedades."
        )
      } finally {
        setLoading(
          false
        )
      }
    }

    if (token) {
      load()
    }
  }, [token])

  function toggleMatch(
    matchId: string
  ) {
    setSelected(
      (
        current
      ) =>
        current.includes(
          matchId
        )
          ? current.filter(
              (id) =>
                id !==
                matchId
            )
          : [
              ...current,
              matchId,
            ]
    )
  }

  function continueFlow() {
    if (
      selected.length ===
      0
    ) {
      setError(
        "Elegí al menos una propiedad."
      )

      return
    }

    setError("")

    const matchIds =
      encodeURIComponent(
        selected.join(",")
      )

    router.push(
      `/tenant/validacion/${token}?matches=${matchIds}`
    )
  }

  if (loading) {
    return (
      <>
        <main className="centered">
          <VerloBrand />

          <p>
            Cargando tus
            matches...
          </p>
        </main>

        <Styles />
      </>
    )
  }

  if (
    error &&
    !data
  ) {
    return (
      <>
        <main className="centered">
          <VerloBrand />

          <h1>
            No pudimos
            abrir tus
            matches.
          </h1>

          <p>
            {error}
          </p>
        </main>

        <Styles />
      </>
    )
  }

  if (!data) {
    return null
  }

  return (
    <>
      <main className="page">
     <header
  style={{
    position: "sticky",
    top: 0,
    zIndex: 50,
    height: "76px",
    background: "rgba(242,235,236,0.82)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderBottom: "1px solid rgba(5,0,2,0.08)",
    display: "flex",
    alignItems: "center",
  }}
>
  <div
    style={{
      width: "min(1160px, calc(100% - 40px))",
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
    }}
  >
    <VerloBrand />
  </div>
</header>

        <section className="intro">
          <span className="eyebrow">
            PROPIEDADES
            COMPATIBLES
          </span>

          <h1>
            Encontramos
            opciones
            <br />
            <em>
              para vos.
            </em>
          </h1>

          <p>
            Miralas y
            elegí todas
            las que te
            interesen.
          </p>
        </section>

        {data.matches
          .length ===
        0 ? (
          <section className="empty">
            <h2>
              Todavía no
              hay propiedades
              listas para
              mostrarte.
            </h2>

            <p>
              Te avisamos
              cuando alguna
              propiedad
              compatible esté
              completa.
            </p>
          </section>
        ) : (
          <>
            <section className="grid">
              {data.matches.map(
                (
                  match
                ) => (
                  <PropertyCard
                    key={
                      match.id
                    }
                    match={
                      match
                    }
                    selected={selected.includes(
                      match.id
                    )}
                    onToggle={() =>
                      toggleMatch(
                        match.id
                      )
                    }
                  />
                )
              )}
            </section>

            <section className="bottom">
              <div>
                <strong>
                  {
                    selected.length
                  }{" "}
                  seleccionada
                  {selected.length ===
                  1
                    ? ""
                    : "s"}
                </strong>

                <span>
                  Podés elegir
                  una o varias.
                </span>
              </div>

              <button
                onClick={
                  continueFlow
                }
                disabled={
                  selected.length ===
                  0
                }
              >
                ME INTERESA
              </button>
            </section>

            {error && (
              <div className="error">
                {error}
              </div>
            )}
          </>
        )}
      </main>

      <Styles />
    </>
  )
}

function PropertyCard({
  match,
  selected,
  onToggle,
}: {
  match: MatchItem
  selected: boolean
  onToggle: () => void
}) {
  const [
    mediaIndex,
    setMediaIndex,
  ] =
    useState(0)

  const media =
    match.media[
      mediaIndex
    ]

  return (
    <article
      className={
        selected
          ? "card selected"
          : "card"
      }
    >
      <div className="media">
        {media?.url ? (
          media.type ===
          "video" ? (
            <video
              src={
                media.url
              }
              controls
              playsInline
            />
          ) : (
            <img
              src={
                media.url
              }
              alt="Propiedad"
            />
          )
        ) : (
          <div className="placeholder">
            Sin imagen
          </div>
        )}

        <span className="score">
          MATCH{" "}
          {
            match.score
          }
          %
        </span>
      </div>

      {match.media
        .length > 1 && (
        <div className="thumbs">
          {match.media.map(
            (
              item,
              index
            ) => (
              <button
                key={
                  item.id
                }
                type="button"
                className={
                  index ===
                  mediaIndex
                    ? "thumb active"
                    : "thumb"
                }
                onClick={() =>
                  setMediaIndex(
                    index
                  )
                }
              >
                {item.url &&
                  (item.type ===
                  "video" ? (
                    <video
                      src={
                        item.url
                      }
                      muted
                    />
                  ) : (
                    <img
                      src={
                        item.url
                      }
                      alt=""
                    />
                  ))}
              </button>
            )
          )}
        </div>
      )}

      <div className="content">
        <div className="location">
          {
            match
              .property
              .neighborhood
          }
        </div>

        <h2>
          {humanize(
            match
              .property
              .property_type
          ) ||
            "Propiedad"}

          {match
            .property
            .rooms
            ? ` · ${match.property.rooms}`
            : ""}
        </h2>

        {match
          .property
          .price && (
          <strong className="price">
            {money(
              match
                .property
                .price
            )}
            <small>
              {" "}
              / mes
            </small>
          </strong>
        )}

        <div className="facts">
          {match
            .property
            .expenses !==
            null && (
            <span>
              Expensas:{" "}
              {money(
                match
                  .property
                  .expenses
              )}
            </span>
          )}

          {match
            .property
            .availability && (
            <span>
              Disponible:{" "}
              {
                match
                  .property
                  .availability
              }
            </span>
          )}
        </div>

        {match
          .property
          .requirements && (
          <p>
            {String(
              match
                .property
                .requirements
            )}
          </p>
        )}

        <button
          type="button"
          className="select"
          onClick={
            onToggle
          }
        >
          {selected
            ? "✓ ME INTERESA"
            : "ME INTERESA"}
        </button>
      </div>
    </article>
  )
}

function Styles() {
  return (
    <style jsx global>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f8f6f1;
        color: #161616;
        font-family: Arial,
          sans-serif;
      }

      .page {
        max-width: 1180px;
        margin: 0 auto;
        padding: 30px 24px 80px;
      }

      .count {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        padding: 10px 14px;
        border: 1px solid #161616;
        border-radius: 999px;
      }

      .intro {
        margin-bottom: 42px;
      }

      .eyebrow {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.12em;
      }

      .intro h1 {
        font-size: clamp(
          46px,
          7vw,
          86px
        );
        line-height: 0.95;
        letter-spacing: -0.055em;
        margin: 14px 0 20px;
      }

      .intro h1 em {
        font-weight: inherit;
      }

      .intro p {
        font-size: 18px;
        max-width: 480px;
        line-height: 1.5;
      }

      .grid {
        display: grid;
        grid-template-columns:
          repeat(
            2,
            minmax(
              0,
              1fr
            )
          );
        gap: 28px;
      }

      .card {
        background: white;
        border: 2px solid transparent;
        border-radius: 24px;
        overflow: hidden;
        transition: 0.2s ease;
      }

      .card.selected {
        border-color: #161616;
        transform: translateY(
          -2px
        );
      }

      .media {
        position: relative;
        aspect-ratio: 4 / 3;
        background: #ddd;
      }

      .media img,
      .media video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .score {
        position: absolute;
        top: 16px;
        right: 16px;
        background: white;
        border-radius: 999px;
        padding: 9px 12px;
        font-size: 12px;
        font-weight: 900;
      }

      .placeholder {
        height: 100%;
        display: grid;
        place-items: center;
      }

      .thumbs {
        display: flex;
        gap: 8px;
        padding: 10px 14px 0;
        overflow-x: auto;
      }

      .thumb {
        width: 58px;
        height: 44px;
        padding: 0;
        border: 2px solid transparent;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        background: #eee;
        flex: 0 0 auto;
      }

      .thumb.active {
        border-color: #161616;
      }

      .thumb img,
      .thumb video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .content {
        padding: 24px;
      }

      .location {
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .content h2 {
        font-size: 28px;
        margin: 8px 0 14px;
        letter-spacing: -0.03em;
      }

      .price {
        display: block;
        font-size: 24px;
        margin-bottom: 18px;
      }

      .price small {
        font-size: 13px;
        font-weight: 500;
      }

      .facts {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 14px;
        margin-bottom: 18px;
      }

      .content p {
        font-size: 14px;
        line-height: 1.5;
      }

      .select {
        width: 100%;
        margin-top: 18px;
        min-height: 52px;
        border-radius: 999px;
        border: 1px solid #161616;
        background: white;
        font-weight: 900;
        cursor: pointer;
      }

      .selected .select {
        background: #161616;
        color: white;
      }

      .bottom {
        position: sticky;
        bottom: 18px;
        margin-top: 34px;
        background: #161616;
        color: white;
        border-radius: 20px;
        padding: 18px 22px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
      }

      .bottom div {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .bottom span {
        font-size: 12px;
        opacity: 0.72;
      }

      .bottom button {
        border: 0;
        border-radius: 999px;
        padding: 15px 24px;
        background: white;
        color: #161616;
        font-weight: 900;
        cursor: pointer;
      }

      .bottom button:disabled {
        opacity: 0.4;
        cursor: default;
      }

      .error {
        margin-top: 16px;
        padding: 14px;
        background: #ffe3e3;
        border-radius: 12px;
      }

      .empty {
        background: white;
        border-radius: 24px;
        padding: 40px;
      }

      .centered {
        min-height: 100vh;
        display: grid;
        place-content: center;
        text-align: center;
        gap: 20px;
        padding: 24px;
      }

      @media (
        max-width: 760px
      ) {
        .page {
          padding:
            22px
            16px
            70px;
        }

        header {
          margin-bottom: 44px;
        }

        .grid {
          grid-template-columns: 1fr;
        }

        .intro h1 {
          font-size: 52px;
        }

        .bottom {
          bottom: 10px;
          padding: 14px;
        }

        .bottom button {
          padding: 13px 18px;
        }
      }
    `}</style>
  )
}
