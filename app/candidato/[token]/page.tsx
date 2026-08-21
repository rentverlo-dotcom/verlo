"use client"

import {
  useEffect,
  useState,
} from "react"
import { useParams } from "next/navigation"
import VerloBrand from "@/components/VerloBrand"

type CandidateData = {
  match: {
    id: string
    score: number
    reasons: Record<string, unknown>
    tenant_interest: boolean
    owner_interest: boolean
    ready_to_connect: boolean
  }

  tenant: {
    first_name: string
    budget_max: number | null
    move_timing: string | null
    property_type: string | null
    rooms: string | null
    income_proof_type: string | null
    income_range: string | null
    income_max: number | null
    guarantee_types: string[]
  }
}

function money(
  value: number | null
) {
  if (!value) return "—"

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
  if (!value) return "—"

  const labels:
    Record<string, string> = {
      salary_receipt:
        "Recibo de sueldo",

      monotributo:
        "Monotributo",

      self_employed:
        "Autónomo",

      property_guarantee:
        "Garantía propietaria",

      surety_insurance:
        "Seguro de caución",

      salary_guarantors:
        "Garantes con recibo",

      apartment:
        "Departamento",

      house:
        "Casa",

      ph:
        "PH",
    }

  return (
    labels[value] ||
    value
      .replace(/_/g, " ")
      .replace(/-/g, " ")
  )
}

