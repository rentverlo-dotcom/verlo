"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useParams,
} from "next/navigation"

import VerloBrand from "@/components/VerloBrand"

type MatchStage =
  | "new"
  | "in_progress"
  | "ready"
  | "closed"

type CandidateItem = {
  match: {
    id: string
    score: number
    reasons: Record<
      string,
      unknown
    >
    status: string
    stage: MatchStage
    created_at:
      | string
      | null
    tenant_interest: boolean
    tenant_verified: boolean
    owner_interest: boolean
    ready_to_connect: boolean
    introduced: boolean
    requires_owner_action: boolean
    waiting_tenant: boolean
    waiting_verification: boolean
    operation_active: boolean

    tenant_post_visit_decision:
      | "yes"
      | "no"
      | null

    tenant_post_visit_decided_at:
      | string
      | null

    owner_post_visit_decision:
      | "yes"
      | "no"
      | null

    owner_post_visit_decided_at:
      | string
      | null

    owner_closing_url:
      | string
      | null
  }

  tenant: {
    first_name: string

    budget_range:
      | string
      | null

    budget_max:
      | number
      | null

    move_timing:
      | string
      | null

    property_type:
      | string
      | null

    rooms:
      | string
      | null

    neighborhood:
      | string
      | null

    income_proof_type:
      | string
      | null

    income_range:
      | string
      | null

    income_max:
      | number
      | null

    guarantee_types:
      string[]

    employment_status:
      | string
      | null

    guarantee_type:
      | string
      | null

    move_notes:
      | string
      | null
  }

  verification: {
    exists: boolean

    status:
      | string
      | null

    has_dni_front: boolean
    has_dni_back: boolean
    has_selfie: boolean
    has_income_proof: boolean
    reviewed: boolean
  }
}

type CandidatesData = {
  ok: boolean

  owner: {
    id: string

    first_name:
      | string
      | null

    zone:
      | string
      | null

    neighborhood:
      | string
      | null

    property_type:
      | string
      | null

    rooms:
      | string
      | null

    approx_price:
      | string
      | null

    approx_price_number:
      | number
      | null

    availability_status:
      | string
      | null
  }

  count: number

  counts: {
    new: number
    in_progress: number
    ready: number
    closed: number
  }

  candidates:
    CandidateItem[]
}

function money(
  value:
    | number
    | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—"
  }

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
  if (!value) {
    return "—"
  }

  const dictionary:
    Record<
      string,
      string
    > = {

          "hasta-500000":
        "Hasta $500.000",

      "500001-700000":
        "$500.001 a $700.000",

      "700001-900000":
        "$700.001 a $900.000",

      "900001-1200000":
        "$900.001 a $1.200.000",

      "1200001-1500000":
        "$1.200.001 a $1.500.000",

      "1500001-2000000":
        "$1.500.001 a $2.000.000",

      "2000000-plus":
        "Más de $2.000.000",

      "0-500000":
        "Hasta $500.000",

      "500001-1000000":
        "$500.001 a $1.000.000",

      "1000001-1500000":
        "$1.000.001 a $1.500.000",

      "1500001-2000000":
        "$1.500.001 a $2.000.000",

      "2000001-3000000":
        "$2.000.001 a $3.000.000",

      "3000001-plus":
        "Más de $3.000.000",
      apartment:
        "Departamento",

      house:
        "Casa",

      ph:
        "PH",

      studio:
        "Monoambiente",

      salary_receipt:
        "Recibo de sueldo",

      monotributo:
        "Monotributo",

      self_employed:
        "Autónomo",

      other_formal:
        "Otros ingresos formales",

      property_guarantee:
        "Garantía propietaria",

      surety_insurance:
        "Seguro de caución",

      salary_guarantors:
        "Garantes con recibo",

      now:
        "Ahora",

      "1_to_3_months":
        "En 1 a 3 meses",

      "6_months_plus":
        "En 6 meses o más",
    }

  return (
    dictionary[value] ||
    value
      .replace(
        /_/g,
        " "
      )
      .replace(
        /-/g,
        " "
      )
  )
}

