"use client"

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useParams } from "next/navigation"
import VerloBrand from "@/components/VerloBrand"

type ClosingData = {
  ok: boolean

  viewer: {
    role: "tenant" | "owner"
    lead_id: string
  }

  contract: {
    id: string
    match_id: string
    status: string
    monthly_price: number | null
    deposit: number | null
    start_date: string | null
    end_date: string | null
    adjustment_method: string | null
    terms: {
      expenses?: string
      services?: string
      special_conditions?: string
    }
    content: string | null
    tenant_agreed: boolean
    owner_agreed: boolean
    tenant_agreed_at: string | null
    owner_agreed_at: string | null
  }

  match: {
    id: string
    score: number
    status: string
    ready_to_connect_at: string | null
  }

  tenant: {
    id: string
    full_name: string
    email: string
    phone: string
  }

  owner: {
    id: string
    full_name: string
    email: string
    phone: string
  }

  property: {
    address: string | null
    floor_unit: string | null
    neighborhood: string | null
    property_type: string | null
    rooms: string | null
    approx_price: string | null
    approx_price_number: number | null
    expenses_amount: number | null
    availability_status: string | null
    requirements: string | null
    visit_conditions: string | null
    notes: string | null
  }
}

type FormState = {
  monthly_price: string
  deposit: string
  start_date: string
  end_date: string
  adjustment_method: string
  expenses: string
  services: string
  special_conditions: string
}