export default function CandidatePage() {
  const params =
    useParams<{
      token: string
    }>()

  const token =
    String(
      params?.token || ""
    )

  const [data, setData] =
    useState<CandidateData | null>(
      null
    )

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [sending, setSending] =
    useState(false)

  const [accepted, setAccepted] =
    useState(false)

  useEffect(() => {
    async function load() {
      try {
        const response =
          await fetch(
            `/api/candidate-view?token=${encodeURIComponent(
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
              "No pudimos abrir este candidato."
          )
        }

        setData(json)

        if (
          json.match
            ?.owner_interest
        ) {
          setAccepted(true)
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No pudimos abrir este candidato."
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  async function accept() {
    setSending(true)

    try {
      const response =
        await fetch(
          "/api/owner-interest",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token,
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
            "No pudimos registrar tu decisión."
        )
      }

      setAccepted(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error."
      )
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <VerloBrand />

          <p>
            Cargando candidato...
          </p>
        </div>
      </main>
    )
  }

  if (
    !data ||
    error
  ) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <VerloBrand />

          <h1>
            No pudimos abrir
            este candidato.
          </h1>

          <p>{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <VerloBrand />

          <div style={styles.score}>
            MATCH{" "}
            {data.match.score}%
          </div>
        </header>

        <div style={styles.hero}>
          <div>
            <div style={styles.eyebrow}>
              QUIERE AVANZAR CON TU PROPIEDAD
            </div>

            <h1 style={styles.title}>
              Conocé a
              <br />
              <em>
                {data.tenant.first_name}.
              </em>
            </h1>

            <p style={styles.lead}>
              Esta persona vio tu
              propiedad y confirmó
              que quiere avanzar.
            </p>
          </div>

          <div style={styles.pinkCard}>
            <span>
              compatibilidad
            </span>

            <strong style={styles.bigScore}>
              {data.match.score}%
            </strong>
          </div>
        </div>

        <section style={styles.grid}>
          <Fact
            label="Presupuesto"
            value={money(
              data.tenant
                .budget_max
            )}
          />

          <Fact
            label="Mudanza"
            value={
              data.tenant
                .move_timing ||
              "—"
            }
          />

          <Fact
            label="Busca"
            value={humanize(
              data.tenant
                .property_type
            )}
          />

          <Fact
            label="Ambientes"
            value={
              data.tenant.rooms ||
              "—"
            }
          />

          <Fact
            label="Ingresos"
            value={humanize(
              data.tenant
                .income_proof_type
            )}
          />

          <Fact
            label="Ingreso estimado"
            value={money(
              data.tenant
                .income_max
            )}
          />
        </section>

        <section style={styles.blueCard}>
          <div style={styles.eyebrow}>
            GARANTÍAS
          </div>

          <div style={styles.chips}>
            {data.tenant
              .guarantee_types
              .map(
                (item) => (
                  <span
                    key={item}
                    style={
                      styles.chip
                    }
                  >
                    {humanize(
                      item
                    )}
                  </span>
                )
              )}
          </div>
        </section>

        <section style={styles.privacy}>
          <strong>
            Todavía no compartimos
            datos personales.
          </strong>

          <p>
            Si vos también querés
            avanzar, VERLO confirma el
            doble OK y los conecta para
            coordinar la visita.
          </p>
        </section>

        {!accepted ? (
          <button
            onClick={accept}
            disabled={sending}
            style={styles.button}
          >
            {sending
              ? "Guardando..."
              : "Sí, quiero avanzar"}
          </button>
        ) : (
          <div style={styles.success}>
            <strong>
              ✓ Tu OK quedó registrado.
            </strong>

            <span>
              Si ambos confirmaron,
              VERLO los va a conectar.
            </span>
          </div>
        )}
      </section>
    </main>
  )
}

function Fact({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={styles.fact}>
      <span style={styles.factLabel}>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  )
}

const styles:
  Record<
    string,
    React.CSSProperties
  > = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 8% 8%, rgba(242,168,169,.52), transparent 26%), radial-gradient(circle at 92% 85%, rgba(116,190,220,.32), transparent 28%), #f2ebec",
    padding: "22px",
    fontFamily:
      "Inter, system-ui, sans-serif",
    color: "#050002",
  },

  shell: {
    width: "min(1000px,100%)",
    margin: "0 auto",
  },

  card: {
    width: "min(520px,100%)",
    margin: "80px auto",
    padding: "30px",
    background: "white",
    borderRadius: "28px",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "70px",
  },

  score: {
    background: "#050002",
    color: "white",
    padding: "10px 15px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 900,
  },

  hero: {
    display: "grid",
    gridTemplateColumns:
      "1fr minmax(180px,260px)",
    gap: "30px",
    alignItems: "end",
  },

  eyebrow: {
    fontSize: "11px",
    fontWeight: 950,
    letterSpacing: ".15em",
  },

  title: {
    margin: "14px 0 0",
    fontSize:
      "clamp(56px,9vw,100px)",
    lineHeight: ".92",
    letterSpacing: "-.055em",
  },

  lead: {
    maxWidth: "550px",
    fontSize: "19px",
    lineHeight: 1.5,
    color:
      "rgba(5,0,2,.65)",
  },

  pinkCard: {
    background: "#f2a8a9",
    borderRadius: "26px",
    padding: "24px",
  },

  bigScore: {
    display: "block",
    fontSize: "58px",
    letterSpacing: "-.06em",
  },

  grid: {
    marginTop: "42px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: "10px",
  },

  fact: {
    background:
      "rgba(255,255,255,.75)",
    padding: "20px",
    borderRadius: "20px",
  },

  factLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "11px",
    textTransform:
      "uppercase",
    opacity: 0.55,
  },

  blueCard: {
    marginTop: "18px",
    padding: "26px",
    borderRadius: "26px",
    background: "#74bedc",
  },

  chips: {
    marginTop: "16px",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  chip: {
    background:
      "rgba(255,255,255,.65)",
    padding: "9px 12px",
    borderRadius: "999px",
    fontWeight: 800,
  },

  privacy: {
    marginTop: "18px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "rgba(255,255,255,.7)",
  },

  button: {
    width: "100%",
    minHeight: "64px",
    marginTop: "28px",
    background: "#050002",
    color: "white",
    border: 0,
    borderRadius: "999px",
    fontSize: "18px",
    fontWeight: 950,
    cursor: "pointer",
  },

  success: {
    marginTop: "28px",
    padding: "24px",
    borderRadius: "24px",
    background: "#f2a8a9",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
}
