import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  createClient,
} from "@supabase/supabase-js"

export const runtime =
  "nodejs"

export const dynamic =
  "force-dynamic"

// ============================================================
// HELPERS GENERALES
// ============================================================

function clean(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim()
}

function nullableString(
  value: unknown
) {
  const result =
    clean(value)

  return result ||
    null
}

function isObject(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return Boolean(
    value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
  )
}

function formatDateAR(
  value: string
) {
  if (!value) {
    return ""
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

function parseDateOnly(
  value: string
) {
  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number)

  if (
    !year ||
    !month ||
    !day
  ) {
    return null
  }

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    )

  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {
    return null
  }

  return date
}

function formatMoney(
  value: number
) {
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
  ).format(value)
}

function upper(
  value: string
) {
  return value
    .toLocaleUpperCase(
      "es-AR"
    )
}

function sentence(
  value: string
) {
  const result =
    clean(value)

  if (!result) {
    return ""
  }

  return /[.!?]$/.test(
    result
  )
    ? result
    : `${result}.`
}

function joinAddressParts(
  values: Array<
    string | null
  >
) {
  return values
    .filter(
      (
        value
      ): value is string =>
        Boolean(
          clean(value)
        )
    )
    .join(", ")
}

// ============================================================
// NÚMEROS A LETRAS — PESOS ARGENTINOS
// ============================================================

const UNITS = [
  "",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
]

const TEN_TO_NINETEEN =
  [
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciséis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
  ]

const TENS = [
  "",
  "",
  "veinte",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa",
]

const HUNDREDS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
]

function underHundred(
  number: number
): string {
  if (
    number < 10
  ) {
    return UNITS[
      number
    ]
  }

  if (
    number < 20
  ) {
    return TEN_TO_NINETEEN[
      number - 10
    ]
  }

  if (
    number < 30
  ) {
    if (
      number === 20
    ) {
      return "veinte"
    }

    const unit =
      number - 20

    const special:
      Record<
        number,
        string
      > = {
      1: "veintiuno",
      2: "veintidós",
      3: "veintitrés",
      4: "veinticuatro",
      5: "veinticinco",
      6: "veintiséis",
      7: "veintisiete",
      8: "veintiocho",
      9: "veintinueve",
    }

    return special[
      unit
    ]
  }

  const tens =
    Math.floor(
      number / 10
    )

  const unit =
    number % 10

  if (!unit) {
    return TENS[
      tens
    ]
  }

  return `${TENS[tens]} y ${UNITS[unit]}`
}

function underThousand(
  number: number
): string {
  if (
    number < 100
  ) {
    return underHundred(
      number
    )
  }

  if (
    number === 100
  ) {
    return "cien"
  }

  const hundreds =
    Math.floor(
      number / 100
    )

  const rest =
    number % 100

  return [
    HUNDREDS[
      hundreds
    ],

    rest
      ? underHundred(
          rest
        )
      : "",
  ]
    .filter(Boolean)
    .join(" ")
}

function numberToSpanish(
  input: number
): string {
  const number =
    Math.trunc(input)

  if (
    number === 0
  ) {
    return "cero"
  }

  if (
    number < 0
  ) {
    return `menos ${numberToSpanish(
      Math.abs(number)
    )}`
  }

  if (
    number <
    1000
  ) {
    return underThousand(
      number
    )
  }

  if (
    number <
    1_000_000
  ) {
    const thousands =
      Math.floor(
        number / 1000
      )

    const rest =
      number % 1000

    const prefix =
      thousands === 1
        ? "mil"
        : `${numberToSpanish(
            thousands
          )} mil`

    return [
      prefix,

      rest
        ? numberToSpanish(
            rest
          )
        : "",
    ]
      .filter(Boolean)
      .join(" ")
  }

  if (
    number <
    1_000_000_000
  ) {
    const millions =
      Math.floor(
        number /
          1_000_000
      )

    const rest =
      number %
      1_000_000

    const prefix =
      millions === 1
        ? "un millón"
        : `${numberToSpanish(
            millions
          )} millones`

    return [
      prefix,

      rest
        ? numberToSpanish(
            rest
          )
        : "",
    ]
      .filter(Boolean)
      .join(" ")
  }

  if (
    number <
    1_000_000_000_000
  ) {
    const billions =
      Math.floor(
        number /
          1_000_000_000
      )

    const rest =
      number %
      1_000_000_000

    const prefix =
      billions === 1
        ? "mil millones"
        : `${numberToSpanish(
            billions
          )} mil millones`

    return [
      prefix,

      rest
        ? numberToSpanish(
            rest
          )
        : "",
    ]
      .filter(Boolean)
      .join(" ")
  }

  return String(
    number
  )
}

function pesosInWords(
  value: number
) {
  const integerValue =
    Math.trunc(value)

  const words =
    numberToSpanish(
      integerValue
    )

  return upper(
    `pesos argentinos ${words}`
  )
}

function amountContractText(
  value: number
) {
  return `${pesosInWords(
    value
  )} (${formatMoney(
    value
  )})`
}

// ============================================================
// FECHA DE CELEBRACIÓN EN LETRAS
// ============================================================

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