function sectionTitle(
  stage: MatchStage
) {
  if (
    stage === "new"
  ) {
    return "Nuevos matches"
  }

  if (
    stage ===
    "in_progress"
  ) {
    return "En proceso"
  }

  if (
    stage === "ready"
  ) {
    return "Doble OK"
  }

  return "Cerrados"
}

function sectionDescription(
  stage: MatchStage
) {
  if (
    stage === "new"
  ) {
    return "Personas compatibles con tu propiedad."
  }

  if (
    stage ===
    "in_progress"
  ) {
    return "Matches donde alguna de las partes ya decidió avanzar."
  }

  if (
    stage === "ready"
  ) {
    return "Los dos quieren avanzar. Estos matches ya pasaron al tramo operativo."
  }

  return "Operaciones que ya completaron el proceso de matching."
}

export default function CandidatesPage() {
  const params =
    useParams<{
      token: string
    }>()

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
      CandidatesData | null
    >(null)

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState("")

  const [
    sendingMatchId,
    setSendingMatchId,
  ] =
    useState<
      string | null
    >(null)

  async function loadCandidates(
    silent = false
  ) {
    if (!token) {
      return
    }

    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const response =
        await fetch(
          `/api/candidates-view?token=${encodeURIComponent(
            token
          )}`,
          {
            cache:
              "no-store",
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
            "No pudimos abrir tus matches."
        )
      }

      setData(json)
      setError("")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos abrir tus matches."
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadCandidates()
  }, [token])

  async function acceptCandidate(
    matchId: string
  ) {
    setSendingMatchId(
      matchId
    )

    setError("")

    try {
      const response =
        await fetch(
          "/api/owner-interest",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token,
                match_id:
                  matchId,
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

      await loadCandidates(
        true
      )

      if (
        json.ready_to_connect &&
        json.owner_closing_url
      ) {
        window.location.href =
          json.owner_closing_url
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error."
      )
    } finally {
      setSendingMatchId(
        null
      )
    }
  }

  if (loading) {
    return (
      <>
        <main className="centered">
          <VerloBrand />

          <p>
            Cargando tus matches...
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
            No pudimos abrir
            tus matches.
          </h1>

          <p>{error}</p>
        </main>

        <Styles />
      </>
    )
  }

  if (!data) {
    return null
  }

  const stages:
    MatchStage[] = [
      "new",
      "in_progress",
      "ready",
      "closed",
    ]

  return (
    <>
      <main className="page">
        <header className="header">
          <div className="header-inner">
            <VerloBrand />

            <button
              type="button"
              className="refresh-button"
              disabled={
                refreshing
              }
              onClick={() =>
                loadCandidates(
                  true
                )
              }
            >
              {refreshing
                ? "Actualizando..."
                : "Actualizar"}
            </button>
          </div>
        </header>

        <section className="intro">
          <span className="eyebrow">
            TUS MATCHES
          </span>

          <h1>
            Todo pasa
            <br />

            <em>
              desde acá.
            </em>
          </h1>

          <p className="intro-copy">
            Acá vas a ver todas
            las personas compatibles
            con tu propiedad y en
            qué etapa está cada
            una.
          </p>

          <div className="property-summary">
            <span>
              TU PROPIEDAD
            </span>

            <strong>
              {humanize(
                data.owner
                  .property_type
              )}

              {data.owner.rooms
                ? ` · ${data.owner.rooms}`
                : ""}
            </strong>

            <p>
              {data.owner
                .neighborhood ||
                data.owner.zone ||
                "Ubicación cargada"}
            </p>

            {data.owner
              .approx_price_number !==
              null && (
              <b>
                {money(
                  data.owner
                    .approx_price_number
                )}{" "}
                / mes
              </b>
            )}
          </div>
        </section>

        <section className="summary-grid">
          <SummaryCard
            label="Nuevos"
            value={
              data.counts.new
            }
          />

          <SummaryCard
            label="En proceso"
            value={
              data.counts
                .in_progress
            }
          />

          <SummaryCard
            label="Doble OK"
            value={
              data.counts.ready
            }
          />

          <SummaryCard
            label="Cerrados"
            value={
              data.counts.closed
            }
          />
        </section>

        {data.candidates
          .length === 0 ? (
          <section className="empty">
            <span className="eyebrow">
              TODAVÍA NO
            </span>

            <h2>
              Todavía no tenés
              matches.
            </h2>

            <p>
              Cuando aparezca una
              persona compatible
              con tu propiedad,
              la vas a ver acá y
              te vamos a avisar.
            </p>
          </section>
        ) : (
          <div className="sections">
            {stages.map(
              (stage) => {
                const items =
                  data.candidates
                    .filter(
                      (
                        candidate
                      ) =>
                        candidate
                          .match
                          .stage ===
                        stage
                    )

                if (
                  items.length ===
                  0
                ) {
                  return null
                }

                return (
                  <section
                    key={stage}
                    className="match-section"
                  >
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">
                          {sectionTitle(
                            stage
                          ).toUpperCase()}
                        </span>

                        <h2>
                          {sectionTitle(
                            stage
                          )}
                        </h2>

                        <p>
                          {sectionDescription(
                            stage
                          )}
                        </p>
                      </div>

                      <strong className="section-count">
                        {
                          items.length
                        }
                      </strong>
                    </div>

                    <div className="candidate-grid">
                      {items.map(
                        (
                          candidate,
                          index
                        ) => (
                          <CandidateCard
                            key={
                              candidate
                                .match
                                .id
                            }
                            candidate={
                              candidate
                            }
                            number={
                              index +
                              1
                            }
                            sending={
                              sendingMatchId ===
                              candidate
                                .match
                                .id
                            }
                            onAccept={() =>
                              acceptCandidate(
                                candidate
                                  .match
                                  .id
                              )
                            }
                          />
                        )
                      )}
                    </div>
                  </section>
                )
              }
            )}
          </div>
        )}

        <section className="privacy">
          <strong>
            Los datos privados
            siguen protegidos.
          </strong>

          <p>
            Los matches nuevos
            muestran solamente la
            información necesaria
            para entender la
            compatibilidad. Los datos
            de contacto se habilitan
            cuando ambas partes
            deciden avanzar.
          </p>
        </section>

        {error &&
          data && (
            <div className="global-error">
              {error}
            </div>
          )}
      </main>

      <Styles />
    </>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <article className="summary-card">
      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>
    </article>
  )
}

