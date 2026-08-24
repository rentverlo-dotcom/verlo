import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

function formatDateAR(value: string) {
  if (!value) return ""

  const [year, month, day] =
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

function formatMoney(value: number) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }
  ).format(value)
}

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing configuration",
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
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )

    const body =
      await request
        .json()
        .catch(() => ({}))

    const token =
      clean(body?.token)

    const monthlyPrice =
      Number(body?.monthly_price)

    const deposit =
      Number(body?.deposit)

    const startDate =
      clean(body?.start_date)

    const endDate =
      clean(body?.end_date)

    const adjustmentMethod =
      clean(
        body?.adjustment_method
      )

    const expenses =
      clean(body?.expenses)

    const services =
      clean(body?.services)

    const specialConditions =
      clean(
        body?.special_conditions
      )

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing token",
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
            "Invalid monthly price",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !Number.isFinite(deposit) ||
      deposit < 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid deposit",
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
            "Missing contract dates",
        },
        {
          status: 400,
        }
      )
    }

    if (!adjustmentMethod) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing adjustment method",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. VALIDAR TOKEN DE CIERRE
    // =========================================================

    const {
      data: accessToken,
      error: tokenError,
    } = await supabase
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
          error: "Invalid token",
        },
        {
          status: 404,
        }
      )
    }

    if (accessToken.revoked_at) {
      return NextResponse.json(
        {
          ok: false,
          error: "Token revoked",
        },
        {
          status: 403,
        }
      )
    }

    if (
      accessToken.expires_at &&
      new Date(
        accessToken.expires_at
      ).getTime() <
        Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Expired token",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 2. TRAER CONTRATO
    // =========================================================

    const {
      data: contract,
      error: contractError,
    } = await supabase
      .from("lead_contracts")
      .select(`
        id,
        lead_match_id,
        tenant_lead_id,
        owner_lead_id,
        status,
        tenant_agreed_at,
        owner_agreed_at
      `)
      .eq(
        "id",
        accessToken.contract_id
      )
      .single()

    if (
      contractError ||
      !contract
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Contract not found",
        },
        {
          status: 404,
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
            "Contract already agreed",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 3. MATCH DEBE SEGUIR EN DOBLE OK
    // =========================================================

    const {
      data: match,
      error: matchError,
    } = await supabase
      .from("lead_matches")
      .select(`
        id,
        tenant_lead_id,
        owner_lead_id,
        ready_to_connect_at
      `)
      .eq(
        "id",
        contract.lead_match_id
      )
      .single()

    if (
      matchError ||
      !match
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Match not found",
        },
        {
          status: 404,
        }
      )
    }

    if (
      !match.ready_to_connect_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Match is not ready",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 4. TRAER OWNER + TENANT
    // =========================================================

    const {
      data: people,
      error: peopleError,
    } = await supabase
      .from("lead_intake")
      .select(`
        id,
        full_name,
        email,
        phone,
        phone_normalized,
        zone,
        area_macro,
        neighborhood_labels,
        property_type,
        property_rooms
      `)
      .in(
        "id",
        [
          contract.tenant_lead_id,
          contract.owner_lead_id,
        ]
      )

    if (peopleError) {
      throw new Error(
        peopleError.message
      )
    }

    const tenant =
      (people || []).find(
        (person) =>
          person.id ===
          contract.tenant_lead_id
      )

    const owner =
      (people || []).find(
        (person) =>
          person.id ===
          contract.owner_lead_id
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
    // 5. TRAER DATOS COMPLETOS DE PROPIEDAD
    // =========================================================

    const {
      data: completion,
      error: completionError,
    } = await supabase
      .from(
        "owner_property_completions"
      )
      .select(`
        private_address,
        floor_unit,
        expenses_amount,
        requirements,
        visit_conditions,
        property_notes
      `)
      .eq(
        "lead_id",
        contract.owner_lead_id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle()

    if (completionError) {
      console.error(
        "closing generate completion error:",
        completionError
      )
    }

    const addressParts = [
      completion?.private_address,
      completion?.floor_unit,
      owner
        .neighborhood_labels?.[0],
      owner.area_macro,
      owner.zone,
    ].filter(Boolean)

    const propertyAddress =
      addressParts.join(", ")

    // =========================================================
    // 6. GENERAR TEXTO CONTRACTUAL
    // =========================================================

    const content = `
CONTRATO DE LOCACIÓN

Entre ${owner.full_name}, en adelante "EL LOCADOR", por una parte, y ${tenant.full_name}, en adelante "EL LOCATARIO", por la otra, acuerdan celebrar el presente contrato de locación sujeto a las siguientes cláusulas:

PRIMERA — OBJETO

EL LOCADOR da en locación a EL LOCATARIO el inmueble ubicado en ${propertyAddress || "domicilio a completar"}, destinado exclusivamente a vivienda, junto con todos los accesorios e instalaciones existentes en el inmueble.

SEGUNDA — PLAZO

El presente contrato tendrá vigencia desde el día ${formatDateAR(startDate)} hasta el día ${formatDateAR(endDate)}.

TERCERA — PRECIO

El precio inicial de la locación se establece en la suma de ${formatMoney(monthlyPrice)} mensuales.

El pago deberá efectuarse en la forma, lugar y modalidad que acuerden las partes.

CUARTA — ACTUALIZACIÓN

El valor del alquiler se actualizará de acuerdo con el siguiente mecanismo:

${adjustmentMethod}.

QUINTA — DEPÓSITO

EL LOCATARIO entrega en concepto de depósito la suma de ${formatMoney(deposit)}.

El depósito será restituido al finalizar la relación locativa, sujeto al cumplimiento de las obligaciones contractuales y al estado de conservación del inmueble.

SEXTA — EXPENSAS Y GASTOS

${expenses || "Las partes acuerdan definir la distribución de expensas, tasas y gastos relacionados con el inmueble de acuerdo con la normativa vigente y lo pactado entre ellas."}

SÉPTIMA — SERVICIOS

${services || "Los servicios vinculados al uso del inmueble estarán a cargo de EL LOCATARIO, salvo acuerdo distinto entre las partes."}

OCTAVA — DESTINO DEL INMUEBLE

El inmueble será destinado exclusivamente a vivienda y no podrá modificarse dicho destino sin autorización expresa de EL LOCADOR.

NOVENA — CONSERVACIÓN

EL LOCATARIO se obliga a conservar el inmueble en buen estado de uso y mantenimiento y a comunicar cualquier desperfecto relevante que requiera intervención del propietario.

DÉCIMA — RESTITUCIÓN

Al finalizar el contrato, EL LOCATARIO deberá restituir el inmueble libre de ocupantes y pertenencias, en condiciones acordes con el uso normal y responsable del mismo.

DÉCIMA PRIMERA — CONDICIONES PARTICULARES

${specialConditions || "No se establecen condiciones particulares adicionales."}

DÉCIMA SEGUNDA — ACUERDO

Las partes manifiestan haber leído y comprendido el contenido del presente contrato y expresan su conformidad con las condiciones aquí establecidas.

Datos de contacto informados en Verlo:

LOCADOR
${owner.full_name}
Email: ${owner.email || ""}
Teléfono: ${owner.phone_normalized || owner.phone || ""}

LOCATARIO
${tenant.full_name}
Email: ${tenant.email || ""}
Teléfono: ${tenant.phone_normalized || tenant.phone || ""}

El presente documento fue generado a través de Verlo sobre la base de la información y condiciones ingresadas por las partes.
`.trim()

    // =========================================================
    // 7. GUARDAR CONTRATO GENERADO
    //
    // SI SE REGENERA:
    // LAS ACEPTACIONES ANTERIORES SE RESETEAN.
    // =========================================================

    const terms = {
      expenses,
      services,
      special_conditions:
        specialConditions,
    }

    const {
      data: updatedContract,
      error: updateError,
    } = await supabase
      .from("lead_contracts")
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
          terms,

        content,

        status:
          "generated",

        tenant_agreed_at:
          null,

        owner_agreed_at:
          null,

        updated_at:
          new Date().toISOString(),
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
        updateError?.message ||
          "Could not generate contract"
      )
    }

    // =========================================================
    // 8. RESPONSE
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
          error instanceof Error
            ? error.message
            : "Unexpected server error",
      },
      {
        status: 500,
      }
    )
  }
}