function todayContractDate() {
  const formatter =
    new Intl.DateTimeFormat(
      "es-AR",
      {
        timeZone:
          "America/Argentina/Buenos_Aires",

        day:
          "numeric",

        month:
          "numeric",

        year:
          "numeric",
      }
    )

  const parts =
    formatter.formatToParts(
      new Date()
    )

  const day =
    Number(
      parts.find(
        part =>
          part.type ===
          "day"
      )?.value
    )

  const month =
    Number(
      parts.find(
        part =>
          part.type ===
          "month"
      )?.value
    )

  const year =
    Number(
      parts.find(
        part =>
          part.type ===
          "year"
      )?.value
    )

  return {
    day,
    month,
    year,
  }
}

// ============================================================
// TEXTOS CONTRACTUALES
// ============================================================

function furnishingText(
  status: string,
  inventory: string | null,
  conditionNotes: string | null
) {
  if (
    status ===
    "unfurnished"
  ) {
    return [
      "Las partes dejan constancia de que el inmueble se entrega SIN AMOBLAR.",

      conditionNotes
        ? sentence(
            conditionNotes
          )
        : "",
    ]
      .filter(Boolean)
      .join(" ")
  }

  if (
    status ===
    "furnished"
  ) {
    return [
      "Las partes dejan constancia de que el inmueble se entrega AMOBLADO.",

      inventory
        ? `Los muebles, artefactos y bienes incluidos son los siguientes: ${sentence(
            inventory
          )}`
        : "",

      conditionNotes
        ? `Estado y observaciones: ${sentence(
            conditionNotes
          )}`
        : "",

      "El inventario indicado forma parte integrante de las condiciones de entrega y deberá ser considerado al momento de la restitución del inmueble.",
    ]
      .filter(Boolean)
      .join(" ")
  }

  if (
    status ===
    "partially_furnished"
  ) {
    return [
      "Las partes dejan constancia de que el inmueble se entrega PARCIALMENTE AMOBLADO.",

      inventory
        ? `Los muebles, artefactos y bienes incluidos son los siguientes: ${sentence(
            inventory
          )}`
        : "",

      conditionNotes
        ? `Estado y observaciones: ${sentence(
            conditionNotes
          )}`
        : "",

      "El inventario indicado forma parte integrante de las condiciones de entrega y deberá ser considerado al momento de la restitución del inmueble.",
    ]
      .filter(Boolean)
      .join(" ")
  }

  return ""
}