function CandidateCard({
  candidate,
  number,
  sending,
  onAccept,
}: {
  candidate:
    CandidateItem

  number:
    number

  sending:
    boolean

  onAccept:
    () => void
}) {
  const {
    match,
    tenant,
    verification,
  } =
    candidate

  return (
    <article
      className={`candidate-card stage-${match.stage}`}
    >
      <div className="candidate-top">
        <div>
          <span className="candidate-number">
            MATCH{" "}
            {String(
              number
            ).padStart(
              2,
              "0"
            )}
          </span>

          <h3>
            {
              tenant.first_name
            }
          </h3>
        </div>

        <div className="score">
          <span>
            COMPATIBILIDAD
          </span>

          <strong>
            {match.score}%
          </strong>
        </div>
      </div>

      <MatchStatus
        match={match}
      />

      <div className="facts">
        <Fact
          label="Presupuesto"
          value={
            tenant.budget_max
              ? money(
                  tenant.budget_max
                )
              : tenant
                  .budget_range ||
                "—"
          }
        />

        <Fact
          label="Mudanza"
          value={humanize(
            tenant
              .move_timing
          )}
        />

        <Fact
          label="Busca"
          value={humanize(
            tenant
              .property_type
          )}
        />

        <Fact
          label="Ambientes"
          value={
            tenant.rooms ||
            "—"
          }
        />

        <Fact
          label="Zona"
          value={
            tenant
              .neighborhood ||
            "—"
          }
        />

        <Fact
          label="Ingresos"
          value={
            tenant
              .income_range ||
            (tenant
              .income_max
              ? money(
                  tenant
                    .income_max
                )
              : "—")
          }
        />
      </div>

      {match.tenant_interest && (
        <>
          <div className="divider" />

          <div className="interest-details">
            <span className="section-label">
              INTERÉS
            </span>

            <div className="status-list">
              <StatusLine
                active={
                  match
                    .tenant_interest
                }
                text="Quiere avanzar con tu propiedad"
              />

              <StatusLine
                active={
                  match
                    .owner_interest
                }
                text="Vos también diste OK"
              />
            </div>
          </div>
        </>
      )}

      {verification.exists && (
        <>
          <div className="divider" />

          <div className="documents">
            <span className="section-label">
              PERFIL
            </span>

            <div className="document-list">
              <DocumentState
                label="DNI"
                complete={
                  verification
                    .has_dni_front &&
                  verification
                    .has_dni_back
                }
              />

              <DocumentState
                label="Selfie"
                complete={
                  verification
                    .has_selfie
                }
              />

              <DocumentState
                label="Ingresos"
                complete={
                  verification
                    .has_income_proof
                }
                optional
              />
            </div>
          </div>
        </>
      )}

      {tenant
        .guarantee_types
        .length >
        0 && (
        <>
          <div className="divider" />

          <div className="guarantees">
            <span className="section-label">
              GARANTÍA
            </span>

            <div className="chips">
              {tenant
                .guarantee_types
                .map(
                  (
                    item
                  ) => (
                    <span
                      key={
                        item
                      }
                      className="chip"
                    >
                      {humanize(
                        item
                      )}
                    </span>
                  )
                )}
            </div>
          </div>
        </>
      )}

      {match
        .requires_owner_action ? (
        <button
          type="button"
          className="accept-button"
          disabled={
            sending
          }
          onClick={
            onAccept
          }
        >
          {sending
            ? "Guardando..."
            : "Quiero avanzar"}
        </button>
      ) : match
          .ready_to_connect ? (
        <>
          <div className="ready-box">
            <strong>
              Doble OK
            </strong>

            <span>
              {match
                .owner_post_visit_decision ===
              "yes"
                ? match
                    .tenant_post_visit_decision ===
                  "yes"
                  ? "Los dos confirmaron después de la visita."
                  : "Vos querés avanzar. Falta la decisión del inquilino."
                : match
                    .owner_post_visit_decision ===
                  "no"
                  ? "Marcaste que por ahora no querés avanzar. Podés cambiar tu decisión."
                  : "Los dos quieren avanzar. Esta operación ya está en el tramo de visita y cierre."}
            </span>
          </div>

          {match
            .owner_closing_url && (
            <button
              type="button"
              className="operation-button"
              onClick={() => {
                window.location.href =
                  match
                    .owner_closing_url as string
              }}
            >
              VER OPERACIÓN / CAMBIAR DECISIÓN
            </button>
          )}
        </>
      ) : match
          .owner_interest ? (
        <div className="waiting-box">
          <strong>
            Expresaste interés
          </strong>

          <span>
            Estamos esperando la
            decisión del inquilino.
            Ya le avisamos para que
            entre a Verlo.
          </span>
        </div>
      ) : (
        <div className="waiting-box">
          <strong>
            Nuevo match
          </strong>

          <span>
            Encontramos compatibilidad.
            Podés decidir ahora si
            querés avanzar.
          </span>
        </div>
      )}
    </article>
  )
}

