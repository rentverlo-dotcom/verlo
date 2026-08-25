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

const VALID_FURNISHING_STATUSES = [
  "furnished",
  "unfurnished",
  "partially_furnished",
] as const

type FurnishingStatus =
  typeof VALID_FURNISHING_STATUSES[number]

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

function normalizeDocument(
  value: unknown
) {
  return clean(value)
    .replace(/\s+/g, "")
    .replace(/\./g, "")
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

function normalizeFurnishingStatus(
  value: unknown
): FurnishingStatus | null {
  const cleaned =
    clean(value)

  if (
    VALID_FURNISHING_STATUSES.includes(
      cleaned as FurnishingStatus
    )
  ) {
    return cleaned as FurnishingStatus
  }

  return null
}

function sameJsonValue(
  a: unknown,
  b: unknown
) {
  return (
    JSON.stringify(a) ===
    JSON.stringify(b)
  )
}

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
            "Missing Supabase env vars",
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

    // =========================================================
    // 1. VALIDAR TOKEN DE CIERRE
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
          expires_at,
          revoked_at
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

    if (
      accessToken.role !==
        "tenant" &&
      accessToken.role !==
        "owner"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid closing role",
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

    // =========================================================
    // 3. VALIDAR QUE EL TOKEN SEA DE ESA PARTE
    // =========================================================

    const expectedLeadId =
      accessToken.role ===
      "tenant"
        ? contract
            .tenant_lead_id
        : contract
            .owner_lead_id

    if (
      accessToken
        .lead_id !==
      expectedLeadId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Token does not belong to this contract party",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 4. CONTRATO CERRADO = INMUTABLE
    // =========================================================

    if (
      contract.status ===
      "agreed"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This contract is already agreed and cannot be modified",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 5. VALIDAR QUE EL MATCH SIGA READY
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
            "Match is not ready to close",
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
            "Contract parties do not match lead match",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 6. TERMS ACTUALES
    // =========================================================

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

    const nextTerms:
      Record<
        string,
        unknown
      > = {
        ...currentTerms,
      }

    // =========================================================
    // 7. TENANT:
    // SOLO PUEDE MODIFICAR SUS PROPIOS DATOS LEGALES
    // =========================================================

    if (
      accessToken.role ===
      "tenant"
    ) {
      const tenantData =
        isObject(
          body?.tenant
        )
          ? body.tenant
          : {}

      const tenantDni =
        normalizeDocument(
          tenantData
            .dni
        )

      const tenantCivilStatus =
        clean(
          tenantData
            .civil_status
        )

      const tenantLegalAddress =
        clean(
          tenantData
            .legal_address
        )

      const tenantCity =
        clean(
          tenantData
            .city
        )

      const tenantProvince =
        clean(
          tenantData
            .province
        )

      const tenantCountry =
        clean(
          tenantData
            .country
        ) ||
        "Argentina"

      const tenantPostalCode =
        clean(
          tenantData
            .postal_code
        )

      if (
        !tenantDni
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta el DNI del inquilino.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !tenantCivilStatus
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta el estado civil del inquilino.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !tenantLegalAddress
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta el domicilio legal del inquilino.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !tenantCity
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta la localidad del domicilio del inquilino.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !tenantProvince
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta la provincia del domicilio del inquilino.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !tenantCountry
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta el país del domicilio del inquilino.",
          },
          {
            status: 400,
          }
        )
      }

      nextTerms
        .tenant_dni =
        tenantDni

      nextTerms
        .tenant_civil_status =
        tenantCivilStatus

      nextTerms
        .tenant_legal_address =
        tenantLegalAddress

      nextTerms
        .tenant_city =
        tenantCity

      nextTerms
        .tenant_province =
        tenantProvince

      nextTerms
        .tenant_country =
        tenantCountry

      nextTerms
        .tenant_postal_code =
        tenantPostalCode ||
        null
    }

    // =========================================================
    // 8. OWNER:
    // DATOS PROPIOS + INMUEBLE + FIRMA + AMOBLAMIENTO
    // =========================================================

    if (
      accessToken.role ===
      "owner"
    ) {
      const ownerData =
        isObject(
          body?.owner
        )
          ? body.owner
          : {}

      const propertyData =
        isObject(
          body?.property
        )
          ? body.property
          : {}

      const signingData =
        isObject(
          body?.signing_place
        )
          ? body
              .signing_place
          : {}

      const furnishingData =
        isObject(
          body?.furnishing
        )
          ? body
              .furnishing
          : {}

      // =======================================================
      // OWNER LEGAL
      // =======================================================

      const ownerDni =
        normalizeDocument(
          ownerData
            .dni
        )

      const ownerTaxId =
        normalizeDocument(
          ownerData
            .tax_id
        )

      const ownerCivilStatus =
        clean(
          ownerData
            .civil_status
        )

      const ownerLegalAddress =
        clean(
          ownerData
            .legal_address
        )

      const ownerCity =
        clean(
          ownerData
            .city
        )

      const ownerProvince =
        clean(
          ownerData
            .province
        )

      const ownerCountry =
        clean(
          ownerData
            .country
        ) ||
        "Argentina"

      const ownerPostalCode =
        clean(
          ownerData
            .postal_code
        )

      const ownerActingAs =
        clean(
          ownerData
            .acting_as
        ) ||
        "owner"

      const ownerPowerDetails =
        clean(
          ownerData
            .power_details
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
            status: 400,
          }
        )
      }

      if (
        !ownerCivilStatus
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta el estado civil del propietario.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !ownerLegalAddress
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta el domicilio legal del propietario.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !ownerCity
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta la localidad del domicilio del propietario.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !ownerProvince
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta la provincia del domicilio del propietario.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !ownerCountry
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta el país del domicilio del propietario.",
          },
          {
            status: 400,
          }
        )
      }

      nextTerms
        .owner_dni =
        ownerDni ||
        null

      nextTerms
        .owner_tax_id =
        ownerTaxId ||
        null

      nextTerms
        .owner_civil_status =
        ownerCivilStatus

      nextTerms
        .owner_legal_address =
        ownerLegalAddress

      nextTerms
        .owner_city =
        ownerCity

      nextTerms
        .owner_province =
        ownerProvince

      nextTerms
        .owner_country =
        ownerCountry

      nextTerms
        .owner_postal_code =
        ownerPostalCode ||
        null

      nextTerms
        .owner_acting_as =
        ownerActingAs

      nextTerms
        .owner_power_details =
        ownerPowerDetails ||
        null

      // =======================================================
      // INMUEBLE
      // =======================================================

      const propertyStreet =
        clean(
          propertyData
            .street
        )

      const propertyNumber =
        clean(
          propertyData
            .number
        )

      const propertyFloor =
        clean(
          propertyData
            .floor
        )

      const propertyUnit =
        clean(
          propertyData
            .unit
        )

      const propertyCity =
        clean(
          propertyData
            .city
        )

      const propertyProvince =
        clean(
          propertyData
            .province
        )

      const propertyCountry =
        clean(
          propertyData
            .country
        ) ||
        "Argentina"

      const propertyPostalCode =
        clean(
          propertyData
            .postal_code
        )

      if (
        !propertyStreet
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta la calle del inmueble.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !propertyNumber
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta el número del inmueble.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !propertyCity
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta la localidad del inmueble.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !propertyProvince
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta la provincia del inmueble.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !propertyCountry
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta el país del inmueble.",
          },
          {
            status: 400,
          }
        )
      }

      nextTerms
        .property_street =
        propertyStreet

      nextTerms
        .property_number =
        propertyNumber

      nextTerms
        .property_floor =
        propertyFloor ||
        null

      nextTerms
        .property_unit =
        propertyUnit ||
        null

      nextTerms
        .property_city =
        propertyCity

      nextTerms
        .property_province =
        propertyProvince

      nextTerms
        .property_country =
        propertyCountry

      nextTerms
        .property_postal_code =
        propertyPostalCode ||
        null

      // =======================================================
      // LUGAR DE CELEBRACIÓN
      // =======================================================

      const signingCity =
        clean(
          signingData
            .city
        )

      const signingProvince =
        clean(
          signingData
            .province
        )

      const signingCountry =
        clean(
          signingData
            .country
        ) ||
        "Argentina"

      if (
        !signingCity
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta la ciudad o localidad de celebración del contrato.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !signingProvince
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta la provincia de celebración del contrato.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !signingCountry
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Falta el país de celebración del contrato.",
          },
          {
            status: 400,
          }
        )
      }

      nextTerms
        .signing_city =
        signingCity

      nextTerms
        .signing_province =
        signingProvince

      nextTerms
        .signing_country =
        signingCountry

      // =======================================================
      // AMOBLAMIENTO FINAL
      // =======================================================

      const furnishingStatus =
        normalizeFurnishingStatus(
          furnishingData
            .status
        )

      const furnishingInventory =
        clean(
          furnishingData
            .inventory
        )

      const furnishingConditionNotes =
        clean(
          furnishingData
            .condition_notes
        )

      if (
        !furnishingStatus
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Definí si el inmueble se entrega amoblado, sin amoblar o parcialmente amoblado.",
          },
          {
            status: 400,
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
              "Indicá qué muebles y bienes quedan incluidos.",
          },
          {
            status: 400,
          }
        )
      }

      nextTerms
        .furnishing_status =
        furnishingStatus

      nextTerms
        .furnishing_inventory =
        furnishingInventory ||
        null

      nextTerms
        .furnishing_condition_notes =
        furnishingConditionNotes ||
        null
    }

    // =========================================================
    // 9. DETECTAR SI REALMENTE CAMBIÓ ALGO
    // =========================================================

    const changed =
      !sameJsonValue(
        currentTerms,
        nextTerms
      )

    if (!changed) {
      return NextResponse.json({
        ok: true,

        changed:
          false,

        role:
          accessToken
            .role,

        contract_id:
          contract.id,

        contract_status:
          contract.status,

        terms:
          currentTerms,

        contract_invalidated:
          false,
      })
    }

    // =========================================================
    // 10. GUARDAR
    //
    // CAMBIO LEGAL = VERSIÓN CONTRACTUAL ANTERIOR INVÁLIDA
    //
    // Si había contenido generado:
    // - vuelve a draft
    // - content = null
    // - reset tenant_agreed_at
    // - reset owner_agreed_at
    //
    // Así jamás queda una aceptación asociada a datos viejos.
    // =========================================================

    const hadGeneratedContract =
      Boolean(
        contract
          .content
      ) ||
      contract.status ===
        "generated" ||
      Boolean(
        contract
          .tenant_agreed_at
      ) ||
      Boolean(
        contract
          .owner_agreed_at
      )

    const updatePayload:
      Record<
        string,
        unknown
      > = {
      terms_json:
        nextTerms,

      updated_at:
        new Date()
          .toISOString(),
    }

    if (
      hadGeneratedContract
    ) {
      updatePayload
        .status =
        "draft"

      updatePayload
        .content =
        null

      updatePayload
        .tenant_agreed_at =
        null

      updatePayload
        .owner_agreed_at =
        null
    }

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
        .update(
          updatePayload
        )
        .eq(
          "id",
          contract.id
        )
        .select(`
          id,
          status,
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
          "Could not save legal contract data"
      )
    }

    // =========================================================
    // 11. RESPUESTA
    // =========================================================

    return NextResponse.json({
      ok: true,

      changed:
        true,

      role:
        accessToken
          .role,

      contract_id:
        updatedContract
          .id,

      contract_status:
        updatedContract
          .status,

      terms:
        updatedContract
          .terms_json ||
        {},

      contract_invalidated:
        hadGeneratedContract,

      message:
        hadGeneratedContract
          ? "Los datos fueron guardados. Como cambió información contractual, la versión anterior fue invalidada y debe generarse nuevamente."
          : "Los datos fueron guardados.",
    })
  } catch (error) {
    console.error(
      "closing-legal-data error:",
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