function ownerCharacterText(
  actingAs: string,
  powerDetails: string | null
) {
  if (
    actingAs ===
    "usufructuary"
  ) {
    return "en su carácter de usufructuario/a"
  }

  if (
    actingAs ===
    "attorney"
  ) {
    return powerDetails
      ? `en carácter de apoderado/a, conforme ${powerDetails}`
      : "en carácter de apoderado/a"
  }

  if (
    actingAs ===
    "representative"
  ) {
    return powerDetails
      ? `en carácter de representante, conforme ${powerDetails}`
      : "en carácter de representante"
  }

  return "en su carácter de propietario/a"
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing configuration",
        },
        {
          status: 500,
        }
      )
    }

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      )

    const body =
      await request
        .json()
        .catch(
          () => ({})
        )

    const token =
      clean(
        body?.token
      )

    const monthlyPrice =
      Number(
        body
          ?.monthly_price
      )

    const deposit =
      Number(
        body
          ?.deposit
      )

    const startDate =
      clean(
        body
          ?.start_date
      )

    const endDate =
      clean(
        body
          ?.end_date
      )

    const adjustmentMethod =
      clean(
        body
          ?.adjustment_method
      )

    const expenses =
      clean(
        body
          ?.expenses
      )

    const services =
      clean(
        body
          ?.services
      )

    const specialConditions =
      clean(
        body
          ?.special_conditions
      )

    const paymentMethod =
      clean(
        body
          ?.payment_method
      )

    const paymentDetails =
      clean(
        body
          ?.payment_details
      )

    const guaranteeType =
      clean(
        body
          ?.guarantee_type
      )

    const guaranteeDetails =
      clean(
        body
          ?.guarantee_details
      )

    const petsPolicy =
      clean(
        body
          ?.pets_policy
      )

    const insuranceTerms =
      clean(
        body
          ?.insurance_terms
      )

    // =========================================================
    // 1. VALIDACIÓN BÁSICA
    // =========================================================

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing token",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !Number.isFinite(
        monthlyPrice
      ) ||
      monthlyPrice <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Revisá el valor del alquiler mensual.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !Number.isFinite(
        deposit
      ) ||
      deposit < 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Revisá el valor del depósito.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !startDate ||
      !endDate
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Faltan las fechas del contrato.",
        },
        {
          status: 400,
        }
      )
    }

    const parsedStartDate =
      parseDateOnly(
        startDate
      )

    const parsedEndDate =
      parseDateOnly(
        endDate
      )

    if (
      !parsedStartDate ||
      !parsedEndDate
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Las fechas del contrato no son válidas.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      parsedEndDate.getTime() <=
      parsedStartDate.getTime()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "La fecha de finalización debe ser posterior a la fecha de inicio.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !adjustmentMethod
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta definir el mecanismo de actualización.",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 2. VALIDAR TOKEN DE CIERRE
    // =========================================================

    const {
      data:
        accessToken,
      error:
        tokenError,
    } =
      await supabase
        .from(
          "lead_contract_access_tokens"
        )
        .select(`
          id,
          contract_id,
          lead_id,
          role,
          revoked_at,
          expires_at
        `)
        .eq(
          "token",
          token
        )
        .single()

    if (
      tokenError ||
      !accessToken
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid token",
        },
        {
          status: 404,
        }
      )
    }

    if (
      accessToken
        .revoked_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Token revoked",
        },
        {
          status: 403,
        }
      )
    }

    if (
      accessToken
        .expires_at &&
      new Date(
        accessToken
          .expires_at
      ).getTime() <
        Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Expired token",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 3. SOLO EL OWNER PUEDE GENERAR / REGENERAR
    // =========================================================

    if (
      accessToken.role !==
      "owner"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Solo el propietario puede generar o modificar las condiciones del contrato.",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 4. TRAER CONTRATO
    // =========================================================

    const {
      data:
        contract,
      error:
        contractError,
    } =
      await supabase
        .from(
          "lead_contracts"
        )
        .select(`
          id,
          lead_match_id,
          tenant_lead_id,
          owner_lead_id,
          status,
          monthly_price,
          deposit,
          start_date,
          end_date,
          adjustment_method,
          terms_json,
          content,
          tenant_agreed_at,
          owner_agreed_at
        `)
        .eq(
          "id",
          accessToken
            .contract_id
        )
        .single()

    if (
      contractError ||
      !contract
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Contract not found",
        },
        {
          status: 404,
        }
      )
    }

    if (
      accessToken
        .lead_id !==
      contract
        .owner_lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Este enlace no corresponde al propietario de este contrato.",
        },
        {
          status: 403,
        }
      )
    }

    if (
      contract.status ===
      "agreed"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El contrato ya fue aceptado por ambas partes y no puede modificarse.",
        },
        {
          status: 409,
        }
      )
    }

    const currentTerms:
      Record<
        string,
        unknown
      > =
      isObject(
        contract
          .terms_json
      )
        ? {
            ...contract
              .terms_json,
          }
        : {}

    // =========================================================
    // 5. MATCH DEBE SEGUIR EN DOBLE OK
    // =========================================================

    const {
      data:
        match,
      error:
        matchError,
    } =
      await supabase
        .from(
          "lead_matches"
        )
        .select(`
          id,
          tenant_lead_id,
          owner_lead_id,
          status,
          ready_to_connect_at
        `)
        .eq(
          "id",
          contract
            .lead_match_id
        )
        .single()

    if (
      matchError ||
      !match
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Match not found",
        },
        {
          status: 404,
        }
      )
    }

    if (
      !match
        .ready_to_connect_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El match todavía no está habilitado para cierre.",
        },
        {
          status: 409,
        }
      )
    }

    if (
      match
        .tenant_lead_id !==
        contract
          .tenant_lead_id ||
      match
        .owner_lead_id !==
        contract
          .owner_lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Las partes del contrato no coinciden con el match.",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 6. TRAER OWNER + TENANT
    // =========================================================

    const {
      data:
        people,
      error:
        peopleError,
    } =
      await supabase
        .from(
          "lead_intake"
        )
        .select(`
          id,
          full_name,
          email,
          phone,
          phone_normalized,
          property_type,
          property_rooms
        `)
        .in(
          "id",
          [
            contract
              .tenant_lead_id,

            contract
              .owner_lead_id,
          ]
        )

    if (
      peopleError
    ) {
      throw new Error(
        peopleError
          .message
      )
    }

    const tenant =
      (
        people ||
        []
      ).find(
        person =>
          person.id ===
          contract
            .tenant_lead_id
      )

    const owner =
      (
        people ||
        []
      ).find(
        person =>
          person.id ===
          contract
            .owner_lead_id
      )

    if (
      !tenant ||
      !owner
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Tenant or owner not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 7. DATOS LEGALES DEL TENANT
    // =========================================================

    let tenantDni =
      nullableString(
        currentTerms
          .tenant_dni
      )

    if (!tenantDni) {
      const {
        data:
          tenantVerification,
        error:
          tenantVerificationError,
      } =
        await supabase
          .from(
            "tenant_verifications"
          )
          .select(`
            document_number
          `)
          .eq(
            "lead_id",
            contract
              .tenant_lead_id
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(1)
          .maybeSingle()

      if (
        tenantVerificationError
      ) {
        console.error(
          "closing generate tenant verification error:",
          tenantVerificationError
        )
      }

      tenantDni =
        nullableString(
          tenantVerification
            ?.document_number
        )
    }

    const tenantCivilStatus =
      nullableString(
        currentTerms
          .tenant_civil_status
      )

    const tenantLegalAddress =
      nullableString(
        currentTerms
          .tenant_legal_address
      )

    const tenantCity =
      nullableString(
        currentTerms
          .tenant_city
      )

    const tenantProvince =
      nullableString(
        currentTerms
          .tenant_province
      )

    const tenantCountry =
      nullableString(
        currentTerms
          .tenant_country
      )

    const tenantPostalCode =
      nullableString(
        currentTerms
          .tenant_postal_code
      )

    if (
      !tenantDni
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El inquilino todavía debe completar o confirmar su DNI.",
        },
        {
          status: 409,
        }
      )
    }

    if (
      !tenantCivilStatus ||
      !tenantLegalAddress ||
      !tenantCity ||
      !tenantProvince ||
      !tenantCountry
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El inquilino todavía debe completar sus datos legales antes de generar el contrato.",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 8. DATOS LEGALES DEL OWNER
    // =========================================================

    const ownerDni =
      nullableString(
        currentTerms
          .owner_dni
      )

    const ownerTaxId =
      nullableString(
        currentTerms
          .owner_tax_id
      )

    const ownerCivilStatus =
      nullableString(
        currentTerms
          .owner_civil_status
      )

    const ownerLegalAddress =
      nullableString(
        currentTerms
          .owner_legal_address
      )

    const ownerCity =
      nullableString(
        currentTerms
          .owner_city
      )

    const ownerProvince =
      nullableString(
        currentTerms
          .owner_province
      )

    const ownerCountry =
      nullableString(
        currentTerms
          .owner_country
      )

    const ownerPostalCode =
      nullableString(
        currentTerms
          .owner_postal_code
      )

    const ownerActingAs =
      nullableString(
        currentTerms
          .owner_acting_as
      ) ||
      "owner"

    const ownerPowerDetails =
      nullableString(
        currentTerms
          .owner_power_details
      )

    if (
      !ownerDni &&
      !ownerTaxId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta el DNI o CUIT del propietario.",
        },
        {
          status: 409,
        }
      )
    }

    if (
      !ownerCivilStatus ||
      !ownerLegalAddress ||
      !ownerCity ||
      !ownerProvince ||
      !ownerCountry
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El propietario debe completar sus datos legales antes de generar el contrato.",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 9. DOMICILIO CONTRACTUAL EXACTO DEL INMUEBLE
    // =========================================================

    const propertyStreet =
      nullableString(
        currentTerms
          .property_street
      )

    const propertyNumber =
      nullableString(
        currentTerms
          .property_number
      )

    const propertyFloor =
      nullableString(
        currentTerms
          .property_floor
      )

    const propertyUnit =
      nullableString(
        currentTerms
          .property_unit
      )

    const propertyCity =
      nullableString(
        currentTerms
          .property_city
      )

    const propertyProvince =
      nullableString(
        currentTerms
          .property_province
      )

    const propertyCountry =
      nullableString(
        currentTerms
          .property_country
      )

    const propertyPostalCode =
      nullableString(
        currentTerms
          .property_postal_code
      )

    if (
      !propertyStreet ||
      !propertyNumber ||
      !propertyCity ||
      !propertyProvince ||
      !propertyCountry
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta completar la dirección contractual exacta del inmueble.",
        },
        {
          status: 409,
        }
      )
    }

    const propertyAddress =
      joinAddressParts(
        [
          `${propertyStreet} Nº ${propertyNumber}`,

          propertyFloor
            ? `Piso ${propertyFloor}`
            : null,

          propertyUnit
            ? `Unidad/Departamento ${propertyUnit}`
            : null,

          propertyCity,

          propertyProvince,

          propertyCountry,

          propertyPostalCode
            ? `CP ${propertyPostalCode}`
            : null,
        ]
      )

    // =========================================================
    // 10. LUGAR DE CELEBRACIÓN
    // =========================================================

    const signingCity =
      nullableString(
        currentTerms
          .signing_city
      )

    const signingProvince =
      nullableString(
        currentTerms
          .signing_province
      )

    const signingCountry =
      nullableString(
        currentTerms
          .signing_country
      )

    if (
      !signingCity ||
      !signingProvince ||
      !signingCountry
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta completar el lugar de celebración del contrato.",
        },
        {
          status: 409,
        }
      )
    }

    const signingLocation =
      joinAddressParts(
        [
          signingCity,
          signingProvince,
          signingCountry,
        ]
      )

    // =========================================================
    // 11. AMOBLAMIENTO FINAL
    // =========================================================

    const furnishingStatus =
      nullableString(
        currentTerms
          .furnishing_status
      )

    const furnishingInventory =
      nullableString(
        currentTerms
          .furnishing_inventory
      )

    const furnishingConditionNotes =
      nullableString(
        currentTerms
          .furnishing_condition_notes
      )

    if (
      furnishingStatus !==
        "furnished" &&
      furnishingStatus !==
        "unfurnished" &&
      furnishingStatus !==
        "partially_furnished"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta confirmar cómo se entrega el inmueble: amoblado, sin amoblar o parcialmente amoblado.",
        },
        {
          status: 409,
        }
      )
    }

    if (
      (
        furnishingStatus ===
          "furnished" ||
        furnishingStatus ===
          "partially_furnished"
      ) &&
      !furnishingInventory
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta completar el inventario de muebles y bienes incluidos.",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 12. CONDICIONES ADICIONALES
    //
    // La UI nueva va a mandar estos campos.
    // Mientras tanto conservamos lo que ya exista.
    // =========================================================

    const finalExpenses =
      expenses ||
      nullableString(
        currentTerms
          .expenses
      ) ||
      ""

    const finalServices =
      services ||
      nullableString(
        currentTerms
          .services
      ) ||
      ""

    const finalSpecialConditions =
      specialConditions ||
      nullableString(
        currentTerms
          .special_conditions
      ) ||
      ""

    const finalPaymentMethod =
      paymentMethod ||
      nullableString(
        currentTerms
          .payment_method
      ) ||
      ""

    const finalPaymentDetails =
      paymentDetails ||
      nullableString(
        currentTerms
          .payment_details
      ) ||
      ""

    const finalGuaranteeType =
      guaranteeType ||
      nullableString(
        currentTerms
          .guarantee_type
      ) ||
      ""

    const finalGuaranteeDetails =
      guaranteeDetails ||
      nullableString(
        currentTerms
          .guarantee_details
      ) ||
      ""

    const finalPetsPolicy =
      petsPolicy ||
      nullableString(
        currentTerms
          .pets_policy
      ) ||
      ""

    const finalInsuranceTerms =
      insuranceTerms ||
      nullableString(
        currentTerms
          .insurance_terms
      ) ||
      ""

    // =========================================================
    // 13. IDENTIFICACIÓN COMPLETA DE PARTES
    // =========================================================

    const ownerDocumentText =
      ownerDni
        ? `DNI ${ownerDni}`
        : `CUIT ${ownerTaxId}`

    const tenantDocumentText =
      `DNI ${tenantDni}`

    const ownerLegalFullAddress =
      joinAddressParts(
        [
          ownerLegalAddress,
          ownerCity,
          ownerProvince,
          ownerCountry,
          ownerPostalCode
            ? `CP ${ownerPostalCode}`
            : null,
        ]
      )

    const tenantLegalFullAddress =
      joinAddressParts(
        [
          tenantLegalAddress,
          tenantCity,
          tenantProvince,
          tenantCountry,
          tenantPostalCode
            ? `CP ${tenantPostalCode}`
            : null,
        ]
      )

    const ownerPhone =
      clean(
        owner
          .phone_normalized ||
        owner
          .phone
      )

    const tenantPhone =
      clean(
        tenant
          .phone_normalized ||
        tenant
          .phone
      )

    const ownerEmail =
      clean(
        owner.email
      )

    const tenantEmail =
      clean(
        tenant.email
      )

    const ownerCharacter =
      ownerCharacterText(
        ownerActingAs,
        ownerPowerDetails
      )

    // =========================================================
    // 14. FECHA ACTUAL DE CELEBRACIÓN
    // =========================================================

    const today =
      todayContractDate()

    const currentMonthName =
      MONTHS[
        today.month - 1
      ] ||
      ""

    // =========================================================
    // 15. TEXTOS VARIABLES DE CLÁUSULAS
    // =========================================================

    const furnishingClause =
      furnishingText(
        furnishingStatus,
        furnishingInventory,
        furnishingConditionNotes
      )

    const paymentClause =
      [
        "El canon locativo será abonado por mes adelantado, dentro del período y conforme la modalidad acordada por las partes.",

        finalPaymentMethod
          ? `Modalidad de pago acordada: ${sentence(
              finalPaymentMethod
            )}`
          : "",

        finalPaymentDetails
          ? `Datos e instrucciones de pago: ${sentence(
              finalPaymentDetails
            )}`
          : "",

        "La falta de pago en término producirá la mora conforme las condiciones pactadas y la normativa aplicable.",
      ]
        .filter(Boolean)
        .join(" ")

    const expensesClause =
      finalExpenses
        ? sentence(
            finalExpenses
          )
        : "Las partes deberán cumplir con la distribución de expensas, impuestos, tasas y demás gastos que hayan acordado y con las obligaciones que resulten de la normativa aplicable."

    const servicesClause =
      finalServices
        ? sentence(
            finalServices
          )
        : "Los consumos y servicios derivados del uso del inmueble estarán a cargo de EL LOCATARIO, salvo aquellos que por acuerdo expreso o disposición aplicable correspondan a EL LOCADOR."

    const guaranteeClause =
      finalGuaranteeType ||
      finalGuaranteeDetails
        ? [
            finalGuaranteeType
              ? `La garantía acordada para la presente locación es: ${sentence(
                  finalGuaranteeType
                )}`
              : "",

            finalGuaranteeDetails
              ? `Detalle de la garantía: ${sentence(
                  finalGuaranteeDetails
                )}`
              : "",
          ]
            .filter(Boolean)
            .join(" ")
        : "Las partes dejan constancia de que las condiciones de garantía serán las expresamente acordadas entre ellas y documentadas como parte de la presente relación locativa."

    const petsClause =
      finalPetsPolicy
        ? sentence(
            finalPetsPolicy
          )
        : "La permanencia de animales domésticos en el inmueble se regirá por lo expresamente acordado entre las partes y por las normas de convivencia y reglamentos aplicables al inmueble."

    const insuranceClause =
      finalInsuranceTerms
        ? sentence(
            finalInsuranceTerms
          )
        : "Las partes podrán acordar la contratación de seguros vinculados al uso y conservación del inmueble, conforme las características de la locación y la normativa aplicable."

    const specialConditionsClause =
      finalSpecialConditions
        ? sentence(
            finalSpecialConditions
          )
        : "Las partes no establecen condiciones particulares adicionales distintas de las contenidas en el presente contrato."

    // =========================================================
    // 16. GENERAR CONTRATO
    // =========================================================

    const content = `
CONTRATO DE LOCACIÓN DE VIVIENDA

PRELIMINAR — LUGAR, FECHA Y PARTES

En ${signingLocation}, a los ${today.day} días del mes de ${currentMonthName} de ${today.year}, entre ${owner.full_name}, ${ownerDocumentText}, de estado civil ${ownerCivilStatus}, con domicilio legal en ${ownerLegalFullAddress}, teléfono ${ownerPhone || "no informado"} y domicilio electrónico ${ownerEmail || "no informado"}, ${ownerCharacter}, en adelante “EL LOCADOR”, por una parte; y ${tenant.full_name}, ${tenantDocumentText}, de estado civil ${tenantCivilStatus}, con domicilio legal en ${tenantLegalFullAddress}, teléfono ${tenantPhone || "no informado"} y domicilio electrónico ${tenantEmail || "no informado"}, en adelante “EL LOCATARIO”, por la otra; ambas partes manifiestan contar con capacidad suficiente para contratar y acuerdan celebrar el presente CONTRATO DE LOCACIÓN DE VIVIENDA, sujeto a las siguientes cláusulas y condiciones.

PRIMERA — OBJETO

EL LOCADOR da en locación a EL LOCATARIO, quien acepta en tal carácter, el inmueble ubicado en ${propertyAddress}.

El inmueble será entregado con sus instalaciones, accesorios y demás elementos existentes conforme las condiciones pactadas entre las partes.

${furnishingClause}

EL LOCATARIO declara haber tenido oportunidad de conocer y revisar el inmueble y se obliga a conservarlo y restituirlo conforme lo establecido en el presente contrato, sin perjuicio del desgaste derivado del uso regular y del transcurso del tiempo.

SEGUNDA — DESTINO

EL LOCATARIO destinará el inmueble exclusivamente a vivienda propia y de las personas que integren su grupo conviviente o familiar, salvo autorización expresa y escrita de EL LOCADOR para un destino distinto permitido por la normativa aplicable.

Queda prohibido destinar el inmueble a actividades ilícitas o incompatibles con su carácter habitacional y con las normas de convivencia, reglamentos y disposiciones aplicables.

TERCERA — PLAZO

El plazo de la locación comienza el día ${formatDateAR(
      startDate
    )} y finaliza el día ${formatDateAR(
      endDate
    )}.

Cumplido el plazo pactado, la continuidad, renovación o finalización de la relación locativa se regirá por lo que acuerden las partes y por la normativa vigente aplicable al momento correspondiente.

CUARTA — PRECIO DE LA LOCACIÓN

El precio inicial de la locación se pacta en la suma mensual de ${amountContractText(
      monthlyPrice
    )}.

Las partes reconocen que el importe expresado en letras y su equivalente numérico corresponden al mismo canon locativo mensual.

QUINTA — ACTUALIZACIÓN DEL CANON LOCATIVO

El canon locativo se actualizará de acuerdo con el siguiente mecanismo expresamente acordado entre las partes:

${sentence(
  adjustmentMethod
)}

Las actualizaciones deberán calcularse y aplicarse conforme el mecanismo pactado y la normativa vigente que resulte aplicable.

SEXTA — FORMA Y OPORTUNIDAD DE PAGO

${paymentClause}

EL LOCATARIO deberá conservar los comprobantes de cada pago realizado.

SÉPTIMA — MORA E INCUMPLIMIENTO DE PAGO

La mora en el cumplimiento de las obligaciones dinerarias se producirá conforme las fechas y condiciones pactadas en el presente contrato y la legislación aplicable.

Ante el incumplimiento, la parte cumplidora podrá ejercer los derechos y acciones que le correspondan conforme este contrato y la normativa vigente.

OCTAVA — DEPÓSITO EN GARANTÍA

EL LOCATARIO entrega o se obliga a entregar en concepto de depósito en garantía la suma de ${amountContractText(
      deposit
    )}.

El depósito tendrá por finalidad garantizar el cumplimiento de las obligaciones asumidas por EL LOCATARIO y será restituido al finalizar la relación locativa, previa verificación del estado del inmueble, devolución de las llaves y cancelación de las obligaciones pendientes que correspondan.

La existencia y aplicación del depósito no autoriza por sí sola a imputarlo unilateralmente al pago de alquileres pendientes.

NOVENA — EXPENSAS, IMPUESTOS, TASAS Y GASTOS

${expensesClause}

Las partes se obligan a conservar los comprobantes correspondientes cuando resulte necesario acreditar el cumplimiento de las obligaciones asumidas.

DÉCIMA — SERVICIOS

${servicesClause}

EL LOCATARIO deberá utilizar regularmente las instalaciones y servicios y comunicar a EL LOCADOR cualquier desperfecto relevante que requiera una intervención que pudiera corresponderle.

DÉCIMA PRIMERA — ESTADO, CONSERVACIÓN Y REPARACIONES

EL LOCATARIO se obliga a conservar el inmueble con diligencia, mantener condiciones normales de limpieza y uso y responder por los deterioros que sean consecuencia de un uso indebido, negligente o imputable a sí mismo o a las personas por quienes deba responder.

No serán imputables a EL LOCATARIO los deterioros derivados del mero transcurso del tiempo, el desgaste normal por uso regular ni aquellas reparaciones que correspondan legal o contractualmente a EL LOCADOR.

EL LOCATARIO deberá informar a EL LOCADOR, dentro de un plazo razonable, cualquier desperfecto relevante cuya reparación sea necesaria para evitar mayores daños.

DÉCIMA SEGUNDA — MODIFICACIONES Y MEJORAS

EL LOCATARIO no podrá realizar modificaciones sustanciales, alteraciones estructurales o mejoras que afecten de manera relevante el inmueble sin autorización previa de EL LOCADOR cuando ésta resulte necesaria.

Las mejoras, reparaciones y modificaciones se regirán por lo acordado entre las partes y por la normativa aplicable.

DÉCIMA TERCERA — CESIÓN, SUBLOCACIÓN Y OCUPACIÓN POR TERCEROS

EL LOCATARIO no podrá ceder su posición contractual ni sublocar total o parcialmente el inmueble sin consentimiento de EL LOCADOR cuando dicho consentimiento resulte exigible conforme lo pactado y la legislación aplicable.

La ocupación del inmueble deberá respetar el destino habitacional convenido y las normas de convivencia correspondientes.

DÉCIMA CUARTA — GARANTÍA

${guaranteeClause}

Toda documentación relativa a garantías, cauciones, fiadores o instrumentos equivalentes que las partes incorporen al cierre podrá considerarse complementaria al presente contrato en los términos que expresamente acuerden.

DÉCIMA QUINTA — AMOBLAMIENTO, INVENTARIO Y BIENES INCLUIDOS

${furnishingClause}

En caso de existir inventario, las partes reconocen que éste describe los bienes que permanecen en el inmueble durante la locación y que deberán ser restituidos considerando su estado inicial y el desgaste propio del uso normal.

DÉCIMA SEXTA — MASCOTAS Y CONVIVENCIA

${petsClause}

En todos los casos EL LOCATARIO deberá respetar las normas de convivencia, reglamentos de copropiedad o internos que correspondan y evitar conductas que ocasionen daños, molestias indebidas o riesgos para terceros.

DÉCIMA SÉPTIMA — ACCESO AL INMUEBLE

EL LOCATARIO permitirá el acceso de EL LOCADOR o de las personas que éste autorice cuando resulte razonablemente necesario para inspecciones vinculadas con la conservación del inmueble, reparaciones, mantenimiento u otras causas justificadas.

Salvo situaciones urgentes, dicho acceso deberá coordinarse previamente, procurando respetar la privacidad de EL LOCATARIO y realizarse en días y horarios razonables.

DÉCIMA OCTAVA — SEGUROS

${insuranceClause}

La existencia de seguros no libera a las partes de las responsabilidades que legal o contractualmente les correspondan.

DÉCIMA NOVENA — RESOLUCIÓN ANTICIPADA

La resolución anticipada del contrato podrá producirse en los supuestos, condiciones, plazos y con las consecuencias económicas establecidas por la normativa vigente y por cualquier condición particular válida expresamente pactada entre las partes.

La parte que ejerza dicha facultad deberá efectuar las comunicaciones que correspondan de manera que pueda acreditarse su recepción.

VIGÉSIMA — INCUMPLIMIENTO CONTRACTUAL

El incumplimiento sustancial de cualquiera de las obligaciones asumidas facultará a la parte cumplidora a ejercer los derechos que correspondan, incluyendo exigir el cumplimiento, reclamar los daños que procedan o resolver el contrato cuando se configuren los presupuestos legales o contractuales aplicables.

VIGÉSIMA PRIMERA — RESTITUCIÓN DEL INMUEBLE Y ENTREGA DE LLAVES

Al finalizar la locación, EL LOCATARIO deberá restituir el inmueble libre de ocupantes y pertenencias propias, junto con las llaves y demás elementos recibidos, en un estado compatible con las condiciones iniciales y el desgaste propio del uso regular.

La restitución deberá documentarse de manera que permita acreditar la fecha y las condiciones en que EL LOCADOR recuperó la tenencia del inmueble.

VIGÉSIMA SEGUNDA — FALTA DE RESTITUCIÓN

Si finalizada la relación locativa EL LOCATARIO no restituyera el inmueble en los términos correspondientes, las partes podrán ejercer los derechos y acciones previstos por la legislación vigente y reclamar, cuando corresponda, las sumas, daños o consecuencias derivadas de la ocupación posterior.

VIGÉSIMA TERCERA — DOMICILIOS Y NOTIFICACIONES

A todos los efectos derivados del presente contrato, las partes constituyen los siguientes domicilios:

EL LOCADOR:
${owner.full_name}
${ownerDocumentText}
Domicilio legal: ${ownerLegalFullAddress}
Domicilio electrónico: ${ownerEmail || "no informado"}
Teléfono: ${ownerPhone || "no informado"}

EL LOCATARIO:
${tenant.full_name}
${tenantDocumentText}
Domicilio legal: ${tenantLegalFullAddress}
Domicilio electrónico: ${tenantEmail || "no informado"}
Teléfono: ${tenantPhone || "no informado"}

Las comunicaciones cursadas a los domicilios denunciados por las partes se considerarán efectuadas conforme las reglas legales y contractuales que resulten aplicables. Cada parte deberá informar cualquier modificación de sus datos de contacto.

VIGÉSIMA CUARTA — JURISDICCIÓN Y LEGISLACIÓN APLICABLE

El presente contrato se regirá por la legislación aplicable a la locación y por las normas imperativas correspondientes a la jurisdicción en la que se encuentre ubicado el inmueble.

Para cualquier controversia, las partes se someterán a los tribunales que resulten competentes conforme la legislación vigente, sin que el presente contrato pueda atribuir competencia a un tribunal cuando una norma imperativa disponga lo contrario.

VIGÉSIMA QUINTA — CONDICIONES PARTICULARES

${specialConditionsClause}

Las condiciones particulares válidamente pactadas forman parte integrante del presente contrato y deberán interpretarse conjuntamente con sus restantes cláusulas.

VIGÉSIMA SEXTA — INTEGRIDAD DEL ACUERDO Y MODIFICACIONES

El presente documento contiene las condiciones de la locación acordadas por las partes al momento de su generación.

Toda modificación posterior que altere elementos esenciales del acuerdo deberá quedar documentada y aceptada por ambas partes.

Cuando una versión del contrato sea modificada o regenerada dentro de Verlo, las conformidades correspondientes a versiones anteriores quedarán sin efecto y deberán ser otorgadas nuevamente respecto del texto actualizado.

VIGÉSIMA SÉPTIMA — CONFORMIDAD

EL LOCADOR y EL LOCATARIO manifiestan haber tenido oportunidad de leer íntegramente el presente contrato, revisar los datos personales, el domicilio del inmueble, los importes, fechas y demás condiciones incorporadas.

Las partes declaran que los datos suministrados para la confección de este documento corresponden a la información que ellas mismas ingresaron o confirmaron durante el proceso de cierre.

En señal de conformidad, cada parte podrá registrar su aceptación respecto de esta versión del contrato dentro del espacio privado de cierre habilitado por Verlo.

DATOS PRINCIPALES DEL CONTRATO

INMUEBLE:
${propertyAddress}

LOCADOR:
${owner.full_name}
${ownerDocumentText}
Estado civil: ${ownerCivilStatus}
Domicilio legal: ${ownerLegalFullAddress}
Email: ${ownerEmail || "no informado"}
Teléfono: ${ownerPhone || "no informado"}

LOCATARIO:
${tenant.full_name}
${tenantDocumentText}
Estado civil: ${tenantCivilStatus}
Domicilio legal: ${tenantLegalFullAddress}
Email: ${tenantEmail || "no informado"}
Teléfono: ${tenantPhone || "no informado"}

PLAZO:
Desde ${formatDateAR(
      startDate
    )} hasta ${formatDateAR(
      endDate
    )}

ALQUILER MENSUAL INICIAL:
${amountContractText(
      monthlyPrice
    )}

DEPÓSITO:
${amountContractText(
      deposit
    )}

ACTUALIZACIÓN:
${adjustmentMethod}

AMOBLAMIENTO:
${
  furnishingStatus ===
  "furnished"
    ? "AMOBLADO"
    : furnishingStatus ===
        "partially_furnished"
      ? "PARCIALMENTE AMOBLADO"
      : "SIN AMOBLAR"
}

El presente documento fue generado en Verlo a partir de los datos y condiciones informados y confirmados durante el proceso de cierre.
`.trim()

    // =========================================================
    // 17. PRESERVAR TERMS_JSON
    // =========================================================

    const nextTerms = {
      ...currentTerms,

      tenant_dni:
        tenantDni,

      expenses:
        finalExpenses,

      services:
        finalServices,

      special_conditions:
        finalSpecialConditions,

      payment_method:
        finalPaymentMethod,

      payment_details:
        finalPaymentDetails,

      guarantee_type:
        finalGuaranteeType,

      guarantee_details:
        finalGuaranteeDetails,

      pets_policy:
        finalPetsPolicy,

      insurance_terms:
        finalInsuranceTerms,
    }

    // =========================================================
    // 18. GUARDAR CONTRATO
    //
    // REGENERAR = RESET DE AMBOS OK
    // =========================================================

    const {
      data:
        updatedContract,
      error:
        updateError,
    } =
      await supabase
        .from(
          "lead_contracts"
        )
        .update({
          monthly_price:
            monthlyPrice,

          deposit,

          start_date:
            startDate,

          end_date:
            endDate,

          adjustment_method:
            adjustmentMethod,

          terms_json:
            nextTerms,

          content,

          status:
            "generated",

          tenant_agreed_at:
            null,

          owner_agreed_at:
            null,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          contract.id
        )
        .select(`
          id,
          lead_match_id,
          status,
          monthly_price,
          deposit,
          start_date,
          end_date,
          adjustment_method,
          terms_json,
          content,
          tenant_agreed_at,
          owner_agreed_at,
          updated_at
        `)
        .single()

    if (
      updateError ||
      !updatedContract
    ) {
      throw new Error(
        updateError
          ?.message ||
          "Could not generate contract"
      )
    }

    // =========================================================
    // 19. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      contract:
        updatedContract,
    })
  } catch (error) {
    console.error(
      "closing-generate error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof
            Error
            ? error.message
            : "Unexpected server error",
      },
      {
        status: 500,
      }
    )
  }
}