function MatchStatus({
  match,
}: {
  match:
    CandidateItem["match"]
}) {
  if (
    match.stage ===
    "closed"
  ) {
    return (
      <div className="match-status">
        <span className="status-dot" />

        Operación cerrada
      </div>
    )
  }

  if (
    match.ready_to_connect
  ) {
    return (
      <div className="match-status">
        <span className="status-dot" />

        Doble OK
      </div>
    )
  }

  if (
    match.requires_owner_action
  ) {
    return (
      <div className="match-status action">
        <span className="status-dot" />

        Esperando tu decisión
      </div>
    )
  }

  if (
    match.waiting_tenant
  ) {
    return (
      <div className="match-status">
        <span className="status-dot" />

        Esperando al inquilino
      </div>
    )
  }

  if (
    match.tenant_interest
  ) {
    return (
      <div className="match-status">
        <span className="status-dot" />

        Quiere avanzar
      </div>
    )
  }

  return (
    <div className="match-status">
      <span className="status-dot" />

      Nuevo match
    </div>
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
    <div className="fact">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  )
}

function StatusLine({
  active,
  text,
}: {
  active: boolean
  text: string
}) {
  return (
    <div
      className={
        active
          ? "status-line active"
          : "status-line"
      }
    >
      <span>
        {active
          ? "✓"
          : "·"}
      </span>

      {text}
    </div>
  )
}