function money(
  value: number | null
) {
  if (
    value === null ||
    Number.isNaN(value)
  ) {
    return "A definir"
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
  value: string | null
) {
  if (!value) return "—"

  const dictionary:
    Record<string, string> = {
      apartment: "Departamento",
      house: "Casa",
      ph: "PH",
      studio: "Monoambiente",
    }

  return (
    dictionary[value] ||
    value
      .replace(/_/g, " ")
      .replace(/-/g, " ")
  )
}

export default function ClosingPage() {
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
    useState<ClosingData | null>(
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
    showForm,
    setShowForm,
  ] =
    useState(false)

  const [
    generating,
    setGenerating,
  ] =
    useState(false)

  const [
    form,
    setForm,
  ] =
    useState<FormState>({
      monthly_price: "",
      deposit: "",
      start_date: "",
      end_date: "",
      adjustment_method: "",
      expenses: "",
      services: "",
      special_conditions: "",
    })

  async function load() {
    if (!token) return

    try {
      setLoading(true)
      setError("")

      const response =
        await fetch(
          `/api/closing-view?token=${encodeURIComponent(
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
            "No pudimos abrir este cierre."
        )
      }

      setData(json)

      setForm({
        monthly_price:
          json.contract
            .monthly_price !== null
            ? String(
                json.contract
                  .monthly_price
              )
            : "",

        deposit:
          json.contract.deposit !==
          null
            ? String(
                json.contract
                  .deposit
              )
            : "",

        start_date:
          json.contract
            .start_date || "",

        end_date:
          json.contract.end_date ||
          "",

        adjustment_method:
          json.contract
            .adjustment_method ||
          "",

        expenses:
          json.contract.terms
            ?.expenses || "",

        services:
          json.contract.terms
            ?.services || "",

        special_conditions:
          json.contract.terms
            ?.special_conditions ||
          "",
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos abrir este cierre."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token])

  const isOwner =
    data?.viewer.role ===
    "owner"

  const counterpart =
    useMemo(() => {
      if (!data) return null

      return isOwner
        ? data.tenant
        : data.owner
    }, [data, isOwner])

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm(
      current => ({
        ...current,
        [field]: value,
      })
    )
  }

  async function generateContract(
    event: FormEvent
  ) {
    event.preventDefault()

    try {
      setGenerating(true)
      setError("")

      const response =
        await fetch(
          "/api/closing-generate",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              token,

              monthly_price:
                Number(
                  form.monthly_price
                ),

              deposit:
                Number(
                  form.deposit
                ),

              start_date:
                form.start_date,

              end_date:
                form.end_date,

              adjustment_method:
                form.adjustment_method,

              expenses:
                form.expenses,

              services:
                form.services,

              special_conditions:
                form.special_conditions,
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
            "No pudimos generar el contrato."
        )
      }

      setShowForm(false)

      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos generar el contrato."
      )
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <>
        <main className="closing-centered">
          <VerloBrand />

          <p>
            Cargando tu espacio
            de cierre...
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
        <main className="closing-centered">
          <VerloBrand />

          <h1>
            No pudimos abrir
            este cierre.
          </h1>

          <p>
            {error}
          </p>
        </main>

        <Styles />
      </>
    )
  }

  if (
    !data ||
    !counterpart
  ) {
    return null
  }

  const contractGenerated =
    data.contract.status ===
      "generated" ||
    data.contract.status ===
      "agreed"

  const bothAgreed =
    data.contract
      .tenant_agreed &&
    data.contract
      .owner_agreed

  return (
    <>
      <main className="closing-page">
        <header className="closing-header">
          <div className="closing-header-inner">
            <VerloBrand />

            <span className="status-pill">
              DOBLE OK
            </span>
          </div>
        </header>

        <section className="closing-hero">
          <span className="eyebrow">
            ESPACIO DE CIERRE
          </span>

          <h1>
            Coincidieron.
            <br />

            <em>
              Ahora cierren
              el alquiler.
            </em>
          </h1>

          <p>
            Ya hubo acuerdo para
            avanzar. Desde acá
            pueden completar las
            condiciones finales y
            generar el contrato.
          </p>
        </section>

        <section className="closing-layout">
          <div className="closing-main">
            <article className="verlo-card success-card">
              <span className="card-kicker">
                MATCH CONFIRMADO
              </span>

              <h2>
                Los dos quieren
                avanzar.
              </h2>

              <p>
                Verlo habilitó los
                datos de contacto y
                este espacio privado
                para cerrar el
                alquiler.
              </p>
            </article>

            <article className="verlo-card">
              <span className="card-kicker">
                LA OTRA PARTE
              </span>

              <div className="person-title">
                <div>
                  <h2>
                    {
                      counterpart.full_name
                    }
                  </h2>

                  <span>
                    {isOwner
                      ? "Inquilino"
                      : "Propietario"}
                  </span>
                </div>

                <div className="verified">
                  ✓ Confirmado
                </div>
              </div>

              <div className="info-grid two">
                <Info
                  label="Email"
                  value={
                    counterpart.email ||
                    "—"
                  }
                />

                <Info
                  label="WhatsApp"
                  value={
                    counterpart.phone ||
                    "—"
                  }
                />
              </div>
            </article>

            <article className="verlo-card">
              <span className="card-kicker">
                PROPIEDAD
              </span>

              <h2>
                {data.property
                  .address ||
                  data.property
                    .neighborhood ||
                  "Propiedad del match"}
              </h2>

              {data.property
                .floor_unit && (
                <p className="property-subtitle">
                  {
                    data.property
                      .floor_unit
                  }
                </p>
              )}

              <div className="info-grid">
                <Info
                  label="Zona"
                  value={
                    data.property
                      .neighborhood ||
                    "—"
                  }
                />

                <Info
                  label="Tipo"
                  value={humanize(
                    data.property
                      .property_type
                  )}
                />

                <Info
                  label="Ambientes"
                  value={
                    data.property
                      .rooms ||
                    "—"
                  }
                />

                <Info
                  label="Precio publicado"
                  value={
                    data.property
                      .approx_price ||
                    money(
                      data.property
                        .approx_price_number
                    )
                  }
                />

                <Info
                  label="Expensas"
                  value={
                    data.property
                      .expenses_amount !==
                    null
                      ? money(
                          data.property
                            .expenses_amount
                        )
                      : "A definir"
                  }
                />

                <Info
                  label="Disponibilidad"
                  value={
                    data.property
                      .availability_status ||
                    "—"
                  }
                />
              </div>
            </article>

            <article className="verlo-card contract-card">
              <div className="contract-heading">
                <div>
                  <span className="card-kicker">
                    CONTRATO
                  </span>

                  <h2>
                    {contractGenerated
                      ? "Contrato generado"
                      : "Armen el acuerdo final"}
                  </h2>

                  <p>
                    {contractGenerated
                      ? "Este documento refleja las condiciones cargadas para este alquiler."
                      : "Completá las condiciones finales. Verlo genera el contrato a partir de esos datos."}
                  </p>
                </div>

                {!showForm && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      setShowForm(
                        true
                      )
                    }
                  >
                    {contractGenerated
                      ? "EDITAR CONDICIONES"
                      : "ARMAR CONTRATO"}
                  </button>
                )}
              </div>

              {showForm && (
                <form
                  className="contract-form"
                  onSubmit={
                    generateContract
                  }
                >
                  <div className="form-section">
                    <h3>
                      Condiciones económicas
                    </h3>

                    <div className="form-grid">
                      <Field
                        label="Alquiler mensual"
                        type="number"
                        value={
                          form.monthly_price
                        }
                        placeholder="Ej. 850000"
                        required
                        onChange={value =>
                          updateField(
                            "monthly_price",
                            value
                          )
                        }
                      />

                      <Field
                        label="Depósito"
                        type="number"
                        value={
                          form.deposit
                        }
                        placeholder="Ej. 850000"
                        required
                        onChange={value =>
                          updateField(
                            "deposit",
                            value
                          )
                        }
                      />

                      <Field
                        label="Fecha de inicio"
                        type="date"
                        value={
                          form.start_date
                        }
                        required
                        onChange={value =>
                          updateField(
                            "start_date",
                            value
                          )
                        }
                      />

                      <Field
                        label="Fecha de finalización"
                        type="date"
                        value={
                          form.end_date
                        }
                        required
                        onChange={value =>
                          updateField(
                            "end_date",
                            value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>
                      Actualización
                    </h3>

                    <label className="field">
                      <span>
                        Mecanismo de
                        actualización
                      </span>

                      <textarea
                        value={
                          form.adjustment_method
                        }
                        onChange={event =>
                          updateField(
                            "adjustment_method",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Ej. actualización trimestral según IPC."
                        required
                      />
                    </label>
                  </div>

                  <div className="form-section">
                    <h3>
                      Gastos y condiciones
                    </h3>

                    <label className="field">
                      <span>
                        Expensas, tasas
                        y gastos
                      </span>

                      <textarea
                        value={
                          form.expenses
                        }
                        onChange={event =>
                          updateField(
                            "expenses",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Indicá cómo se distribuyen las expensas y demás gastos."
                      />
                    </label>

                    <label className="field">
                      <span>
                        Servicios
                      </span>

                      <textarea
                        value={
                          form.services
                        }
                        onChange={event =>
                          updateField(
                            "services",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Ej. electricidad, gas e internet a cargo del inquilino."
                      />
                    </label>

                    <label className="field">
                      <span>
                        Condiciones
                        particulares
                      </span>

                      <textarea
                        value={
                          form.special_conditions
                        }
                        onChange={event =>
                          updateField(
                            "special_conditions",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Cualquier condición adicional acordada entre las partes."
                      />
                    </label>
                  </div>

                  {error && (
                    <div className="form-error">
                      {error}
                    </div>
                  )}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        setShowForm(
                          false
                        )
                      }
                    >
                      CANCELAR
                    </button>

                    <button
                      type="submit"
                      className="primary-button"
                      disabled={
                        generating
                      }
                    >
                      {generating
                        ? "GENERANDO..."
                        : "GENERAR CONTRATO"}
                    </button>
                  </div>
                </form>
              )}

              {contractGenerated &&
                data.contract
                  .content && (
                  <>
                    <div className="document-shell">
                      <article className="contract-document">
                        <div className="document-brand">
                          <VerloBrand
                            width={28}
                            showText={
                              true
                            }
                          />
                        </div>

                        <div className="document-title">
                          CONTRATO DE
                          LOCACIÓN
                        </div>

                        <div className="document-rule" />

                        <div className="contract-copy">
                          {
                            data.contract
                              .content
                          }
                        </div>

                        <div className="document-footer">
                          Documento generado
                          en Verlo
                        </div>
                      </article>
                    </div>

                    <div className="contract-summary">
                      <Info
                        label="Alquiler"
                        value={money(
                          data.contract
                            .monthly_price
                        )}
                      />

                      <Info
                        label="Depósito"
                        value={money(
                          data.contract
                            .deposit
                        )}
                      />

                      <Info
                        label="Inicio"
                        value={
                          data.contract
                            .start_date ||
                          "—"
                        }
                      />

                      <Info
                        label="Finalización"
                        value={
                          data.contract
                            .end_date ||
                          "—"
                        }
                      />
                    </div>
                  </>
                )}
            </article>
          </div>

          <aside className="closing-sidebar">
            <div className="sidebar-card">
              <span className="card-kicker">
                ESTADO DEL CIERRE
              </span>

              <div className="steps">
                <Step
                  label="Match confirmado"
                  done
                />

                <Step
                  label="Contrato generado"
                  done={
                    contractGenerated
                  }
                />

                <Step
                  label="Aceptado por inquilino"
                  done={
                    data.contract
                      .tenant_agreed
                  }
                />

                <Step
                  label="Aceptado por propietario"
                  done={
                    data.contract
                      .owner_agreed
                  }
                />
              </div>

              {bothAgreed && (
                <div className="complete-box">
                  <strong>
                    Acuerdo completado
                  </strong>

                  <span>
                    Las dos partes
                    aceptaron el
                    contrato.
                  </span>
                </div>
              )}

              <p className="sidebar-note">
                Este enlace es
                privado y corresponde
                únicamente a este
                cierre.
              </p>
            </div>
          </aside>
        </section>
      </main>

      <Styles />
    </>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="info-item">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  )
}

function Field({
  label,
  type,
  value,
  placeholder,
  required,
  onChange,
}: {
  label: string
  type: string
  value: string
  placeholder?: string
  required?: boolean
  onChange: (
    value: string
  ) => void
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={
          placeholder
        }
        required={required}
        onChange={event =>
          onChange(
            event.target.value
          )
        }
      />
    </label>
  )
}

function Step({
  label,
  done,
}: {
  label: string
  done: boolean
}) {
  return (
    <div className="step">
      <div
        className={
          done
            ? "step-dot done"
            : "step-dot"
        }
      >
        {done
          ? "✓"
          : ""}
      </div>

      <span>
        {label}
      </span>
    </div>
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
        color: #050002;
        font-family:
          Arial,
          Helvetica,
          sans-serif;
      }

      .closing-page {
        min-height: 100vh;
        background:
          radial-gradient(
            700px 420px at 85% 0%,
            rgba(
              236,
              72,
              153,
              0.12
            ),
            transparent 65%
          ),
          #f8f6f1;
      }

      .closing-header {
        position: sticky;
        top: 0;
        z-index: 50;
        height: 76px;
        background:
          rgba(
            242,
            235,
            236,
            0.86
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
      }

      .closing-header-inner {
        width:
          min(
            1160px,
            calc(
              100% - 40px
            )
          );
        height: 100%;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content:
          space-between;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        padding:
          9px 14px;
        border-radius: 999px;
        background: #050002;
        color: #ffffff;
        font-size: 11px;
        font-weight: 800;
        letter-spacing:
          0.12em;
      }

      .closing-hero {
        width:
          min(
            1160px,
            calc(
              100% - 40px
            )
          );
        margin: 0 auto;
        padding:
          72px 0 52px;
      }

      .eyebrow,
      .card-kicker {
        display: inline-block;
        font-size: 11px;
        font-weight: 800;
        letter-spacing:
          0.14em;
        color: #ec4899;
      }

      .closing-hero h1 {
        max-width: 900px;
        margin:
          14px 0 20px;
        font-size:
          clamp(
            48px,
            7vw,
            88px
          );
        line-height: 0.94;
        letter-spacing:
          -0.055em;
        font-weight: 800;
      }

      .closing-hero h1 em {
        font-family:
          Georgia,
          "Times New Roman",
          serif;
        font-weight: 500;
        color: #ec4899;
      }

      .closing-hero p {
        max-width: 600px;
        margin: 0;
        font-size: 18px;
        line-height: 1.55;
        color: #625b5e;
      }

      .closing-layout {
        width:
          min(
            1160px,
            calc(
              100% - 40px
            )
          );
        margin: 0 auto;
        padding:
          0 0 90px;
        display: grid;
        grid-template-columns:
          minmax(
            0,
            1fr
          )
          320px;
        gap: 28px;
        align-items: start;
      }

      .closing-main {
        display: grid;
        gap: 22px;
      }

      .verlo-card,
      .sidebar-card {
        background: #ffffff;
        border:
          1px solid
          rgba(
            5,
            0,
            2,
            0.08
          );
        border-radius: 24px;
        box-shadow:
          0 20px 60px
          rgba(
            30,
            15,
            20,
            0.05
          );
      }

      .verlo-card {
        padding: 32px;
      }

      .success-card {
        background:
          linear-gradient(
            135deg,
            #050002 0%,
            #241318 100%
          );
        color: white;
      }

      .success-card
        .card-kicker {
        color: #ff8bc4;
      }

      .verlo-card h2 {
        margin:
          8px 0 10px;
        font-size:
          clamp(
            26px,
            3vw,
            38px
          );
        line-height: 1.05;
        letter-spacing:
          -0.04em;
      }

      .verlo-card p {
        margin: 0;
        max-width: 650px;
        color: #6e6669;
        line-height: 1.6;
      }

      .success-card p {
        color:
          rgba(
            255,
            255,
            255,
            0.7
          );
      }

      .person-title {
        margin-top: 12px;
        display: flex;
        align-items:
          flex-start;
        justify-content:
          space-between;
        gap: 20px;
      }

      .person-title h2 {
        margin-bottom: 5px;
      }

      .person-title
        span {
        color: #8a8184;
        font-size: 14px;
      }

      .verified {
        padding:
          8px 11px;
        border-radius: 999px;
        background: #fff0f7;
        color: #c92f77;
        font-size: 12px;
        font-weight: 800;
        white-space: nowrap;
      }

      .property-subtitle {
        margin-top: -3px !important;
      }

      .info-grid,
      .contract-summary {
        margin-top: 24px;
        display: grid;
        grid-template-columns:
          repeat(
            3,
            minmax(
              0,
              1fr
            )
          );
        gap: 12px;
      }

      .info-grid.two {
        grid-template-columns:
          repeat(
            2,
            minmax(
              0,
              1fr
            )
          );
      }

      .info-item {
        min-width: 0;
        padding: 16px;
        border-radius: 16px;
        background: #faf8f5;
        border:
          1px solid
          #eee7e2;
      }

      .info-item span {
        display: block;
        margin-bottom: 7px;
        color: #9c9194;
        font-size: 10px;
        font-weight: 800;
        letter-spacing:
          0.1em;
        text-transform:
          uppercase;
      }

      .info-item strong {
        display: block;
        overflow-wrap:
          anywhere;
        color: #050002;
        font-size: 14px;
        line-height: 1.4;
      }

      .contract-heading {
        display: flex;
        align-items:
          flex-start;
        justify-content:
          space-between;
        gap: 24px;
      }

      .primary-button,
      .secondary-button {
        min-height: 48px;
        border-radius: 14px;
        padding:
          0 20px;
        font-size: 12px;
        font-weight: 900;
        letter-spacing:
          0.06em;
        cursor: pointer;
        transition:
          transform 160ms ease,
          opacity 160ms ease;
      }

      .primary-button {
        border: 0;
        background: #ec4899;
        color: #ffffff;
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
        background: white;
        color: #050002;
      }

      .primary-button:hover,
      .secondary-button:hover {
        transform:
          translateY(
            -1px
          );
      }

      .primary-button:disabled {
        opacity: 0.5;
        cursor:
          not-allowed;
      }

      .contract-form {
        margin-top: 30px;
        padding-top: 30px;
        border-top:
          1px solid
          #eee7e2;
      }

      .form-section +
        .form-section {
        margin-top: 28px;
      }

      .form-section h3 {
        margin:
          0 0 16px;
        font-size: 17px;
        letter-spacing:
          -0.02em;
      }

      .form-grid {
        display: grid;
        grid-template-columns:
          repeat(
            2,
            minmax(
              0,
              1fr
            )
          );
        gap: 14px;
      }

      .field {
        display: block;
      }

      .field + .field {
        margin-top: 14px;
      }

      .form-grid
        .field +
        .field {
        margin-top: 0;
      }

      .field > span {
        display: block;
        margin-bottom: 7px;
        font-size: 12px;
        font-weight: 800;
        color: #51494c;
      }

      .field input,
      .field textarea {
        width: 100%;
        border:
          1px solid
          #e4d9dc;
        border-radius: 14px;
        background: #fffdfb;
        color: #050002;
        padding:
          14px 15px;
        font: inherit;
        outline: none;
        transition:
          border-color
            150ms ease,
          box-shadow
            150ms ease;
      }

      .field textarea {
        min-height: 108px;
        resize: vertical;
        line-height: 1.5;
      }

      .field input:focus,
      .field textarea:focus {
        border-color:
          #ec4899;
        box-shadow:
          0 0 0 4px
          rgba(
            236,
            72,
            153,
            0.12
          );
      }

      .form-actions {
        margin-top: 24px;
        display: flex;
        justify-content:
          flex-end;
        gap: 10px;
      }

      .form-error {
        margin-top: 18px;
        padding: 13px 15px;
        border-radius: 13px;
        background: #fff0f3;
        color: #a51d47;
        font-size: 13px;
        font-weight: 700;
      }

      .document-shell {
        margin-top: 30px;
        padding: 24px;
        overflow-x: auto;
        border-radius: 20px;
        background: #e9e4df;
      }

      .contract-document {
        width: min(
          794px,
          100%
        );
        min-height: 1123px;
        margin: 0 auto;
        padding:
          66px 70px 56px;
        background: white;
        color: #191517;
        box-shadow:
          0 12px 35px
          rgba(
            0,
            0,
            0,
            0.08
          );
      }

      .document-brand {
        display: flex;
        justify-content:
          center;
        margin-bottom: 34px;
      }

      .document-title {
        text-align: center;
        font-family:
          Georgia,
          "Times New Roman",
          serif;
        font-size: 19px;
        font-weight: 700;
        letter-spacing:
          0.08em;
      }

      .document-rule {
        width: 56px;
        height: 2px;
        margin:
          18px auto
          34px;
        background: #ec4899;
      }

      .contract-copy {
        white-space:
          pre-wrap;
        text-align: justify;
        font-family:
          Georgia,
          "Times New Roman",
          serif;
        font-size: 14.5px;
        line-height: 1.82;
        color: #211d1f;
      }

      .document-footer {
        margin-top: 60px;
        padding-top: 18px;
        border-top:
          1px solid
          #ddd5d7;
        text-align: center;
        font-size: 10px;
        letter-spacing:
          0.09em;
        text-transform:
          uppercase;
        color: #9a9194;
      }

      .closing-sidebar {
        position: sticky;
        top: 98px;
      }

      .sidebar-card {
        padding: 25px;
      }

      .steps {
        margin-top: 22px;
        display: grid;
        gap: 18px;
      }

      .step {
        display: flex;
        align-items: center;
        gap: 11px;
      }

      .step-dot {
        width: 27px;
        height: 27px;
        flex: 0 0 27px;
        display: flex;
        align-items: center;
        justify-content:
          center;
        border-radius: 999px;
        background: #eee9e6;
        color: #9b9395;
        font-size: 12px;
        font-weight: 900;
      }

      .step-dot.done {
        background: #ec4899;
        color: white;
      }

      .step span {
        font-size: 13px;
        font-weight: 700;
        color: #4d4548;
      }

      .complete-box {
        margin-top: 24px;
        padding: 16px;
        border-radius: 16px;
        background: #fff0f7;
        border:
          1px solid
          #ffd1e6;
      }

      .complete-box strong,
      .complete-box span {
        display: block;
      }

      .complete-box strong {
        color: #b72467;
        font-size: 14px;
      }

      .complete-box span {
        margin-top: 5px;
        color: #805467;
        font-size: 12px;
        line-height: 1.45;
      }

      .sidebar-note {
        margin:
          24px 0 0;
        padding-top: 20px;
        border-top:
          1px solid
          #eee7e2;
        font-size: 11px;
        line-height: 1.5;
        color: #9c9295;
      }

      .closing-centered {
        min-height: 100vh;
        display: flex;
        flex-direction:
          column;
        align-items: center;
        justify-content:
          center;
        text-align: center;
        padding: 30px;
        background: #f8f6f1;
      }

      .closing-centered h1 {
        max-width: 580px;
        margin:
          35px 0 12px;
        font-size:
          clamp(
            38px,
            7vw,
            64px
          );
        line-height: 0.98;
        letter-spacing:
          -0.05em;
      }

      .closing-centered p {
        max-width: 520px;
        color: #756c6f;
        line-height: 1.6;
      }

      @media (
        max-width: 900px
      ) {
        .closing-layout {
          grid-template-columns:
            1fr;
        }

        .closing-sidebar {
          position: static;
        }

        .info-grid {
          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );
        }
      }

      @media (
        max-width: 640px
      ) {
        .closing-header-inner,
        .closing-hero,
        .closing-layout {
          width:
            min(
              100% - 28px,
              1160px
            );
        }

        .closing-hero {
          padding:
            48px 0 34px;
        }

        .closing-hero h1 {
          font-size: 48px;
        }

        .closing-hero p {
          font-size: 16px;
        }

        .verlo-card {
          padding: 22px;
          border-radius: 20px;
        }

        .person-title,
        .contract-heading {
          flex-direction:
            column;
        }

        .info-grid,
        .info-grid.two,
        .contract-summary,
        .form-grid {
          grid-template-columns:
            1fr;
        }

        .primary-button,
        .secondary-button {
          width: 100%;
        }

        .form-actions {
          flex-direction:
            column-reverse;
        }

        .document-shell {
          padding: 10px;
          margin-left: -6px;
          margin-right: -6px;
        }

        .contract-document {
          min-height: 0;
          padding:
            40px 26px;
        }

        .contract-copy {
          font-size: 13px;
          line-height: 1.7;
        }
      }
    `}</style>
  )
}
