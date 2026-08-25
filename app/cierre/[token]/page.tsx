"use client"

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  useParams,
} from "next/navigation"

import VerloBrand from "@/components/VerloBrand"

const ARGENTINA_PROVINCES = [
  "Ciudad Autónoma de Buenos Aires",
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
]

type ClosingData = {
  ok: boolean

  viewer: {
    role:
      | "tenant"
      | "owner"

    lead_id:
      string
  }

  contract: {
    id:
      string

    match_id:
      string

    status:
      string

    monthly_price:
      number | null

    deposit:
      number | null

    start_date:
      string | null

    end_date:
      string | null

    adjustment_method:
      string | null

    terms:
      Record<
        string,
        unknown
      >

    content:
      string | null

    tenant_agreed:
      boolean

    owner_agreed:
      boolean

    tenant_agreed_at:
      string | null

    owner_agreed_at:
      string | null

    created_at?:
      string | null

    updated_at?:
      string | null
  }

  match: {
    id:
      string

    score:
      number

    status:
      string

    ready_to_connect_at:
      string | null
  }

  tenant: {
    id:
      string

    full_name:
      string

    email:
      string

    phone:
      string

    document_number?:
      string | null

    verification_status?:
      string | null
  }

  owner: {
    id:
      string

    full_name:
      string

    email:
      string

    phone:
      string
  }

  legal: {
    tenant: {
      full_name:
        string | null

      dni:
        string | null

      tax_id:
        string | null

      civil_status:
        string | null

      legal_address:
        string | null

      city:
        string | null

      province:
        string | null

      country:
        string | null

      postal_code:
        string | null

      phone:
        string | null

      email:
        string | null
    }

    owner: {
      full_name:
        string | null

      dni:
        string | null

      tax_id:
        string | null

      civil_status:
        string | null

      legal_address:
        string | null

      city:
        string | null

      province:
        string | null

      country:
        string | null

      postal_code:
        string | null

      phone:
        string | null

      email:
        string | null

      acting_as:
        string | null

      power_details:
        string | null
    }

    signing_place: {
      city:
        string | null

      province:
        string | null

      country:
        string | null
    }

    property: {
      street:
        string | null

      number:
        string | null

      floor:
        string | null

      unit:
        string | null

      city:
        string | null

      province:
        string | null

      country:
        string | null

      postal_code:
        string | null

      private_address:
        string | null

      floor_unit:
        string | null
    }

    furnishing: {
      status:
        string | null

      inventory:
        string | null

      condition_notes:
        string | null
    }

    completeness: {
      tenant:
        boolean

      owner:
        boolean

      property:
        boolean

      signing_place:
        boolean

      furnishing:
        boolean

      all:
        boolean
    }
  }

  property: {
    address:
      string | null

    floor_unit:
      string | null

    neighborhood:
      string | null

    property_type:
      string | null

    rooms:
      string | null

    approx_price:
      string | null

    approx_price_number:
      number | null

    expenses_amount:
      number | null

    availability_status:
      string | null

    requirements:
      string | null

    visit_conditions:
      string | null

    notes:
      string | null
  }
}

type ContractFormState = {
  monthly_price:
    string

  deposit:
    string

  start_date:
    string

  end_date:
    string

  adjustment_method:
    string

  expenses:
    string

  services:
    string

  payment_method:
    string

  payment_details:
    string

  guarantee_type:
    string

  guarantee_details:
    string

  pets_policy:
    string

  insurance_terms:
    string

  special_conditions:
    string
}

type TenantLegalForm = {
  dni:
    string

  civil_status:
    string

  legal_address:
    string

  city:
    string

  province:
    string

  country:
    string

  postal_code:
    string
}

type OwnerLegalForm = {
  dni:
    string

  tax_id:
    string

  civil_status:
    string

  legal_address:
    string

  city:
    string

  province:
    string

  country:
    string

  postal_code:
    string

  acting_as:
    string

  power_details:
    string
}

type PropertyLegalForm = {
  street:
    string

  number:
    string

  floor:
    string

  unit:
    string

  city:
    string

  province:
    string

  country:
    string

  postal_code:
    string
}

type SigningForm = {
  city:
    string

  province:
    string

  country:
    string
}

type FurnishingForm = {
  status:
    string

  inventory:
    string

  condition_notes:
    string
}

function asString(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value
    : ""
}

function money(
  value:
    number | null
) {
  if (
    value === null ||
    Number.isNaN(
      value
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
    value
  )
}

function parseMoneyInput(
  value: string
) {
  const cleaned =
    String(
      value || ""
    )
      .trim()
      .replace(
        /\$/g,
        ""
      )
      .replace(
        /\s/g,
        ""
      )
      .replace(
        /\./g,
        ""
      )
      .replace(
        /,/g,
        ""
      )
      .replace(
        /[^\d]/g,
        ""
      )

  if (!cleaned) {
    return null
  }

  const parsed =
    Number(
      cleaned
    )

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return null
  }

  return parsed
}

function previewMoney(
  value: string
) {
  const parsed =
    parseMoneyInput(
      value
    )

  if (
    parsed === null
  ) {
    return "A definir"
  }

  return money(
    parsed
  )
}

