"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"

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
    terms: Record<string, unknown>
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

function money(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "A definir"
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | null) {
  if (!value) {
    return "A definir"
  }

  return new Intl.DateTimeFormat("es-AR").format(
    new Date(`${value}T12:00:00`)
  )
}

export default function ClosingPage() {
  const params = useParams<{ token: string }>()

  const token = params?.token

  const [data, setData] =
    useState<ClosingData | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      return
    }

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const response =
          await fetch(
            `/api/closing-view?token=${encodeURIComponent(
              token
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          )

        const payload =
          await response.json()

        if (
          !response.ok ||
          !payload?.ok
        ) {
          throw new Error(
            payload?.error ||
              "No se pudo cargar el cierre"
          )
        }

        setData(payload)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el cierre"
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  const isOwner =
    data?.viewer.role === "owner"

  const counterpart =
    useMemo(() => {
      if (!data) {
        return null
      }

      return isOwner
        ? data.tenant
        : data.owner
    }, [data, isOwner])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f3ef] px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
            <p className="text-sm text-neutral-500">
              Cargando espacio de cierre...
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (
    error ||
    !data ||
    !counterpart
  ) {
    return (
      <main className="min-h-screen bg-[#f4f3ef] px-5 py-12">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-semibold text-neutral-900">
              No pudimos abrir este cierre
            </p>

            <p className="mt-3 text-sm leading-6 text-neutral-600">
              {error ||
                "El enlace no es válido o ya no está disponible."}
            </p>
          </div>
        </div>
      </main>
    )
  }

  const contractReady =
    data.contract.status === "generated" ||
    data.contract.status === "agreed"

  const bothAgreed =
    data.contract.tenant_agreed &&
    data.contract.owner_agreed

  return (
    <main className="min-h-screen bg-[#f4f3ef] text-neutral-950">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div>
            <div className="text-2xl font-black tracking-[-0.04em]">
              Verlo
            </div>

            <div className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
              Espacio de cierre
            </div>
          </div>

          <div className="rounded-full bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-600">
            Match confirmado
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm md:p-9">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-neutral-500">
                Ya hubo doble OK
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-5xl">
                Ahora pueden cerrar el alquiler con Verlo.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600">
                Desde este espacio van a completar los datos
                finales, generar el contrato y dejar registrado
                el acuerdo.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm md:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                  La otra parte
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
                  {counterpart.full_name}
                </h2>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Confirmado
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Email
                </p>

                <p className="mt-2 break-all text-sm font-medium">
                  {counterpart.email}
                </p>
              </div>

              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  WhatsApp / teléfono
                </p>

                <p className="mt-2 text-sm font-medium">
                  {counterpart.phone}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm md:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
              Propiedad
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
              {data.property.address ||
                data.property.neighborhood ||
                "Propiedad del match"}
            </h2>

            {data.property.floor_unit && (
              <p className="mt-1 text-sm text-neutral-500">
                {data.property.floor_unit}
              </p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info
                label="Zona"
                value={
                  data.property.neighborhood ||
                  "Sin especificar"
                }
              />

              <Info
                label="Tipo"
                value={
                  data.property.property_type ||
                  "Sin especificar"
                }
              />

              <Info
                label="Ambientes"
                value={
                  data.property.rooms ||
                  "Sin especificar"
                }
              />

              <Info
                label="Precio publicado"
                value={
                  data.property.approx_price ||
                  money(
                    data.property
                      .approx_price_number
                  )
                }
              />

              <Info
                label="Expensas"
                value={
                  data.property.expenses_amount !==
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
                  "Sin especificar"
                }
              />
            </div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm md:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
              Contrato
            </p>

            {!contractReady ? (
              <>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
                  Todavía falta armar el contrato.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
                  Verlo va a usar los datos que ya conoce y
                  les va a pedir únicamente la información
                  necesaria para completar el acuerdo final.
                </p>

                <button
                  type="button"
                  disabled
                  className="mt-6 rounded-2xl bg-black px-6 py-3.5 text-sm font-bold text-white opacity-50"
                >
                  ARMAR CONTRATO
                </button>

                <p className="mt-3 text-xs text-neutral-400">
                  El formulario contractual es el próximo
                  paso que vamos a conectar.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
                  Contrato generado
                </h2>

                <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-[#ecebe7] p-4 md:p-7">
                  <article
                    className="mx-auto min-h-[900px] max-w-[794px] bg-white px-8 py-12 shadow-sm md:px-16 md:py-16"
                    style={{
                      fontFamily:
                        'Georgia, "Times New Roman", serif',
                    }}
                  >
                    <div className="mb-10 border-b border-black pb-5 text-center">
                      <h3 className="text-xl font-bold uppercase tracking-[0.08em]">
                        Contrato de locación
                      </h3>
                    </div>

                    <div
                      className="text-[15px] leading-[1.85] text-neutral-900"
                      style={{
                        whiteSpace: "pre-wrap",
                        textAlign: "justify",
                      }}
                    >
                      {data.contract.content}
                    </div>
                  </article>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Info
                    label="Precio final"
                    value={money(
                      data.contract.monthly_price
                    )}
                  />

                  <Info
                    label="Depósito"
                    value={money(
                      data.contract.deposit
                    )}
                  />

                  <Info
                    label="Inicio"
                    value={formatDate(
                      data.contract.start_date
                    )}
                  />

                  <Info
                    label="Fin"
                    value={formatDate(
                      data.contract.end_date
                    )}
                  />

                  <Info
                    label="Actualización"
                    value={
                      data.contract
                        .adjustment_method ||
                      "A definir"
                    }
                  />
                </div>
              </>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
              Estado del cierre
            </p>

            <div className="mt-5 space-y-4">
              <StatusRow
                label="Match confirmado"
                done={true}
              />

              <StatusRow
                label="Contrato generado"
                done={contractReady}
              />

              <StatusRow
                label="Aceptado por inquilino"
                done={
                  data.contract
                    .tenant_agreed
                }
              />

              <StatusRow
                label="Aceptado por propietario"
                done={
                  data.contract
                    .owner_agreed
                }
              />
            </div>

            {bothAgreed && (
              <div className="mt-6 rounded-2xl bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-800">
                  Acuerdo completado
                </p>

                <p className="mt-1 text-sm leading-5 text-emerald-700">
                  Las dos partes confirmaron el contrato.
                </p>
              </div>
            )}

            <div className="mt-6 border-t border-black/5 pt-5">
              <p className="text-xs leading-5 text-neutral-400">
                Este espacio corresponde únicamente a este
                match y se accede mediante un enlace privado.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
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
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.11em] text-neutral-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-neutral-800">
        {value}
      </p>
    </div>
  )
}

function StatusRow({
  label,
  done,
}: {
  label: string
  done: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          done
            ? "bg-emerald-100 text-emerald-700"
            : "bg-neutral-100 text-neutral-400",
        ].join(" ")}
      >
        {done ? "✓" : "—"}
      </div>

      <span
        className={
          done
            ? "text-sm font-medium text-neutral-800"
            : "text-sm text-neutral-400"
        }
      >
        {label}
      </span>
    </div>
  )
}
