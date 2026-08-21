"use client"

import {
  useEffect,
  useState,
} from "react"
import {
  useParams,
} from "next/navigation"
import VerloBrand from "@/components/VerloBrand"

type CandidateItem = {
  match: {
    id: string
    score: number
    reasons: Record<string, unknown>
    tenant_interest: boolean
    tenant_verified: boolean
    owner_interest: boolean
    ready_to_connect: boolean
    introduced: boolean
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
    status: string

    has_dni_front:
      boolean

    has_dni_back:
      boolean

    has_selfie:
      boolean

    has_income_proof:
      boolean

    reviewed:
      boolean
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
      .replace(/_/g, " ")
      .replace(/-/g, " ")
  )
}

export default function CandidatesPage() {
  const params =
    useParams<{
      token: string
    }>()

  const token =
    String(
      params?.token || ""
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

  useEffect(() => {
    async function load() {
      try {
        const response =
          await fetch(
            `/api/candidates-view?token=${encodeURIComponent(
              token
            )}`,
            {
              cache: "no-store",
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
              "No pudimos abrir tus candidatos."
          )
        }

        setData(json)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No pudimos abrir tus candidatos."
        )
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      load()
    }
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
            method: "POST",

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

      setData(
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,

            candidates:
              current.candidates.map(
                (
                  candidate
                ) => {
                  if (
                    candidate
                      .match
                      .id !==
                    matchId
                  ) {
                    return candidate
                  }

                  return {
                    ...candidate,

                    match: {
                      ...candidate.match,

                      owner_interest:
                        true,

                      ready_to_connect:
                        Boolean(
                          json.ready_to_connect
                        ),
                    },
                  }
                }
              ),
          }
        }
      )
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
            Cargando candidatos...
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
            tus candidatos.
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

  return (
    <>
      <main className="page">
        <header className="header">
          <div className="header-inner">
            <VerloBrand />
          </div>
        </header>

        <section className="intro">
          <span className="eyebrow">
            PERSONAS INTERESADAS
          </span>

          <h1>
            Tenés candidatos
            <br />
            <em>
              para tu propiedad.
            </em>
          </h1>

          <p className="intro-copy">
            Estas personas vieron
            tu propiedad, marcaron
            que quieren avanzar y
            completaron su perfil.
            Revisalas y elegí con
            quién querés seguir.
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

        {data.candidates
          .length === 0 ? (
          <section className="empty">
            <span className="eyebrow">
              TODAVÍA NO
            </span>

            <h2>
              No hay candidatos
              listos para mostrarte.
            </h2>

            <p>
              Cuando una persona
              compatible confirme
              interés y complete su
              documentación, va a
              aparecer acá.
            </p>
          </section>
        ) : (
          <>
            <section className="candidate-grid">
              {data.candidates.map(
                (
                  candidate,
                  index
                ) => (
                  <CandidateCard
                    key={
                      candidate
                        .match.id
                    }
                    candidate={
                      candidate
                    }
                    number={
                      index + 1
                    }
                    sending={
                      sendingMatchId ===
                      candidate
                        .match.id
                    }
                    onAccept={() =>
                      acceptCandidate(
                        candidate
                          .match.id
                      )
                    }
                  />
                )
              )}
            </section>

            <section className="privacy">
              <strong>
                Los datos personales
                siguen protegidos.
              </strong>

              <p>
                Todavía no mostramos
                teléfono, email,
                domicilio ni
                documentación privada.
                Cuando vos también
                confirmes que querés
                avanzar, Verlo registra
                el doble OK y continúa
                el proceso.
              </p>
            </section>
          </>
        )}

        {error && data && (
          <div className="global-error">
            {error}
          </div>
        )}
      </main>

      <Styles />
    </>
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
  } = candidate

  return (
    <article className="candidate-card">
      <div className="candidate-top">
        <div>
          <span className="candidate-number">
            CANDIDATO{" "}
            {String(
              number
            ).padStart(
              2,
              "0"
            )}
          </span>

          <h2>
            {tenant.first_name}
          </h2>
        </div>

        <div className="score">
          <span>
            MATCH
          </span>

          <strong>
            {match.score}%
          </strong>
        </div>
      </div>

      <div className="candidate-status">
        <span>
          ✓ Quiere avanzar
        </span>

        <span>
          ✓ Perfil completo
        </span>
      </div>

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
            tenant.move_timing
          )}
        />

        <Fact
          label="Busca"
          value={humanize(
            tenant.property_type
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
          label="Situación laboral"
          value={
            tenant
              .employment_status ||
            humanize(
              tenant
                .income_proof_type
            )
          }
        />

        <Fact
          label="Ingresos"
          value={
            tenant.income_range ||
            (tenant.income_max
              ? money(
                  tenant.income_max
                )
              : "—")
          }
        />
      </div>

      <div className="guarantees">
        <span className="section-label">
          GARANTÍA / RESPALDO
        </span>

        <div className="chips">
          {tenant.guarantee_type && (
            <span className="chip">
              {humanize(
                tenant
                  .guarantee_type
              )}
            </span>
          )}

          {tenant.guarantee_types.map(
            (
              item
            ) => (
              <span
                key={item}
                className="chip"
              >
                {humanize(
                  item
                )}
              </span>
            )
          )}

          {!tenant.guarantee_type &&
            tenant
              .guarantee_types
              .length === 0 && (
              <span className="chip muted">
                Sin detalle
              </span>
            )}
        </div>
      </div>

      <div className="documents">
        <span className="section-label">
          DOCUMENTACIÓN
        </span>

        <div className="document-list">
          <DocumentState
            label="DNI frente"
            complete={
              verification
                .has_dni_front
            }
          />

          <DocumentState
            label="DNI dorso"
            complete={
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

      {tenant.move_notes && (
        <div className="notes">
          <span className="section-label">
            INFORMACIÓN ADICIONAL
          </span>

          <p>
            {tenant.move_notes}
          </p>
        </div>
      )}

      {match.ready_to_connect ? (
        <div className="ready">
          <strong>
            ✓ Ambos quieren avanzar
          </strong>

          <span>
            Este match está listo
            para continuar.
          </span>
        </div>
      ) : match.owner_interest ? (
        <div className="accepted">
          <strong>
            ✓ Tu interés quedó
            registrado
          </strong>

          <span>
            Verlo ya tiene tu OK
            para este candidato.
          </span>
        </div>
      ) : (
        <button
          type="button"
          className="accept-button"
          onClick={
            onAccept
          }
          disabled={
            sending
          }
        >
          {sending
            ? "GUARDANDO..."
            : "QUIERO AVANZAR"}
        </button>
      )}
    </article>
  )
}

function Fact({
  label,
  value,
}: {
  label:
    string

  value:
    string
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

function DocumentState({
  label,
  complete,
  optional = false,
}: {
  label:
    string

  complete:
    boolean

  optional?:
    boolean
}) {
  return (
    <div
      className={
        complete
          ? "document complete"
          : "document"
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {complete
          ? "✓ Cargado"
          : optional
            ? "Opcional"
            : "Pendiente"}
      </strong>
    </div>
  )
}

function Styles() {
  return (
    <style jsx global>{`
      * {
        box-sizing: border-box;
      }

      html {
        background: #f2ebec;
      }

      body {
        margin: 0;
        background: #f2ebec;
        color: #050002;
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

      .page {
        min-height: 100vh;
        background:
          radial-gradient(
            circle at 85% 10%,
            rgba(242, 168, 169, 0.46),
            transparent 26%
          ),
          radial-gradient(
            circle at 7% 62%,
            rgba(116, 190, 220, 0.18),
            transparent 24%
          ),
          #f2ebec;
        padding-bottom: 90px;
      }

      .header {
        position: sticky;
        top: 0;
        z-index: 50;
        height: 76px;
        background:
          rgba(
            242,
            235,
            236,
            0.82
          );
        backdrop-filter:
          blur(18px);
        -webkit-backdrop-filter:
          blur(18px);
        border-bottom:
          1px solid
          rgba(
            5,
            0,
            2,
            0.08
          );
        display: flex;
        align-items: center;
      }

      .header-inner {
        width:
          min(
            1160px,
            calc(
              100% - 40px
            )
          );
        margin: 0 auto;
        display: flex;
        align-items: center;
      }

      .intro {
        width:
          min(
            1160px,
            calc(
              100% - 40px
            )
          );
        margin: 0 auto;
        padding:
          74px
          0
          50px;
      }

      .eyebrow,
      .candidate-number,
      .section-label {
        display: block;
        color: #a05d69;
        font-size: 11px;
        line-height: 1;
        font-weight: 950;
        letter-spacing:
          0.14em;
        text-transform:
          uppercase;
      }

      .intro h1 {
        margin:
          16px
          0
          0;
        max-width: 960px;
        font-size:
          clamp(
            52px,
            7.5vw,
            98px
          );
        line-height: 0.91;
        letter-spacing:
          -0.075em;
        font-weight: 950;
      }

      .intro h1 em {
        font-family:
          Georgia,
          "Times New Roman",
          serif;
        font-weight: 400;
        font-style: italic;
        letter-spacing:
          -0.045em;
      }

      .intro-copy {
        max-width: 650px;
        margin:
          26px
          0
          0;
        color:
          rgba(
            5,
            0,
            2,
            0.66
          );
        font-size: 19px;
        line-height: 1.48;
        font-weight: 650;
      }

      .property-summary {
        margin-top: 34px;
        max-width: 620px;
        padding: 20px 22px;
        border-radius: 26px;
        background:
          rgba(
            255,
            255,
            255,
            0.62
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

      .property-summary > span {
        display: block;
        margin-bottom: 8px;
        font-size: 10px;
        font-weight: 950;
        letter-spacing:
          0.14em;
        opacity: 0.48;
      }

      .property-summary strong {
        display: block;
        font-size: 22px;
        letter-spacing:
          -0.04em;
      }

      .property-summary p {
        margin:
          5px
          0
          0;
        color:
          rgba(
            5,
            0,
            2,
            0.6
          );
      }

      .property-summary b {
        display: block;
        margin-top: 9px;
        font-size: 18px;
      }

      .candidate-grid {
        width:
          min(
            1160px,
            calc(
              100% - 40px
            )
          );
        margin: 0 auto;
        display: grid;
        grid-template-columns:
          repeat(
            2,
            minmax(
              0,
              1fr
            )
          );
        gap: 22px;
      }

      .candidate-card {
        display: flex;
        flex-direction: column;
        min-width: 0;
        padding: 28px;
        border-radius: 34px;
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
          0
          24px
          70px
          rgba(
            5,
            0,
            2,
            0.08
          );
      }

      .candidate-top {
        display: flex;
        align-items:
          flex-start;
        justify-content:
          space-between;
        gap: 20px;
      }

      .candidate-top h2 {
        margin:
          10px
          0
          0;
        font-size:
          clamp(
            36px,
            5vw,
            58px
          );
        line-height: 0.95;
        letter-spacing:
          -0.065em;
      }

      .score {
        flex:
          0 0 auto;
        min-width: 108px;
        padding: 15px;
        border-radius: 22px;
        background: #f2a8a9;
      }

      .score span {
        display: block;
        font-size: 9px;
        font-weight: 950;
        letter-spacing:
          0.14em;
      }

      .score strong {
        display: block;
        margin-top: 4px;
        font-size: 34px;
        letter-spacing:
          -0.06em;
      }

      .candidate-status {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 22px;
      }

      .candidate-status span {
        padding:
          8px
          11px;
        border-radius: 999px;
        background:
          rgba(
            116,
            190,
            220,
            0.18
          );
        border:
          1px solid
          rgba(
            116,
            190,
            220,
            0.3
          );
        font-size: 12px;
        font-weight: 900;
      }

      .facts {
        display: grid;
        grid-template-columns:
          1fr 1fr;
        gap: 10px;
        margin-top: 24px;
      }

      .fact {
        min-width: 0;
        padding: 16px;
        border-radius: 20px;
        background: #fffaf8;
        border:
          1px solid
          rgba(
            5,
            0,
            2,
            0.07
          );
      }

      .fact span {
        display: block;
        margin-bottom: 7px;
        color:
          rgba(
            5,
            0,
            2,
            0.48
          );
        font-size: 10px;
        line-height: 1.2;
        font-weight: 850;
        text-transform:
          uppercase;
        letter-spacing:
          0.08em;
      }

      .fact strong {
        display: block;
        font-size: 15px;
        line-height: 1.3;
        overflow-wrap:
          anywhere;
      }

      .guarantees,
      .documents,
      .notes {
        margin-top: 20px;
        padding-top: 20px;
        border-top:
          1px solid
          rgba(
            5,
            0,
            2,
            0.08
          );
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .chip {
        padding:
          9px
          11px;
        border-radius: 999px;
        background:
          rgba(
            242,
            168,
            169,
            0.22
          );
        border:
          1px solid
          rgba(
            195,
            121,
            134,
            0.2
          );
        font-size: 12px;
        font-weight: 850;
      }

      .chip.muted {
        opacity: 0.52;
      }

      .document-list {
        display: grid;
        grid-template-columns:
          1fr 1fr;
        gap: 8px;
        margin-top: 12px;
      }

      .document {
        display: flex;
        justify-content:
          space-between;
        gap: 10px;
        padding:
          11px
          12px;
        border-radius: 15px;
        background:
          rgba(
            5,
            0,
            2,
            0.045
          );
        font-size: 11px;
      }

      .document strong {
        opacity: 0.5;
      }

      .document.complete {
        background:
          rgba(
            116,
            190,
            220,
            0.16
          );
      }

      .document.complete strong {
        opacity: 1;
      }

      .notes p {
        margin:
          11px
          0
          0;
        color:
          rgba(
            5,
            0,
            2,
            0.67
          );
        font-size: 14px;
        line-height: 1.45;
        white-space:
          pre-wrap;
      }

      .accept-button {
        width: 100%;
        min-height: 58px;
        margin-top: auto;
        padding:
          0
          20px;
        border: 0;
        border-radius: 999px;
        background: #050002;
        color: white;
        font-size: 14px;
        font-weight: 950;
        cursor: pointer;
        margin-top: 28px;
      }

      .accept-button:hover {
        background: #a05d69;
      }

      .accept-button:disabled {
        opacity: 0.5;
        cursor:
          not-allowed;
      }

      .accepted,
      .ready {
        margin-top: 28px;
        padding: 18px;
        border-radius: 20px;
        display: grid;
        gap: 5px;
      }

      .accepted {
        background:
          rgba(
            242,
            168,
            169,
            0.28
          );
      }

      .ready {
        background:
          rgba(
            116,
            190,
            220,
            0.27
          );
      }

      .accepted strong,
      .ready strong {
        font-size: 14px;
      }

      .accepted span,
      .ready span {
        color:
          rgba(
            5,
            0,
            2,
            0.64
          );
        font-size: 12px;
        line-height: 1.35;
      }

      .privacy {
        width:
          min(
            1160px,
            calc(
              100% - 40px
            )
          );
        margin:
          28px
          auto
          0;
        padding: 24px;
        border-radius: 26px;
        background: #050002;
        color: white;
      }

      .privacy strong {
        display: block;
        font-size: 18px;
      }

      .privacy p {
        max-width: 740px;
        margin:
          8px
          0
          0;
        color:
          rgba(
            255,
            255,
            255,
            0.72
          );
        line-height: 1.45;
      }

      .empty {
        width:
          min(
            760px,
            calc(
              100% - 40px
            )
          );
        margin: 0 auto;
        padding: 36px;
        border-radius: 32px;
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

      .empty h2 {
        margin:
          14px
          0
          0;
        font-size:
          clamp(
            34px,
            5vw,
            58px
          );
        line-height: 0.95;
        letter-spacing:
          -0.06em;
      }

      .empty p {
        max-width: 500px;
        color:
          rgba(
            5,
            0,
            2,
            0.62
          );
        font-size: 17px;
        line-height: 1.45;
      }

      .global-error {
        width:
          min(
            1160px,
            calc(
              100% - 40px
            )
          );
        margin:
          22px
          auto
          0;
        padding:
          14px
          16px;
        border-radius: 18px;
        background:
          rgba(
            160,
            35,
            55,
            0.12
          );
        color: #7b2432;
        font-size: 14px;
        font-weight: 850;
      }

      .centered {
        min-height: 100vh;
        display: flex;
        flex-direction:
          column;
        align-items: center;
        justify-content:
          center;
        gap: 18px;
        padding: 24px;
        text-align: center;
        background: #f2ebec;
      }

      .centered h1 {
        max-width: 620px;
        margin: 0;
        font-size:
          clamp(
            42px,
            7vw,
            72px
          );
        line-height: 0.95;
        letter-spacing:
          -0.06em;
      }

      .centered p {
        margin: 0;
        color:
          rgba(
            5,
            0,
            2,
            0.62
          );
      }

      @media (
        max-width: 820px
      ) {
        .candidate-grid {
          grid-template-columns:
            1fr;
        }

        .intro {
          padding-top: 52px;
        }
      }

      @media (
        max-width: 560px
      ) {
        .header {
          height: 68px;
        }

        .header-inner,
        .intro,
        .candidate-grid,
        .privacy,
        .global-error {
          width:
            calc(
              100% - 26px
            );
        }

        .intro h1 {
          font-size: 50px;
        }

        .candidate-card {
          padding: 20px;
          border-radius: 27px;
        }

        .candidate-top {
          align-items:
            flex-start;
        }

        .score {
          min-width: 90px;
          padding: 12px;
        }

        .score strong {
          font-size: 27px;
        }

        .facts {
          grid-template-columns:
            1fr;
        }

        .document-list {
          grid-template-columns:
            1fr;
        }
      }
    `}</style>
  )
}