function DocumentState({
  label,
  complete,
  optional = false,
}: {
  label: string
  complete: boolean
  optional?: boolean
}) {
  return (
    <div className="document-state">
      <span>
        {complete
          ? "✓"
          : "·"}
      </span>

      <div>
        <strong>
          {label}
        </strong>

        <small>
          {complete
            ? "Completo"
            : optional
              ? "Sin adjuntar"
              : "Pendiente"}
        </small>
      </div>
    </div>
  )
}

function Styles() {
  return (
    <style jsx global>{`
      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #f2ebec;
        color: #050002;
        font-family:
          Inter,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      button,
      input,
      textarea,
      select {
        font: inherit;
      }

      .page {
        min-height: 100vh;
        padding-bottom: 80px;
      }

      .header {
        position: sticky;
        top: 0;
        z-index: 30;
        background: rgba(
          242,
          235,
          236,
          0.88
        );
        backdrop-filter: blur(18px);
        border-bottom: 1px solid
          rgba(
            5,
            0,
            2,
            0.08
          );
      }

      .header-inner {
        width: min(
          1180px,
          calc(
            100% - 32px
          )
        );
        min-height: 78px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content:
          space-between;
        gap: 20px;
      }

      .refresh-button {
        border: 1px solid
          rgba(
            5,
            0,
            2,
            0.14
          );
        background: white;
        color: #050002;
        border-radius: 999px;
        padding: 10px 16px;
        font-weight: 800;
        cursor: pointer;
      }

      .refresh-button:disabled {
        opacity: 0.55;
        cursor: default;
      }

      .intro {
        width: min(
          1180px,
          calc(
            100% - 32px
          )
        );
        margin: 0 auto;
        padding: 64px 0 32px;
      }

      .eyebrow,
      .section-label {
        display: block;
        font-size: 12px;
        line-height: 1;
        letter-spacing: 0.13em;
        font-weight: 950;
        text-transform: uppercase;
      }

      .intro h1 {
        max-width: 760px;
        margin: 14px 0 20px;
        font-size: clamp(
          44px,
          8vw,
          90px
        );
        line-height: 0.9;
        letter-spacing: -0.065em;
        font-weight: 950;
      }

      .intro h1 em {
        font-family: Georgia,
          serif;
        font-weight: 400;
      }

      .intro-copy {
        max-width: 600px;
        margin: 0;
        font-size: 18px;
        line-height: 1.55;
      }

      .property-summary {
        margin-top: 32px;
        max-width: 480px;
        padding: 24px;
        border-radius: 28px;
        background: white;
        box-shadow:
          0 18px 60px
          rgba(
            5,
            0,
            2,
            0.07
          );
      }

      .property-summary > span {
        display: block;
        margin-bottom: 10px;
        font-size: 11px;
        letter-spacing: 0.13em;
        font-weight: 950;
      }

      .property-summary strong {
        display: block;
        font-size: 24px;
        letter-spacing: -0.03em;
      }

      .property-summary p {
        margin: 8px 0;
      }

      .property-summary b {
        display: block;
        margin-top: 10px;
        font-size: 18px;
      }

      .summary-grid {
        width: min(
          1180px,
          calc(
            100% - 32px
          )
        );
        margin: 0 auto 54px;
        display: grid;
        grid-template-columns:
          repeat(
            4,
            1fr
          );
        gap: 12px;
      }

      .summary-card {
        padding: 22px;
        border-radius: 24px;
        background: white;
      }

      .summary-card strong {
        display: block;
        font-size: 36px;
        line-height: 1;
        letter-spacing: -0.05em;
      }

      .summary-card span {
        display: block;
        margin-top: 8px;
        font-weight: 800;
      }

      .sections {
        width: min(
          1180px,
          calc(
            100% - 32px
          )
        );
        margin: 0 auto;
      }

      .match-section {
        margin-bottom: 72px;
      }

      .section-heading {
        display: flex;
        align-items: flex-end;
        justify-content:
          space-between;
        gap: 24px;
        margin-bottom: 24px;
      }

      .section-heading h2 {
        margin: 8px 0 6px;
        font-size: clamp(
          30px,
          5vw,
          48px
        );
        line-height: 1;
        letter-spacing: -0.05em;
      }

      .section-heading p {
        margin: 0;
        max-width: 620px;
        line-height: 1.5;
        opacity: 0.7;
      }

      .section-count {
        flex: 0 0 auto;
        width: 54px;
        height: 54px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #050002;
        color: white;
        font-size: 20px;
      }

      .candidate-grid {
        display: grid;
        grid-template-columns:
          repeat(
            2,
            minmax(
              0,
              1fr
            )
          );
        gap: 18px;
      }

      .candidate-card {
        padding: 28px;
        border-radius: 32px;
        background: white;
        box-shadow:
          0 20px 70px
          rgba(
            5,
            0,
            2,
            0.06
          );
      }

      .stage-ready {
        box-shadow:
          0 0 0 2px
          #e7c776,
          0 20px 70px
          rgba(
            5,
            0,
            2,
            0.06
          );
      }

      .candidate-top {
        display: flex;
        align-items: flex-start;
        justify-content:
          space-between;
        gap: 18px;
      }

      .candidate-number {
        display: block;
        margin-bottom: 8px;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: 0.13em;
      }

      .candidate-top h3 {
        margin: 0;
        font-size: 32px;
        letter-spacing: -0.05em;
      }

      .score {
        text-align: right;
      }

      .score span {
        display: block;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 0.11em;
      }

      .score strong {
        display: block;
        margin-top: 4px;
        font-size: 28px;
        line-height: 1;
      }

      .match-status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 18px;
        padding: 9px 13px;
        border-radius: 999px;
        background: #f2ebec;
        font-size: 13px;
        font-weight: 850;
      }

      .match-status.action {
        background: #e7c776;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        flex: 0 0 auto;
        border-radius: 50%;
        background: #c37986;
      }

      .facts {
        display: grid;
        grid-template-columns:
          repeat(
            2,
            minmax(
              0,
              1fr
            )
          );
        gap: 10px;
        margin-top: 22px;
      }

      .fact {
        min-width: 0;
        padding: 14px;
        border-radius: 18px;
        background: #f2ebec;
      }

      .fact span {
        display: block;
        margin-bottom: 5px;
        font-size: 11px;
        opacity: 0.65;
      }

      .fact strong {
        display: block;
        font-size: 14px;
        line-height: 1.3;
        overflow-wrap: anywhere;
      }

      .divider {
        height: 1px;
        margin: 24px 0;
        background:
          rgba(
            5,
            0,
            2,
            0.08
          );
      }

      .status-list {
        display: grid;
        gap: 10px;
        margin-top: 14px;
      }

      .status-line {
        display: flex;
        gap: 10px;
        align-items: center;
        opacity: 0.55;
      }

      .status-line.active {
        opacity: 1;
        font-weight: 800;
      }

      .status-line span {
        width: 22px;
        height: 22px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #f2ebec;
      }

      .document-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
      }

      .document-state {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 15px;
        background: #f2ebec;
      }

      .document-state > span {
        font-weight: 950;
      }

      .document-state strong,
      .document-state small {
        display: block;
      }

      .document-state strong {
        font-size: 12px;
      }

      .document-state small {
        margin-top: 2px;
        font-size: 10px;
        opacity: 0.6;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }

      .chip {
        padding: 8px 11px;
        border-radius: 999px;
        background: #f2ebec;
        font-size: 12px;
        font-weight: 800;
      }

      .accept-button {
        width: 100%;
        margin-top: 26px;
        border: 0;
        border-radius: 999px;
        padding: 16px 22px;
        background: #050002;
        color: white;
        font-weight: 950;
        cursor: pointer;
      }

      .accept-button:disabled {
        opacity: 0.6;
        cursor: default;
      }

      .operation-button {
        width: 100%;
        margin-top: 12px;
        border: 0;
        border-radius: 999px;
        padding: 16px 22px;
        background: #050002;
        color: white;
        font-weight: 950;
        cursor: pointer;
      }

      .waiting-box,
      .ready-box {
        margin-top: 26px;
        padding: 17px;
        border-radius: 20px;
      }

      .waiting-box {
        background: #f2ebec;
      }

      .ready-box {
        background: #e7c776;
      }

      .waiting-box strong,
      .waiting-box span,
      .ready-box strong,
      .ready-box span {
        display: block;
      }

      .waiting-box span,
      .ready-box span {
        margin-top: 5px;
        font-size: 13px;
        line-height: 1.45;
      }

      .privacy,
      .empty {
        width: min(
          760px,
          calc(
            100% - 32px
          )
        );
        margin: 50px auto 0;
        padding: 28px;
        border-radius: 28px;
        background: white;
      }

      .privacy strong {
        font-size: 18px;
      }

      .privacy p,
      .empty p {
        margin: 10px 0 0;
        line-height: 1.55;
        opacity: 0.72;
      }

      .empty h2 {
        margin: 12px 0 0;
        font-size: 30px;
        letter-spacing: -0.04em;
      }

      .global-error {
        width: min(
          760px,
          calc(
            100% - 32px
          )
        );
        margin: 24px auto 0;
        padding: 14px 18px;
        border-radius: 16px;
        background: #f2a8a9;
        font-weight: 800;
      }

      .centered {
        min-height: 100vh;
        display: grid;
        place-content: center;
        justify-items: center;
        gap: 16px;
        padding: 30px;
        text-align: center;
      }

      .centered h1,
      .centered p {
        margin: 0;
      }

      @media (
        max-width: 760px
      ) {
        .header-inner {
          min-height: 68px;
        }

        .intro {
          padding-top: 42px;
        }

        .summary-grid {
          grid-template-columns:
            repeat(
              2,
              1fr
            );
        }

        .candidate-grid {
          grid-template-columns:
            1fr;
        }

        .section-heading {
          align-items:
            flex-start;
        }

        .candidate-card {
          padding: 22px;
          border-radius: 26px;
        }

        .candidate-top h3 {
          font-size: 26px;
        }
      }
    `}</style>
  )
}