function humanize(
  value:
    string | null
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
  }

  return (
    dictionary[
      value
    ] ||
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

function formatDate(
  value:
    string | null
) {
  if (!value) {
    return "—"
  }

  const parts =
    value.split(
      "-"
    )

  if (
    parts.length ===
    3
  ) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  return value
}

function furnishingLabel(
  value:
    string | null
) {
  if (
    value ===
    "furnished"
  ) {
    return "Amoblado"
  }

  if (
    value ===
    "partially_furnished"
  ) {
    return "Parcialmente amoblado"
  }

  if (
    value ===
    "unfurnished"
  ) {
    return "Sin amoblar"
  }

  return "A definir"
}

export default function ClosingPage() {
  const params =
    useParams<{
      token:
        string
    }>()

  const token =
    String(
      params?.token ||
        ""
    )

  const contractFormRef =
    useRef<
      HTMLFormElement | null
    >(
      null
    )

  const legalFormRef =
    useRef<
      HTMLDivElement | null
    >(
      null
    )

  const [
    data,
    setData,
  ] =
    useState<
      ClosingData | null
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

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState(
      ""
    )

  const [
    showContractForm,
    setShowContractForm,
  ] =
    useState(
      false
    )

  const [
    showLegalForm,
    setShowLegalForm,
  ] =
    useState(
      false
    )

  const [
    generating,
    setGenerating,
  ] =
    useState(
      false
    )

  const [
    savingLegal,
    setSavingLegal,
  ] =
    useState(
      false
    )

  const [
    accepting,
    setAccepting,
  ] =
    useState(
      false
    )

  const [
    contractForm,
    setContractForm,
  ] =
    useState<
      ContractFormState
    >({
      monthly_price:
        "",

      deposit:
        "",

      start_date:
        "",

      end_date:
        "",

      adjustment_method:
        "",

      expenses:
        "",

      services:
        "",

      payment_method:
        "",

      payment_details:
        "",

      guarantee_type:
        "",

      guarantee_details:
        "",

      pets_policy:
        "",

      insurance_terms:
        "",

      special_conditions:
        "",
    })

  const [
    tenantLegalForm,
    setTenantLegalForm,
  ] =
    useState<
      TenantLegalForm
    >({
      dni:
        "",

      civil_status:
        "",

      legal_address:
        "",

      city:
        "",

      province:
        "",

      country:
        "Argentina",

      postal_code:
        "",
    })

  const [
    ownerLegalForm,
    setOwnerLegalForm,
  ] =
    useState<
      OwnerLegalForm
    >({
      dni:
        "",

      tax_id:
        "",

      civil_status:
        "",

      legal_address:
        "",

      city:
        "",

      province:
        "",

      country:
        "Argentina",

      postal_code:
        "",

      acting_as:
        "owner",

      power_details:
        "",
    })

  const [
    propertyLegalForm,
    setPropertyLegalForm,
  ] =
    useState<
      PropertyLegalForm
    >({
      street:
        "",

      number:
        "",

      floor:
        "",

      unit:
        "",

      city:
        "",

      province:
        "",

      country:
        "Argentina",

      postal_code:
        "",
    })

  const [
    signingForm,
    setSigningForm,
  ] =
    useState<
      SigningForm
    >({
      city:
        "",

      province:
        "",

      country:
        "Argentina",
    })

  const [
    furnishingForm,
    setFurnishingForm,
  ] =
    useState<
      FurnishingForm
    >({
      status:
        "",

      inventory:
        "",

      condition_notes:
        "",
    })

  async function load(
    showLoader =
      true
  ) {
    if (!token) {
      return
    }

    try {
      if (
        showLoader
      ) {
        setLoading(
          true
        )
      }

      setError(
        ""
      )

      const response =
        await fetch(
          `/api/closing-view?token=${encodeURIComponent(
            token
          )}`,
          {
            cache:
              "no-store",
          }
        )

      const json:
        ClosingData =
        await response.json()

      if (
        !response.ok ||
        !json?.ok
      ) {
        throw new Error(
          (
            json as
              ClosingData & {
                error?:
                  string
              }
          )?.error ||
            "No pudimos abrir este cierre."
        )
      }

      setData(
        json
      )

      setContractForm({
        monthly_price:
          json
            .contract
            .monthly_price !==
          null
            ? String(
                json
                  .contract
                  .monthly_price
              )
            : "",

        deposit:
          json
            .contract
            .deposit !==
          null
            ? String(
                json
                  .contract
                  .deposit
              )
            : "",

        start_date:
          json
            .contract
            .start_date ||
          "",

        end_date:
          json
            .contract
            .end_date ||
          "",

        adjustment_method:
          json
            .contract
            .adjustment_method ||
          "",

        expenses:
          asString(
            json
              .contract
              .terms
              ?.expenses
          ),

        services:
          asString(
            json
              .contract
              .terms
              ?.services
          ),

        payment_method:
          asString(
            json
              .contract
              .terms
              ?.payment_method
          ),

        payment_details:
          asString(
            json
              .contract
              .terms
              ?.payment_details
          ),

        guarantee_type:
          asString(
            json
              .contract
              .terms
              ?.guarantee_type
          ),

        guarantee_details:
          asString(
            json
              .contract
              .terms
              ?.guarantee_details
          ),

        pets_policy:
          asString(
            json
              .contract
              .terms
              ?.pets_policy
          ),

        insurance_terms:
          asString(
            json
              .contract
              .terms
              ?.insurance_terms
          ),

        special_conditions:
          asString(
            json
              .contract
              .terms
              ?.special_conditions
          ),
      })

      setTenantLegalForm({
        dni:
          json
            .legal
            .tenant
            .dni ||
          json
            .tenant
            .document_number ||
          "",

        civil_status:
          json
            .legal
            .tenant
            .civil_status ||
          "",

        legal_address:
          json
            .legal
            .tenant
            .legal_address ||
          "",

        city:
          json
            .legal
            .tenant
            .city ||
          "",

        province:
          json
            .legal
            .tenant
            .province ||
          "",

        country:
          json
            .legal
            .tenant
            .country ||
          "Argentina",

        postal_code:
          json
            .legal
            .tenant
            .postal_code ||
          "",
      })

      setOwnerLegalForm({
        dni:
          json
            .legal
            .owner
            .dni ||
          "",

        tax_id:
          json
            .legal
            .owner
            .tax_id ||
          "",

        civil_status:
          json
            .legal
            .owner
            .civil_status ||
          "",

        legal_address:
          json
            .legal
            .owner
            .legal_address ||
          "",

        city:
          json
            .legal
            .owner
            .city ||
          "",

        province:
          json
            .legal
            .owner
            .province ||
          "",

        country:
          json
            .legal
            .owner
            .country ||
          "Argentina",

        postal_code:
          json
            .legal
            .owner
            .postal_code ||
          "",

        acting_as:
          json
            .legal
            .owner
            .acting_as ||
          "owner",

        power_details:
          json
            .legal
            .owner
            .power_details ||
          "",
      })

      setPropertyLegalForm({
        street:
          json
            .legal
            .property
            .street ||
          "",

        number:
          json
            .legal
            .property
            .number ||
          "",

        floor:
          json
            .legal
            .property
            .floor ||
          "",

        unit:
          json
            .legal
            .property
            .unit ||
          "",

        city:
          json
            .legal
            .property
            .city ||
          "",

        province:
          json
            .legal
            .property
            .province ||
          "",

        country:
          json
            .legal
            .property
            .country ||
          "Argentina",

        postal_code:
          json
            .legal
            .property
            .postal_code ||
          "",
      })

      setSigningForm({
        city:
          json
            .legal
            .signing_place
            .city ||
          "",

        province:
          json
            .legal
            .signing_place
            .province ||
          "",

        country:
          json
            .legal
            .signing_place
            .country ||
          "Argentina",
      })

      setFurnishingForm({
        status:
          json
            .legal
            .furnishing
            .status ||
          "",

        inventory:
          json
            .legal
            .furnishing
            .inventory ||
          "",

        condition_notes:
          json
            .legal
            .furnishing
            .condition_notes ||
          "",
      })
    } catch (
      err
    ) {
      setError(
        err instanceof
          Error
          ? err.message
          : "No pudimos abrir este cierre."
      )
    } finally {
      if (
        showLoader
      ) {
        setLoading(
          false
        )
      }
    }
  }

  useEffect(
    () => {
      load()
    },
    [
      token,
    ]
  )

  useEffect(
    () => {
      if (
        !showContractForm
      ) {
        return
      }

      const timer =
        window.setTimeout(
          () => {
            contractFormRef
              .current
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start",
              })
          },
          80
        )

      return () => {
        window.clearTimeout(
          timer
        )
      }
    },
    [
      showContractForm,
    ]
  )

  useEffect(
    () => {
      if (
        !showLegalForm
      ) {
        return
      }

      const timer =
        window.setTimeout(
          () => {
            legalFormRef
              .current
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start",
              })
          },
          80
        )

      return () => {
        window.clearTimeout(
          timer
        )
      }
    },
    [
      showLegalForm,
    ]
  )

  const isOwner =
    data?.viewer
      .role ===
    "owner"

  const counterpart =
    useMemo(
      () => {
        if (!data) {
          return null
        }

        return isOwner
          ? data
              .tenant
          : data
              .owner
      },
      [
        data,
        isOwner,
      ]
    )

  function updateContractField(
    field:
      keyof ContractFormState,

    value:
      string
  ) {
    setContractForm(
      current => ({
        ...current,

        [field]:
          value,
      })
    )
  }

  function updateTenantLegalField(
    field:
      keyof TenantLegalForm,

    value:
      string
  ) {
    setTenantLegalForm(
      current => ({
        ...current,

        [field]:
          value,
      })
    )
  }

  function updateOwnerLegalField(
    field:
      keyof OwnerLegalForm,

    value:
      string
  ) {
    setOwnerLegalForm(
      current => ({
        ...current,

        [field]:
          value,
      })
    )
  }

  function updatePropertyLegalField(
    field:
      keyof PropertyLegalForm,

    value:
      string
  ) {
    setPropertyLegalForm(
      current => ({
        ...current,

        [field]:
          value,
      })
    )
  }

  function updateSigningField(
    field:
      keyof SigningForm,

    value:
      string
  ) {
    setSigningForm(
      current => ({
        ...current,

        [field]:
          value,
      })
    )
  }

  function updateFurnishingField(
    field:
      keyof FurnishingForm,

    value:
      string
  ) {
    setFurnishingForm(
      current => ({
        ...current,

        [field]:
          value,
      })
    )
  }

  function openLegalForm() {
    setError(
      ""
    )

    setSuccessMessage(
      ""
    )

    setShowLegalForm(
      true
    )
  }

  function openContractForm() {
    setError(
      ""
    )

    setSuccessMessage(
      ""
    )

    setShowContractForm(
      true
    )
  }

  async function saveLegalData(
    event:
      FormEvent
  ) {
    event.preventDefault()

    if (!data) {
      return
    }

    try {
      setSavingLegal(
        true
      )

      setError(
        ""
      )

      setSuccessMessage(
        ""
      )

      const payload =
        data
          .viewer
          .role ===
        "tenant"
          ? {
              token,

              tenant: {
                ...tenantLegalForm,
              },
            }
          : {
              token,

              owner: {
                ...ownerLegalForm,
              },

              property: {
                ...propertyLegalForm,
              },

              signing_place: {
                ...signingForm,
              },

              furnishing: {
                ...furnishingForm,
              },
            }

      const response =
        await fetch(
          "/api/closing-legal-data",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
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
            "No pudimos guardar los datos."
        )
      }

      setShowLegalForm(
        false
      )

      setSuccessMessage(
        json
          .contract_invalidated
          ? "Datos guardados. Como cambió información del contrato, la versión anterior quedó invalidada y deberá generarse nuevamente."
          : "Datos legales guardados correctamente."
      )

      await load(
        false
      )
    } catch (
      err
    ) {
      setError(
        err instanceof
          Error
          ? err.message
          : "No pudimos guardar los datos."
      )
    } finally {
      setSavingLegal(
        false
      )
    }
  }

  async function generateContract(
    event:
      FormEvent
  ) {
    event.preventDefault()

    if (!isOwner) {
      return
    }

    try {
      setGenerating(
        true
      )

      setError(
        ""
      )

      setSuccessMessage(
        ""
      )

      const monthlyPrice =
        parseMoneyInput(
          contractForm
            .monthly_price
        )

      const deposit =
        parseMoneyInput(
          contractForm
            .deposit
        )

      if (
        monthlyPrice ===
          null ||
        monthlyPrice <=
          0
      ) {
        throw new Error(
          "Revisá el valor del alquiler mensual."
        )
      }

      if (
        deposit ===
          null ||
        deposit <
          0
      ) {
        throw new Error(
          "Revisá el valor del depósito."
        )
      }

      const response =
        await fetch(
          "/api/closing-generate",
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

                monthly_price:
                  monthlyPrice,

                deposit,

                start_date:
                  contractForm
                    .start_date,

                end_date:
                  contractForm
                    .end_date,

                adjustment_method:
                  contractForm
                    .adjustment_method,

                expenses:
                  contractForm
                    .expenses,

                services:
                  contractForm
                    .services,

                payment_method:
                  contractForm
                    .payment_method,

                payment_details:
                  contractForm
                    .payment_details,

                guarantee_type:
                  contractForm
                    .guarantee_type,

                guarantee_details:
                  contractForm
                    .guarantee_details,

                pets_policy:
                  contractForm
                    .pets_policy,

                insurance_terms:
                  contractForm
                    .insurance_terms,

                special_conditions:
                  contractForm
                    .special_conditions,
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

      setShowContractForm(
        false
      )

      setSuccessMessage(
        "Contrato generado. Revisá cuidadosamente esta versión antes de aceptar."
      )

      await load(
        false
      )
    } catch (
      err
    ) {
      setError(
        err instanceof
          Error
          ? err.message
          : "No pudimos generar el contrato."
      )
    } finally {
      setGenerating(
        false
      )
    }
  }

  async function agreeContract() {
    if (!data) {
      return
    }

    const alreadyAgreed =
      data
        .viewer
        .role ===
      "tenant"
        ? data
            .contract
            .tenant_agreed
        : data
            .contract
            .owner_agreed

    if (
      alreadyAgreed
    ) {
      return
    }

    const confirmed =
      window.confirm(
        "¿Confirmás que leíste el contrato completo y estás de acuerdo con esta versión?"
      )

    if (
      !confirmed
    ) {
      return
    }

    try {
      setAccepting(
        true
      )

      setError(
        ""
      )

      setSuccessMessage(
        ""
      )

      const response =
        await fetch(
          "/api/closing-agree",
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
            "No pudimos registrar tu aceptación."
        )
      }

      await load(
        false
      )

      if (
        json
          .both_agreed
      ) {
        setSuccessMessage(
          "Listo. Las dos partes aceptaron el contrato y el alquiler quedó cerrado en Verlo."
        )
      } else {
        setSuccessMessage(
          "Tu aceptación quedó registrada. Falta la confirmación de la otra parte."
        )
      }
    } catch (
      err
    ) {
      setError(
        err instanceof
          Error
          ? err.message
          : "No pudimos registrar tu aceptación."
      )
    } finally {
      setAccepting(
        false
      )
    }
  }

  function printContract() {
    window.print()
  }

  if (
    loading
  ) {
    return (
      <>
        <main className="closing-centered">
          <VerloBrand />

          <p>
            Cargando tu espacio de cierre...
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
            No pudimos abrir este cierre.
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
    data
      .contract
      .status ===
      "generated" ||
    data
      .contract
      .status ===
      "agreed"

  const contractLocked =
    data
      .contract
      .status ===
    "agreed"

  const bothAgreed =
    data
      .contract
      .tenant_agreed &&
    data
      .contract
      .owner_agreed

  const viewerAgreed =
    data
      .viewer
      .role ===
    "tenant"
      ? data
          .contract
          .tenant_agreed
      : data
          .contract
          .owner_agreed

  const otherAgreed =
    data
      .viewer
      .role ===
    "tenant"
      ? data
          .contract
          .owner_agreed
      : data
          .contract
          .tenant_agreed

  const myLegalComplete =
    isOwner
      ? data
          .legal
          .completeness
          .owner &&
        data
          .legal
          .completeness
          .property &&
        data
          .legal
          .completeness
          .signing_place &&
        data
          .legal
          .completeness
          .furnishing
      : data
          .legal
          .completeness
          .tenant

  return (
    <>
      <main className="closing-page">
        <header className="closing-header no-print">
          <div className="closing-header-inner">
            <VerloBrand />

            <span
              className={
                bothAgreed
                  ? "status-pill completed"
                  : "status-pill"
              }
            >
              {bothAgreed
                ? "ALQUILER CERRADO"
                : "DOBLE OK"}
            </span>
          </div>
        </header>

        <section className="closing-hero no-print">
          <span className="eyebrow">
            ESPACIO DE CIERRE
          </span>

          {bothAgreed ? (
            <>
              <h1>
                Alquiler cerrado.
                <br />

                <em>
                  Acuerdo confirmado.
                </em>
              </h1>

              <p>
                Las dos partes aceptaron esta versión del contrato. El cierre quedó registrado en Verlo.
              </p>
            </>
          ) : (
            <>
              <h1>
                Coincidieron.
                <br />

                <em>
                  Ahora cierren el alquiler.
                </em>
              </h1>

              <p>
                Este es el espacio privado para completar los datos legales, definir las condiciones finales y aceptar el contrato.
              </p>
            </>
          )}
        </section>

        <section className="closing-layout">
          <div className="closing-main">
            {bothAgreed ? (
              <article className="verlo-card final-card no-print">
                <span className="card-kicker">
                  CIERRE COMPLETADO
                </span>

                <h2>
                  El alquiler quedó cerrado.
                </h2>

                <p>
                  El propietario y el inquilino confirmaron la misma versión del contrato.
                </p>
              </article>
            ) : (
              <article className="verlo-card success-card no-print">
                <span className="card-kicker">
                  MATCH CONFIRMADO
                </span>

                <h2>
                  Los dos quieren avanzar.
                </h2>

                <p>
                  Ahora falta completar la información contractual y cerrar las condiciones definitivas.
                </p>
              </article>
            )}

            <article className="verlo-card no-print">
              <span className="card-kicker">
                LA OTRA PARTE
              </span>

              <div className="person-title">
                <div>
                  <h2>
                    {counterpart.full_name}
                  </h2>

                  <span>
                    {isOwner
                      ? "Inquilino"
                      : "Propietario"}
                  </span>
                </div>

                <div className="verified">
                  ✓ Match confirmado
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

            <article className="verlo-card no-print">
              <div className="section-heading">
                <div>
                  <span className="card-kicker">
                    DATOS PARA EL CONTRATO
                  </span>

                  <h2>
                    {isOwner
                      ? "Tus datos, el inmueble y la celebración"
                      : "Tus datos legales"}
                  </h2>

                  <p>
                    {isOwner
                      ? "Confirmá los datos que identifican legalmente a las partes y al inmueble. La dirección contractual debe ser exacta."
                      : "Confirmá tus datos legales. Tu DNI se completa automáticamente con la información que ya cargaste en Verlo."}
                  </p>
                </div>

                {!contractLocked && (
                  <button
                    type="button"
                    className={
                      myLegalComplete
                        ? "secondary-button"
                        : "primary-button"
                    }
                    onClick={
                      openLegalForm
                    }
                  >
                    {myLegalComplete
                      ? "EDITAR DATOS"
                      : "COMPLETAR DATOS"}
                  </button>
                )}
              </div>

              <div className="legal-status-grid">
                <LegalStatus
                  label="Datos del inquilino"
                  done={
                    data
                      .legal
                      .completeness
                      .tenant
                  }
                />

                <LegalStatus
                  label="Datos del propietario"
                  done={
                    data
                      .legal
                      .completeness
                      .owner
                  }
                />

                <LegalStatus
                  label="Dirección exacta"
                  done={
                    data
                      .legal
                      .completeness
                      .property
                  }
                />

                <LegalStatus
                  label="Lugar de celebración"
                  done={
                    data
                      .legal
                      .completeness
                      .signing_place
                  }
                />

                <LegalStatus
                  label="Amoblamiento final"
                  done={
                    data
                      .legal
                      .completeness
                      .furnishing
                  }
                />
              </div>

              {showLegalForm &&
                !contractLocked && (
                  <div
                    ref={
                      legalFormRef
                    }
                    className="legal-form-wrap"
                  >
                    {isOwner ? (
                      <form
                        onSubmit={
                          saveLegalData
                        }
                      >
                        <div className="edit-alert">
                          <strong>
                            Estos datos forman parte del contrato
                          </strong>

                          <span>
                            Si modificás datos después de haber generado el contrato, esa versión se invalida y ambas partes deberán aceptar la nueva.
                          </span>
                        </div>

                        <div className="form-section">
                          <h3>
                            Datos legales del propietario
                          </h3>

                          <div className="form-grid">
                            <Field
                              label="DNI"
                              value={
                                ownerLegalForm.dni
                              }
                              placeholder="Ej. 30123456"
                              onChange={
                                value =>
                                  updateOwnerLegalField(
                                    "dni",
                                    value
                                  )
                              }
                            />

                            <Field
                              label="CUIT / CUIL"
                              value={
                                ownerLegalForm.tax_id
                              }
                              placeholder="Opcional si informás DNI"
                              onChange={
                                value =>
                                  updateOwnerLegalField(
                                    "tax_id",
                                    value
                                  )
                              }
                            />

                            <SelectField
                              label="Estado civil"
                              value={
                                ownerLegalForm.civil_status
                              }
                              required
                              options={[
                                [
                                  "",
                                  "Seleccionar",
                                ],
                                [
                                  "soltero/a",
                                  "Soltero/a",
                                ],
                                [
                                  "casado/a",
                                  "Casado/a",
                                ],
                                [
                                  "divorciado/a",
                                  "Divorciado/a",
                                ],
                                [
                                  "viudo/a",
                                  "Viudo/a",
                                ],
                                [
                                  "unión convivencial",
                                  "Unión convivencial",
                                ],
                              ]}
                              onChange={
                                value =>
                                  updateOwnerLegalField(
                                    "civil_status",
                                    value
                                  )
                              }
                            />

                            <SelectField
                              label="Actúa como"
                              value={
                                ownerLegalForm.acting_as
                              }
                              required
                              options={[
                                [
                                  "owner",
                                  "Propietario/a",
                                ],
                                [
                                  "usufructuary",
                                  "Usufructuario/a",
                                ],
                                [
                                  "attorney",
                                  "Apoderado/a",
                                ],
                                [
                                  "representative",
                                  "Representante",
                                ],
                              ]}
                              onChange={
                                value =>
                                  updateOwnerLegalField(
                                    "acting_as",
                                    value
                                  )
                              }
                            />
                          </div>

                          {(ownerLegalForm.acting_as ===
                            "attorney" ||
                            ownerLegalForm.acting_as ===
                              "representative") && (
                            <TextAreaField
                              label="Datos del poder / representación"
                              value={
                                ownerLegalForm.power_details
                              }
                              placeholder="Ej. Poder otorgado por escritura..."
                              onChange={
                                value =>
                                  updateOwnerLegalField(
                                    "power_details",
                                    value
                                  )
                              }
                            />
                          )}
                        </div>

                        <AddressFields
                          title="Domicilio legal del propietario"
                          address={
                            ownerLegalForm.legal_address
                          }
                          city={
                            ownerLegalForm.city
                          }
                          province={
                            ownerLegalForm.province
                          }
                          country={
                            ownerLegalForm.country
                          }
                          postalCode={
                            ownerLegalForm.postal_code
                          }
                          onAddress={
                            value =>
                              updateOwnerLegalField(
                                "legal_address",
                                value
                              )
                          }
                          onCity={
                            value =>
                              updateOwnerLegalField(
                                "city",
                                value
                              )
                          }
                          onProvince={
                            value =>
                              updateOwnerLegalField(
                                "province",
                                value
                              )
                          }
                          onCountry={
                            value =>
                              updateOwnerLegalField(
                                "country",
                                value
                              )
                          }
                          onPostalCode={
                            value =>
                              updateOwnerLegalField(
                                "postal_code",
                                value
                              )
                          }
                        />

                        <div className="form-section">
                          <h3>
                            Dirección contractual del inmueble
                          </h3>

                          {data
                            .legal
                            .property
                            .private_address && (
                            <div className="reference-box">
                              <span>
                                DIRECCIÓN PRIVADA CARGADA ANTERIORMENTE
                              </span>

                              <strong>
                                {
                                  data
                                    .legal
                                    .property
                                    .private_address
                                }
                              </strong>

                              {data
                                .legal
                                .property
                                .floor_unit && (
                                <small>
                                  {
                                    data
                                      .legal
                                      .property
                                      .floor_unit
                                  }
                                </small>
                              )}

                              <p>
                                Usala solamente como referencia. Confirmá abajo la dirección contractual completa.
                              </p>
                            </div>
                          )}

                          <div className="form-grid">
                            <Field
                              label="Calle"
                              value={
                                propertyLegalForm.street
                              }
                              required
                              placeholder="Ej. Av. Francisco Beiró"
                              onChange={
                                value =>
                                  updatePropertyLegalField(
                                    "street",
                                    value
                                  )
                              }
                            />

                            <Field
                              label="Número"
                              value={
                                propertyLegalForm.number
                              }
                              required
                              placeholder="Ej. 4653"
                              onChange={
                                value =>
                                  updatePropertyLegalField(
                                    "number",
                                    value
                                  )
                              }
                            />

                            <Field
                              label="Piso"
                              value={
                                propertyLegalForm.floor
                              }
                              placeholder="Ej. 5"
                              onChange={
                                value =>
                                  updatePropertyLegalField(
                                    "floor",
                                    value
                                  )
                              }
                            />

                            <Field
                              label="Departamento / unidad"
                              value={
                                propertyLegalForm.unit
                              }
                              placeholder="Ej. 6"
                              onChange={
                                value =>
                                  updatePropertyLegalField(
                                    "unit",
                                    value
                                  )
                              }
                            />

                            <Field
                              label="Localidad / ciudad"
                              value={
                                propertyLegalForm.city
                              }
                              required
                              placeholder="Ej. Villa Devoto"
                              onChange={
                                value =>
                                  updatePropertyLegalField(
                                    "city",
                                    value
                                  )
                              }
                            />

                            <ProvinceField
                              label="Provincia / jurisdicción"
                              value={
                                propertyLegalForm.province
                              }
                              country={
                                propertyLegalForm.country
                              }
                              required
                              onChange={
                                value =>
                                  updatePropertyLegalField(
                                    "province",
                                    value
                                  )
                              }
                            />

                            <Field
                              label="País"
                              value={
                                propertyLegalForm.country
                              }
                              required
                              onChange={
                                value =>
                                  updatePropertyLegalField(
                                    "country",
                                    value
                                  )
                              }
                            />

                            <Field
                              label="Código postal"
                              value={
                                propertyLegalForm.postal_code
                              }
                              placeholder="Ej. 1419"
                              onChange={
                                value =>
                                  updatePropertyLegalField(
                                    "postal_code",
                                    value
                                  )
                              }
                            />
                          </div>
                        </div>

                        <div className="form-section">
                          <h3>
                            Lugar de celebración
                          </h3>

                          <p className="section-help">
                            Es el lugar que figurará al comienzo del contrato. No tiene que coincidir necesariamente con el domicilio del inmueble.
                          </p>

                          <div className="form-grid">
                            <Field
                              label="Ciudad / localidad"
                              value={
                                signingForm.city
                              }
                              required
                              onChange={
                                value =>
                                  updateSigningField(
                                    "city",
                                    value
                                  )
                              }
                            />

                            <ProvinceField
                              label="Provincia / jurisdicción"
                              value={
                                signingForm.province
                              }
                              country={
                                signingForm.country
                              }
                              required
                              onChange={
                                value =>
                                  updateSigningField(
                                    "province",
                                    value
                                  )
                              }
                            />

                            <Field
                              label="País"
                              value={
                                signingForm.country
                              }
                              required
                              onChange={
                                value =>
                                  updateSigningField(
                                    "country",
                                    value
                                  )
                              }
                            />
                          </div>
                        </div>

                        <div className="form-section">
                          <h3>
                            Amoblamiento acordado
                          </h3>

                          <p className="section-help">
                            Acá ya no importa cómo estaba planteado al comienzo. Elegí cómo se entregará efectivamente el inmueble según lo acordado entre ustedes.
                          </p>

                          <SelectField
                            label="Estado final"
                            value={
                              furnishingForm.status
                            }
                            required
                            options={[
                              [
                                "",
                                "Seleccionar",
                              ],
                              [
                                "furnished",
                                "Amoblado",
                              ],
                              [
                                "unfurnished",
                                "Sin amoblar",
                              ],
                              [
                                "partially_furnished",
                                "Parcialmente amoblado",
                              ],
                            ]}
                            onChange={
                              value =>
                                updateFurnishingField(
                                  "status",
                                  value
                                )
                            }
                          />

                          {(furnishingForm.status ===
                            "furnished" ||
                            furnishingForm.status ===
                              "partially_furnished") && (
                            <TextAreaField
                              label="Inventario de muebles, artefactos y bienes incluidos"
                              value={
                                furnishingForm.inventory
                              }
                              required
                              placeholder="Ej. Heladera Samsung, mesa con cuatro sillas, cama de dos plazas, dos mesas de luz..."
                              onChange={
                                value =>
                                  updateFurnishingField(
                                    "inventory",
                                    value
                                  )
                              }
                            />
                          )}

                          {furnishingForm.status !==
                            "unfurnished" && (
                            <TextAreaField
                              label="Estado y observaciones"
                              value={
                                furnishingForm.condition_notes
                              }
                              placeholder="Ej. Muebles en buen estado general, heladera funcionando correctamente..."
                              onChange={
                                value =>
                                  updateFurnishingField(
                                    "condition_notes",
                                    value
                                  )
                              }
                            />
                          )}
                        </div>

                        <div className="form-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={
                              () =>
                                setShowLegalForm(
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
                              savingLegal
                            }
                          >
                            {savingLegal
                              ? "GUARDANDO..."
                              : "GUARDAR DATOS"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form
                        onSubmit={
                          saveLegalData
                        }
                      >
                        <div className="edit-alert">
                          <strong>
                            Confirmá tus datos personales
                          </strong>

                          <span>
                            Estos datos aparecerán en el contrato definitivo.
                          </span>
                        </div>

                        <div className="form-section">
                          <h3>
                            Identificación
                          </h3>

                          <div className="form-grid">
                            <Field
                              label="DNI"
                              value={
                                tenantLegalForm.dni
                              }
                              required
                              placeholder="Ej. 30123456"
                              onChange={
                                value =>
                                  updateTenantLegalField(
                                    "dni",
                                    value
                                  )
                              }
                            />

                            <SelectField
                              label="Estado civil"
                              value={
                                tenantLegalForm.civil_status
                              }
                              required
                              options={[
                                [
                                  "",
                                  "Seleccionar",
                                ],
                                [
                                  "soltero/a",
                                  "Soltero/a",
                                ],
                                [
                                  "casado/a",
                                  "Casado/a",
                                ],
                                [
                                  "divorciado/a",
                                  "Divorciado/a",
                                ],
                                [
                                  "viudo/a",
                                  "Viudo/a",
                                ],
                                [
                                  "unión convivencial",
                                  "Unión convivencial",
                                ],
                              ]}
                              onChange={
                                value =>
                                  updateTenantLegalField(
                                    "civil_status",
                                    value
                                  )
                              }
                            />
                          </div>

                          {data
                            .tenant
                            .document_number && (
                            <p className="section-help">
                              El DNI fue recuperado de la validación que ya realizaste en Verlo. Revisalo y corregilo solamente si fuese necesario.
                            </p>
                          )}
                        </div>

                        <AddressFields
                          title="Tu domicilio legal actual"
                          address={
                            tenantLegalForm.legal_address
                          }
                          city={
                            tenantLegalForm.city
                          }
                          province={
                            tenantLegalForm.province
                          }
                          country={
                            tenantLegalForm.country
                          }
                          postalCode={
                            tenantLegalForm.postal_code
                          }
                          onAddress={
                            value =>
                              updateTenantLegalField(
                                "legal_address",
                                value
                              )
                          }
                          onCity={
                            value =>
                              updateTenantLegalField(
                                "city",
                                value
                              )
                          }
                          onProvince={
                            value =>
                              updateTenantLegalField(
                                "province",
                                value
                              )
                          }
                          onCountry={
                            value =>
                              updateTenantLegalField(
                                "country",
                                value
                              )
                          }
                          onPostalCode={
                            value =>
                              updateTenantLegalField(
                                "postal_code",
                                value
                              )
                          }
                        />

                        <div className="form-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={
                              () =>
                                setShowLegalForm(
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
                              savingLegal
                            }
                          >
                            {savingLegal
                              ? "GUARDANDO..."
                              : "GUARDAR MIS DATOS"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
            </article>

            <article className="verlo-card no-print">
              <span className="card-kicker">
                PROPIEDAD
              </span>

              <h2>
                {data
                  .legal
                  .property
                  .street &&
                data
                  .legal
                  .property
                  .number
                  ? `${data.legal.property.street} ${data.legal.property.number}`
                  : data
                      .property
                      .address ||
                    "Dirección contractual pendiente"}
              </h2>

              {data
                .property
                .floor_unit && (
                <p className="property-subtitle">
                  {
                    data
                      .property
                      .floor_unit
                  }
                </p>
              )}

              <div className="info-grid">
                <Info
                  label="Zona de búsqueda"
                  value={
                    data
                      .property
                      .neighborhood ||
                    "—"
                  }
                />

                <Info
                  label="Tipo"
                  value={
                    humanize(
                      data
                        .property
                        .property_type
                    )
                  }
                />

                <Info
                  label="Ambientes"
                  value={
                    data
                      .property
                      .rooms ||
                    "—"
                  }
                />

                <Info
                  label="Precio publicado"
                  value={
                    data
                      .property
                      .approx_price ||
                    money(
                      data
                        .property
                        .approx_price_number
                    )
                  }
                />

                <Info
                  label="Expensas publicadas"
                  value={
                    data
                      .property
                      .expenses_amount !==
                    null
                      ? money(
                          data
                            .property
                            .expenses_amount
                        )
                      : "A definir"
                  }
                />

                <Info
                  label="Amoblamiento final"
                  value={
                    furnishingLabel(
                      data
                        .legal
                        .furnishing
                        .status
                    )
                  }
                />
              </div>
            </article>

            <article className="verlo-card contract-card">
              <div className="contract-heading no-print">
                <div>
                  <span className="card-kicker">
                    CONTRATO
                  </span>

                  <h2>
                    {contractGenerated
                      ? "Contrato del alquiler"
                      : isOwner
                        ? "Definí las condiciones finales"
                        : "Esperando el contrato definitivo"}
                  </h2>

                  <p>
                    {contractGenerated
                      ? contractLocked
                        ? "Esta es la versión final aceptada por las dos partes."
                        : isOwner
                          ? "Revisá el documento completo. Si necesitás corregir condiciones, podés regenerarlo desde esta misma pantalla."
                          : "El propietario generó esta versión. Revisala completa antes de aceptarla."
                      : isOwner
                        ? data
                            .legal
                            .completeness
                            .all
                          ? "Los datos legales están completos. Ya podés definir las condiciones económicas y generar el contrato."
                          : "Antes de generar el contrato deben estar completos los datos legales del propietario, del inquilino y del inmueble."
                        : data
                            .legal
                            .completeness
                            .tenant
                          ? "Tus datos están completos. El propietario debe terminar de definir las condiciones y generar el contrato."
                          : "Primero completá tus datos legales para poder avanzar."}
                  </p>
                </div>

                {isOwner &&
                  !showContractForm &&
                  !contractLocked && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={
                        openContractForm
                      }
                    >
                      {contractGenerated
                        ? "EDITAR CONDICIONES"
                        : "ARMAR CONTRATO"}
                    </button>
                  )}
              </div>

              {isOwner &&
                showContractForm &&
                !contractLocked && (
                  <form
                    ref={
                      contractFormRef
                    }
                    className="contract-form no-print"
                    onSubmit={
                      generateContract
                    }
                  >
                    <div className="edit-alert">
                      <strong>
                        Condiciones finales del alquiler
                      </strong>

                      <span>
                        No uses el botón Atrás del navegador. Podés editar y regenerar el contrato desde acá. Cada regeneración invalida cualquier aceptación anterior.
                      </span>
                    </div>

                    {!data
                      .legal
                      .completeness
                      .all && (
                      <div className="blocking-alert">
                        <strong>
                          Todavía faltan datos legales
                        </strong>

                        <span>
                          Podés preparar las condiciones, pero el backend no permitirá generar el contrato hasta que ambas partes hayan completado los datos obligatorios.
                        </span>
                      </div>
                    )}

                    <div className="form-section">
                      <h3>
                        Condiciones económicas
                      </h3>

                      <div className="form-grid">
                        <Field
                          label="Alquiler mensual"
                          type="text"
                          inputMode="numeric"
                          value={
                            contractForm.monthly_price
                          }
                          placeholder="Ej. 700.000"
                          required
                          onChange={
                            value =>
                              updateContractField(
                                "monthly_price",
                                value
                              )
                          }
                        />

                        <Field
                          label="Depósito"
                          type="text"
                          inputMode="numeric"
                          value={
                            contractForm.deposit
                          }
                          placeholder="Ej. 700.000"
                          required
                          onChange={
                            value =>
                              updateContractField(
                                "deposit",
                                value
                              )
                          }
                        />

                        <Field
                          label="Fecha de inicio"
                          type="date"
                          value={
                            contractForm.start_date
                          }
                          required
                          onChange={
                            value =>
                              updateContractField(
                                "start_date",
                                value
                              )
                          }
                        />

                        <Field
                          label="Fecha de finalización"
                          type="date"
                          value={
                            contractForm.end_date
                          }
                          required
                          onChange={
                            value =>
                              updateContractField(
                                "end_date",
                                value
                              )
                          }
                        />
                      </div>

                      <p className="money-help">
                        Podés escribir 700000, 700.000, 700,000 o $700.000. Verlo lo convierte al importe correcto antes de guardarlo.
                      </p>
                    </div>

                    <div className="form-section">
                      <h3>
                        Actualización
                      </h3>

                      <TextAreaField
                        label="Mecanismo de actualización"
                        value={
                          contractForm.adjustment_method
                        }
                        required
                        placeholder="Ej. Actualización trimestral según IPC publicado por INDEC."
                        onChange={
                          value =>
                            updateContractField(
                              "adjustment_method",
                              value
                            )
                        }
                      />
                    </div>

                    <div className="form-section">
                      <h3>
                        Forma de pago
                      </h3>

                      <TextAreaField
                        label="Modalidad"
                        value={
                          contractForm.payment_method
                        }
                        placeholder="Ej. Transferencia bancaria por mes adelantado, del día 1 al 10 de cada mes."
                        onChange={
                          value =>
                            updateContractField(
                              "payment_method",
                              value
                            )
                        }
                      />

                      <TextAreaField
                        label="Datos / instrucciones de pago"
                        value={
                          contractForm.payment_details
                        }
                        placeholder="Ej. Transferencia al alias..., enviar comprobante a..."
                        onChange={
                          value =>
                            updateContractField(
                              "payment_details",
                              value
                            )
                        }
                      />
                    </div>

                    <div className="form-section">
                      <h3>
                        Gastos y servicios
                      </h3>

                      <TextAreaField
                        label="Expensas, impuestos, tasas y gastos"
                        value={
                          contractForm.expenses
                        }
                        placeholder="Ej. Expensas ordinarias a cargo del inquilino; extraordinarias a cargo del propietario; ABL a cargo del propietario."
                        onChange={
                          value =>
                            updateContractField(
                              "expenses",
                              value
                            )
                        }
                      />

                      <TextAreaField
                        label="Servicios"
                        value={
                          contractForm.services
                        }
                        placeholder="Ej. Electricidad, gas, agua e internet a cargo del inquilino."
                        onChange={
                          value =>
                            updateContractField(
                              "services",
                              value
                            )
                        }
                      />
                    </div>

                    <div className="form-section">
                      <h3>
                        Garantía
                      </h3>

                      <Field
                        label="Tipo de garantía"
                        value={
                          contractForm.guarantee_type
                        }
                        placeholder="Ej. Seguro de caución / garantía propietaria / fiador"
                        onChange={
                          value =>
                            updateContractField(
                              "guarantee_type",
                              value
                            )
                        }
                      />

                      <TextAreaField
                        label="Detalle de la garantía"
                        value={
                          contractForm.guarantee_details
                        }
                        placeholder="Ej. Póliza emitida por..., CUIT..., número de póliza..."
                        onChange={
                          value =>
                            updateContractField(
                              "guarantee_details",
                              value
                            )
                        }
                      />
                    </div>

                    <div className="form-section">
                      <h3>
                        Mascotas y seguro
                      </h3>

                      <TextAreaField
                        label="Condición sobre mascotas"
                        value={
                          contractForm.pets_policy
                        }
                        placeholder="Ej. Se permiten mascotas domésticas respetando el reglamento del edificio."
                        onChange={
                          value =>
                            updateContractField(
                              "pets_policy",
                              value
                            )
                        }
                      />

                      <TextAreaField
                        label="Seguro"
                        value={
                          contractForm.insurance_terms
                        }
                        placeholder="Ej. El inquilino contratará seguro de incendio durante toda la locación."
                        onChange={
                          value =>
                            updateContractField(
                              "insurance_terms",
                              value
                            )
                        }
                      />
                    </div>

                    <div className="form-section">
                      <h3>
                        Condiciones particulares
                      </h3>

                      <TextAreaField
                        label="Acuerdos adicionales"
                        value={
                          contractForm.special_conditions
                        }
                        placeholder="Cualquier condición adicional acordada entre las partes."
                        onChange={
                          value =>
                            updateContractField(
                              "special_conditions",
                              value
                            )
                        }
                      />
                    </div>

                    <div className="review-before-generate">
                      <span className="card-kicker">
                        REVISÁ ANTES DE GENERAR
                      </span>

                      <h3>
                        Estos valores van a quedar escritos en el contrato
                      </h3>

                      <div className="review-grid">
                        <div>
                          <span>
                            ALQUILER MENSUAL
                          </span>

                          <strong>
                            {previewMoney(
                              contractForm.monthly_price
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            DEPÓSITO
                          </span>

                          <strong>
                            {previewMoney(
                              contractForm.deposit
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            INICIO
                          </span>

                          <strong>
                            {formatDate(
                              contractForm.start_date ||
                                null
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            FINALIZACIÓN
                          </span>

                          <strong>
                            {formatDate(
                              contractForm.end_date ||
                                null
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="review-adjustment">
                        <span>
                          ACTUALIZACIÓN
                        </span>

                        <strong>
                          {contractForm.adjustment_method ||
                            "A definir"}
                        </strong>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={
                          () =>
                            setShowContractForm(
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
                          : contractGenerated
                            ? "GUARDAR Y REGENERAR CONTRATO"
                            : "GENERAR CONTRATO"}
                      </button>
                    </div>
                  </form>
                )}

              {error && (
                <div className="form-error no-print">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="success-message no-print">
                  {successMessage}
                </div>
              )}

              {contractGenerated &&
                data
                  .contract
                  .content && (
                  <>
                    <div className="document-actions no-print">
                      {isOwner &&
                        !contractLocked && (
                        <button
                          type="button"
                          className="secondary-button edit-document-button"
                          onClick={
                            openContractForm
                          }
                        >
                          EDITAR CONDICIONES
                        </button>
                      )}

                      <button
                        type="button"
                        className="secondary-button print-button"
                        onClick={
                          printContract
                        }
                      >
                        IMPRIMIR / GUARDAR PDF
                      </button>
                    </div>

                    <div className="contract-summary no-print">
                      <Info
                        label="Alquiler mensual"
                        value={
                          money(
                            data
                              .contract
                              .monthly_price
                          )
                        }
                      />

                      <Info
                        label="Depósito"
                        value={
                          money(
                            data
                              .contract
                              .deposit
                          )
                        }
                      />

                      <Info
                        label="Inicio"
                        value={
                          formatDate(
                            data
                              .contract
                              .start_date
                          )
                        }
                      />

                      <Info
                        label="Finalización"
                        value={
                          formatDate(
                            data
                              .contract
                              .end_date
                          )
                        }
                      />

                      <Info
                        label="Actualización"
                        value={
                          data
                            .contract
                            .adjustment_method ||
                          "—"
                        }
                      />

                      <Info
                        label="Amoblamiento"
                        value={
                          furnishingLabel(
                            data
                              .legal
                              .furnishing
                              .status
                          )
                        }
                      />
                    </div>

                    <div className="document-shell print-area">
                      <article className="contract-document">
                        <div className="document-brand">
                          <VerloBrand
                            width={
                              28
                            }
                            showText={
                              true
                            }
                          />
                        </div>

                        <div className="document-title">
                          CONTRATO DE LOCACIÓN DE VIVIENDA
                        </div>

                        <div className="document-rule" />

                        <div className="contract-copy">
                          {
                            data
                              .contract
                              .content
                          }
                        </div>

                        <div className="document-footer">
                          Documento generado en Verlo
                        </div>
                      </article>
                    </div>

                    <div className="agreement-panel no-print">
                      {bothAgreed ? (
                        <div className="agreement-complete">
                          <span className="agreement-icon">
                            ✓
                          </span>

                          <div>
                            <strong>
                              Contrato aceptado por las dos partes
                            </strong>

                            <p>
                              Este alquiler quedó cerrado en Verlo.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="agreement-copy">
                            <span className="card-kicker">
                              TU CONFIRMACIÓN
                            </span>

                            <h3>
                              {viewerAgreed
                                ? "Tu aceptación ya está registrada."
                                : "¿Estás de acuerdo con este contrato?"}
                            </h3>

                            <p>
                              {viewerAgreed
                                ? otherAgreed
                                  ? "Las dos partes ya confirmaron."
                                  : "Ahora falta que la otra parte confirme esta misma versión."
                                : isOwner
                                  ? "Confirmá solamente después de revisar el documento completo. Si detectás un error, usá EDITAR CONDICIONES antes de aceptar."
                                  : "Confirmá solamente después de leer el documento completo. Si detectás un dato incorrecto, no aceptes todavía y coordiná la corrección con el propietario."}
                            </p>
                          </div>

                          <button
                            type="button"
                            className={
                              viewerAgreed
                                ? "agree-button agreed"
                                : "agree-button"
                            }
                            disabled={
                              accepting ||
                              viewerAgreed
                            }
                            onClick={
                              agreeContract
                            }
                          >
                            {accepting
                              ? "REGISTRANDO..."
                              : viewerAgreed
                                ? "✓ YA ACEPTASTE ESTE CONTRATO"
                                : "ESTOY DE ACUERDO CON ESTE CONTRATO"}
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
            </article>
          </div>

          <aside className="closing-sidebar no-print">
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
                  label="Datos tenant"
                  done={
                    data
                      .legal
                      .completeness
                      .tenant
                  }
                />

                <Step
                  label="Datos owner"
                  done={
                    data
                      .legal
                      .completeness
                      .owner
                  }
                />

                <Step
                  label="Datos del inmueble"
                  done={
                    data
                      .legal
                      .completeness
                      .property
                  }
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
                    data
                      .contract
                      .tenant_agreed
                  }
                />

                <Step
                  label="Aceptado por propietario"
                  done={
                    data
                      .contract
                      .owner_agreed
                  }
                />

                <Step
                  label="Alquiler cerrado"
                  done={
                    bothAgreed
                  }
                />
              </div>

              {!bothAgreed &&
                viewerAgreed && (
                  <div className="waiting-box">
                    <strong>
                      Tu parte está lista
                    </strong>

                    <span>
                      Esperamos la confirmación de la otra parte.
                    </span>
                  </div>
                )}

              {bothAgreed && (
                <div className="complete-box">
                  <strong>
                    Alquiler cerrado
                  </strong>

                  <span>
                    Las dos partes aceptaron el contrato.
                  </span>
                </div>
              )}

              <p className="sidebar-note">
                Este enlace es privado y corresponde únicamente a este cierre. Guardalo para volver a consultar el contrato.
              </p>
            </div>
          </aside>
        </section>

        {isOwner &&
          contractGenerated &&
          !contractLocked &&
          !showContractForm && (
            <button
              type="button"
              className="floating-edit-button no-print"
              onClick={
                openContractForm
              }
            >
              EDITAR CONDICIONES
            </button>
          )}
      </main>

      <Styles />
    </>
  )
}

function Info({
  label,
  value,
}: {
  label:
    string

  value:
    string
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

function LegalStatus({
  label,
  done,
}: {
  label:
    string

  done:
    boolean
}) {
  return (
    <div
      className={
        done
          ? "legal-status done"
          : "legal-status"
      }
    >
      <span className="legal-status-icon">
        {done
          ? "✓"
          : "!"}
      </span>

      <span>
        {label}
      </span>
    </div>
  )
}

function Field({
  label,
  type =
    "text",
  inputMode,
  value,
  placeholder,
  required,
  onChange,
}: {
  label:
    string

  type?:
    string

  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search"

  value:
    string

  placeholder?:
    string

  required?:
    boolean

  onChange:
    (
      value:
        string
    ) => void
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <input
        type={
          type
        }
        inputMode={
          inputMode
        }
        value={
          value
        }
        placeholder={
          placeholder
        }
        required={
          required
        }
        onChange={
          event =>
            onChange(
              event
                .target
                .value
            )
        }
      />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  placeholder,
  required,
  onChange,
}: {
  label:
    string

  value:
    string

  placeholder?:
    string

  required?:
    boolean

  onChange:
    (
      value:
        string
    ) => void
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <textarea
        value={
          value
        }
        placeholder={
          placeholder
        }
        required={
          required
        }
        onChange={
          event =>
            onChange(
              event
                .target
                .value
            )
        }
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  required,
  onChange,
}: {
  label:
    string

  value:
    string

  options:
    Array<
      [
        string,
        string,
      ]
    >

  required?:
    boolean

  onChange:
    (
      value:
        string
    ) => void
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <select
        value={
          value
        }
        required={
          required
        }
        onChange={
          event =>
            onChange(
              event
                .target
                .value
            )
        }
      >
        {options.map(
          (
            [
              optionValue,
              optionLabel,
            ]
          ) => (
            <option
              key={
                optionValue
              }
              value={
                optionValue
              }
            >
              {
                optionLabel
              }
            </option>
          )
        )}
      </select>
    </label>
  )
}

function ProvinceField({
  label,
  value,
  country,
  required,
  onChange,
}: {
  label:
    string

  value:
    string

  country:
    string

  required?:
    boolean

  onChange:
    (
      value:
        string
    ) => void
}) {
  if (
    country
      .trim()
      .toLowerCase() !==
    "argentina"
  ) {
    return (
      <Field
        label={
          label
        }
        value={
          value
        }
        required={
          required
        }
        placeholder="Provincia / estado / región"
        onChange={
          onChange
        }
      />
    )
  }

  return (
    <label className="field">
      <span>
        {label}
      </span>

      <select
        value={
          value
        }
        required={
          required
        }
        onChange={
          event =>
            onChange(
              event
                .target
                .value
            )
        }
      >
        <option value="">
          Seleccionar
        </option>

        {ARGENTINA_PROVINCES.map(
          province => (
            <option
              key={
                province
              }
              value={
                province
              }
            >
              {
                province
              }
            </option>
          )
        )}
      </select>
    </label>
  )
}

function AddressFields({
  title,
  address,
  city,
  province,
  country,
  postalCode,
  onAddress,
  onCity,
  onProvince,
  onCountry,
  onPostalCode,
}: {
  title:
    string

  address:
    string

  city:
    string

  province:
    string

  country:
    string

  postalCode:
    string

  onAddress:
    (
      value:
        string
    ) => void

  onCity:
    (
      value:
        string
    ) => void

  onProvince:
    (
      value:
        string
    ) => void

  onCountry:
    (
      value:
        string
    ) => void

  onPostalCode:
    (
      value:
        string
    ) => void
}) {
  return (
    <div className="form-section">
      <h3>
        {title}
      </h3>

      <div className="form-grid">
        <Field
          label="Domicilio"
          value={
            address
          }
          required
          placeholder="Calle, número, piso/depto si corresponde"
          onChange={
            onAddress
          }
        />

        <Field
          label="Localidad / ciudad"
          value={
            city
          }
          required
          onChange={
            onCity
          }
        />

        <ProvinceField
          label="Provincia / jurisdicción"
          value={
            province
          }
          country={
            country
          }
          required
          onChange={
            onProvince
          }
        />

        <Field
          label="País"
          value={
            country
          }
          required
          onChange={
            onCountry
          }
        />

        <Field
          label="Código postal"
          value={
            postalCode
          }
          placeholder="Opcional"
          onChange={
            onPostalCode
          }
        />
      </div>
    </div>
  )
}

function Step({
  label,
  done,
}: {
  label:
    string

  done:
    boolean
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

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        background: #f8f6f1;
        color: #050002;
        font-family: Arial, Helvetica, sans-serif;
      }

      button,
      input,
      textarea,
      select {
        font-family: inherit;
      }

      .closing-page {
        min-height: 100vh;
        background:
          radial-gradient(
            700px 420px at 85% 0%,
            rgba(195, 121, 134, 0.16),
            transparent 65%
          ),
          #f8f6f1;
      }

      .closing-header {
        position: sticky;
        top: 0;
        z-index: 50;
        height: 76px;
        background: rgba(242, 235, 236, 0.86);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border-bottom: 1px solid rgba(5, 0, 2, 0.08);
      }

      .closing-header-inner {
        width: min(1160px, calc(100% - 40px));
        height: 100%;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        padding: 9px 14px;
        border-radius: 999px;
        background: #050002;
        color: #ffffff;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.12em;
      }

      .status-pill.completed {
        background: #c37986;
      }

      .closing-hero {
        width: min(1160px, calc(100% - 40px));
        margin: 0 auto;
        padding: 72px 0 52px;
      }

      .eyebrow,
      .card-kicker {
        display: inline-block;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.14em;
        color: #c37986;
      }

      .closing-hero h1 {
        max-width: 900px;
        margin: 14px 0 20px;
        font-size: clamp(48px, 7vw, 88px);
        line-height: 0.94;
        letter-spacing: -0.055em;
        font-weight: 800;
      }

      .closing-hero h1 em {
        font-family: Georgia, "Times New Roman", serif;
        font-weight: 500;
        color: #c37986;
      }

      .closing-hero p {
        max-width: 650px;
        margin: 0;
        font-size: 18px;
        line-height: 1.55;
        color: #625b5e;
      }

      .closing-layout {
        width: min(1160px, calc(100% - 40px));
        margin: 0 auto;
        padding: 0 0 90px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
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
        border: 1px solid rgba(5, 0, 2, 0.08);
        border-radius: 24px;
        box-shadow: 0 20px 60px rgba(30, 15, 20, 0.05);
      }

      .verlo-card {
        padding: 32px;
      }

      .success-card {
        background: linear-gradient(
          135deg,
          #050002 0%,
          #241318 100%
        );
        color: white;
      }

      .success-card .card-kicker {
        color: #f2a8a9;
      }

      .success-card p {
        color: rgba(255, 255, 255, 0.72);
      }

      .final-card {
        background: #c37986;
        color: white;
      }

      .final-card .card-kicker {
        color: rgba(255, 255, 255, 0.78);
      }

      .final-card p {
        color: rgba(255, 255, 255, 0.84);
      }

      .verlo-card h2 {
        margin: 8px 0 10px;
        font-size: clamp(26px, 3vw, 38px);
        line-height: 1.05;
        letter-spacing: -0.04em;
      }

      .verlo-card p {
        margin: 0;
        max-width: 690px;
        color: #6e6669;
        line-height: 1.6;
      }

      .section-heading,
      .contract-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
      }

      .person-title {
        margin-top: 12px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
      }

      .person-title h2 {
        margin-bottom: 5px;
      }

      .person-title span {
        color: #8a8184;
        font-size: 14px;
      }

      .verified {
        padding: 8px 11px;
        border-radius: 999px;
        background: #fffaf8;
        color: #c37986;
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
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .info-grid.two {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .info-item {
        min-width: 0;
        padding: 16px;
        border-radius: 16px;
        background: #faf8f5;
        border: 1px solid #eee7e2;
      }

      .info-item span {
        display: block;
        margin-bottom: 7px;
        color: #9c9194;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .info-item strong {
        display: block;
        overflow-wrap: anywhere;
        color: #050002;
        font-size: 14px;
        line-height: 1.4;
      }

      .legal-status-grid {
        margin-top: 24px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .legal-status {
        padding: 13px 14px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        background: #fff7f8;
        border: 1px solid #efdadf;
        color: #786d71;
        font-size: 12px;
        font-weight: 800;
      }

      .legal-status.done {
        background: #f8f6f1;
        border-color: #e5ded9;
        color: #30292c;
      }

      .legal-status-icon {
        width: 24px;
        height: 24px;
        flex: 0 0 24px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #c37986;
        color: white;
        font-size: 11px;
        font-weight: 900;
      }

      .legal-form-wrap,
      .contract-form {
        margin-top: 30px;
        padding-top: 30px;
        border-top: 1px solid #eee7e2;
        scroll-margin-top: 100px;
      }

      .primary-button,
      .secondary-button,
      .agree-button,
      .floating-edit-button {
        min-height: 48px;
        border-radius: 14px;
        padding: 0 20px;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.055em;
        cursor: pointer;
        transition:
          transform 160ms ease,
          opacity 160ms ease,
          box-shadow 160ms ease;
      }

      .primary-button {
        border: 0;
        background: #c37986;
        color: #ffffff;
      }

      .secondary-button {
        border: 1px solid rgba(5, 0, 2, 0.14);
        background: white;
        color: #050002;
      }

      .primary-button:hover,
      .secondary-button:hover,
      .agree-button:hover,
      .floating-edit-button:hover {
        transform: translateY(-1px);
      }

      button:disabled {
        cursor: not-allowed;
      }

      .primary-button:disabled,
      .agree-button:disabled {
        opacity: 0.6;
      }

      .edit-alert,
      .blocking-alert,
      .reference-box {
        margin-bottom: 28px;
        padding: 17px 18px;
        border-radius: 16px;
      }

      .edit-alert {
        background: #f2ebec;
        border: 1px solid rgba(195, 121, 134, 0.3);
      }

      .blocking-alert {
        background: #fff3dd;
        border: 1px solid #efd49e;
      }

      .reference-box {
        background: #faf8f5;
        border: 1px solid #e6ded9;
      }

      .edit-alert strong,
      .edit-alert span,
      .blocking-alert strong,
      .blocking-alert span,
      .reference-box > span,
      .reference-box > strong,
      .reference-box > small {
        display: block;
      }

      .edit-alert strong,
      .blocking-alert strong {
        color: #050002;
        font-size: 14px;
      }

      .edit-alert span,
      .blocking-alert span {
        margin-top: 5px;
        color: #625b5e;
        font-size: 13px;
        line-height: 1.5;
      }

      .reference-box > span {
        color: #9c9194;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.12em;
      }

      .reference-box > strong {
        margin-top: 7px;
        font-size: 16px;
      }

      .reference-box > small {
        margin-top: 4px;
        color: #70666a;
      }

      .reference-box p {
        margin-top: 10px;
        font-size: 12px;
      }

      .form-section + .form-section {
        margin-top: 32px;
      }

      .form-section h3 {
        margin: 0 0 7px;
        font-size: 18px;
        letter-spacing: -0.02em;
      }

      .section-help {
        margin-bottom: 16px !important;
        color: #8a8184 !important;
        font-size: 12px;
        line-height: 1.5;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .field {
        display: block;
      }

      .field + .field {
        margin-top: 14px;
      }

      .form-grid .field + .field {
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
      .field textarea,
      .field select {
        width: 100%;
        border: 1px solid #e4d9dc;
        border-radius: 14px;
        background: #fffdfb;
        color: #050002;
        padding: 14px 15px;
        font: inherit;
        outline: none;
        transition:
          border-color 150ms ease,
          box-shadow 150ms ease;
      }

      .field select {
        min-height: 49px;
      }

      .field textarea {
        min-height: 108px;
        resize: vertical;
        line-height: 1.5;
      }

      .field input:focus,
      .field textarea:focus,
      .field select:focus {
        border-color: #c37986;
        box-shadow: 0 0 0 4px rgba(195, 121, 134, 0.16);
      }

      .money-help {
        margin-top: 10px !important;
        max-width: none !important;
        color: #8a8184 !important;
        font-size: 12px;
        line-height: 1.5;
      }

      .review-before-generate {
        margin-top: 30px;
        padding: 24px;
        border-radius: 20px;
        background: #050002;
        color: white;
      }

      .review-before-generate .card-kicker {
        color: #f2a8a9;
      }

      .review-before-generate h3 {
        margin: 8px 0 20px;
        max-width: 520px;
        font-size: 22px;
        line-height: 1.15;
        letter-spacing: -0.035em;
      }

      .review-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .review-grid > div,
      .review-adjustment {
        padding: 15px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.08);
      }

      .review-grid span,
      .review-adjustment span {
        display: block;
        margin-bottom: 6px;
        color: rgba(255, 255, 255, 0.58);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.12em;
      }

      .review-grid strong,
      .review-adjustment strong {
        display: block;
        font-size: 17px;
        line-height: 1.35;
      }

      .review-adjustment {
        margin-top: 10px;
      }

      .form-actions {
        margin-top: 24px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .form-error,
      .success-message {
        margin-top: 20px;
        padding: 14px 16px;
        border-radius: 14px;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.5;
      }

      .form-error {
        background: #fff0f3;
        color: #a51d47;
      }

      .success-message {
        background: #fffaf8;
        color: #c37986;
        border: 1px solid rgba(195, 121, 134, 0.28);
      }

      .document-actions {
        margin-top: 30px;
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 10px;
      }

      .edit-document-button {
        border-color: #c37986;
        color: #c37986;
      }

      .print-button {
        background: #050002;
        color: white;
        border-color: #050002;
      }

      .contract-summary {
        margin-bottom: 18px;
      }

      .document-shell {
        margin-top: 18px;
        padding: 24px;
        overflow-x: auto;
        border-radius: 20px;
        background: #e9e4df;
      }

      .contract-document {
        width: min(794px, 100%);
        min-height: 1123px;
        margin: 0 auto;
        padding: 66px 70px 56px;
        background: white;
        color: #191517;
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.08);
      }

      .document-brand {
        display: flex;
        justify-content: center;
        margin-bottom: 34px;
      }

      .document-title {
        text-align: center;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 19px;
        font-weight: 700;
        letter-spacing: 0.08em;
      }

      .document-rule {
        width: 56px;
        height: 2px;
        margin: 18px auto 34px;
        background: #c37986;
      }

      .contract-copy {
        white-space: pre-wrap;
        text-align: justify;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 14.5px;
        line-height: 1.82;
        color: #211d1f;
      }

      .document-footer {
        margin-top: 60px;
        padding-top: 18px;
        border-top: 1px solid #ddd5d7;
        text-align: center;
        font-size: 10px;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: #9a9194;
      }

      .agreement-panel {
        margin-top: 24px;
        padding: 24px;
        border-radius: 20px;
        background: linear-gradient(
          135deg,
          #fffaf8,
          #f2ebec
        );
        border: 1px solid rgba(195, 121, 134, 0.28);
      }

      .agreement-copy h3 {
        margin: 8px 0 8px;
        font-size: 24px;
        line-height: 1.08;
        letter-spacing: -0.035em;
      }

      .agreement-copy p {
        max-width: 680px;
        font-size: 14px;
      }

      .agree-button {
        width: 100%;
        margin-top: 20px;
        border: 0;
        background: #c37986;
        color: white;
        box-shadow: 0 10px 30px rgba(195, 121, 134, 0.22);
      }

      .agree-button.agreed {
        background: #050002;
        box-shadow: none;
      }

      .agreement-complete {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .agreement-icon {
        width: 48px;
        height: 48px;
        flex: 0 0 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #c37986;
        color: white;
        font-size: 22px;
        font-weight: 900;
      }

      .agreement-complete strong {
        display: block;
        font-size: 18px;
      }

      .agreement-complete p {
        margin-top: 4px;
        font-size: 13px;
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
        justify-content: center;
        border-radius: 999px;
        background: #eee9e6;
        color: #9b9395;
        font-size: 12px;
        font-weight: 900;
      }

      .step-dot.done {
        background: #c37986;
        color: white;
      }

      .step span {
        font-size: 13px;
        font-weight: 700;
        color: #4d4548;
      }

      .waiting-box,
      .complete-box {
        margin-top: 24px;
        padding: 16px;
        border-radius: 16px;
      }

      .waiting-box {
        background: #faf8f5;
        border: 1px solid #e9e0dc;
      }

      .complete-box {
        background: #fffaf8;
        border: 1px solid rgba(195, 121, 134, 0.28);
      }

      .waiting-box strong,
      .waiting-box span,
      .complete-box strong,
      .complete-box span {
        display: block;
      }

      .waiting-box strong {
        color: #30292c;
        font-size: 14px;
      }

      .waiting-box span {
        margin-top: 5px;
        color: #7c7275;
        font-size: 12px;
        line-height: 1.45;
      }

      .complete-box strong {
        color: #c37986;
        font-size: 14px;
      }

      .complete-box span {
        margin-top: 5px;
        color: #625b5e;
        font-size: 12px;
        line-height: 1.45;
      }

      .sidebar-note {
        margin: 24px 0 0;
        padding-top: 20px;
        border-top: 1px solid #eee7e2;
        font-size: 11px;
        line-height: 1.5;
        color: #9c9295;
      }

      .floating-edit-button {
        position: fixed;
        right: 26px;
        bottom: 26px;
        z-index: 100;
        border: 0;
        background: #c37986;
        color: white;
        box-shadow: 0 15px 38px rgba(5, 0, 2, 0.18);
      }

      .closing-centered {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 30px;
        background: #f8f6f1;
      }

      .closing-centered h1 {
        max-width: 580px;
        margin: 35px 0 12px;
        font-size: clamp(38px, 7vw, 64px);
        line-height: 0.98;
        letter-spacing: -0.05em;
      }

      .closing-centered p {
        max-width: 520px;
        color: #756c6f;
        line-height: 1.6;
      }

      @media (max-width: 900px) {
        .closing-layout {
          grid-template-columns: 1fr;
        }

        .closing-sidebar {
          position: static;
        }

        .info-grid,
        .contract-summary {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        .closing-header-inner,
        .closing-hero,
        .closing-layout {
          width: min(100% - 28px, 1160px);
        }

        .closing-hero {
          padding: 48px 0 34px;
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
        .section-heading,
        .contract-heading {
          flex-direction: column;
        }

        .info-grid,
        .info-grid.two,
        .contract-summary,
        .form-grid,
        .review-grid,
        .legal-status-grid {
          grid-template-columns: 1fr;
        }

        .primary-button,
        .secondary-button {
          width: 100%;
        }

        .document-actions {
          flex-direction: column;
        }

        .form-actions {
          flex-direction: column-reverse;
        }

        .document-shell {
          padding: 10px;
          margin-left: -6px;
          margin-right: -6px;
        }

        .contract-document {
          min-height: 0;
          padding: 40px 26px;
        }

        .contract-copy {
          font-size: 13px;
          line-height: 1.7;
        }

        .agreement-complete {
          align-items: flex-start;
        }

        .floating-edit-button {
          right: 14px;
          bottom: 14px;
          left: 14px;
          width: calc(100% - 28px);
        }
      }

      @page {
        size: A4;
        margin: 18mm;
      }

      @media print {
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }

        body * {
          visibility: hidden !important;
        }

        .print-area,
        .print-area * {
          visibility: visible !important;
        }

        .print-area {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          overflow: visible !important;
          border-radius: 0 !important;
        }

        .contract-document {
          width: 100% !important;
          min-height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
        }

        .document-brand {
          margin-bottom: 24px !important;
        }

        .contract-copy {
          font-size: 11pt !important;
          line-height: 1.65 !important;
          color: black !important;
        }

        .document-footer {
          color: #666 !important;
        }

        .no-print {
          display: none !important;
        }
      }
    `}</style>
  )
}
