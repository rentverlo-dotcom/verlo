import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  createClient,
} from "@supabase/supabase-js"

import {
  createR2ReadUrl,
} from "@/lib/r2"

export const runtime =
  "nodejs"

export const dynamic =
  "force-dynamic"

function clean(
  value: unknown
) {
  return String(
    value || ""
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

function filenameFromKey(
  key: string | null
) {
  if (!key) {
    return null
  }

  const parts =
    key.split("/")

  return (
    parts[
      parts.length - 1
    ] ||
    null
  )
}

function guessContentType(
  key: string | null
) {
  const value =
    clean(key)
      .toLowerCase()

  if (
    value.endsWith(
      ".jpg"
    ) ||
    value.endsWith(
      ".jpeg"
    )
  ) {
    return "image/jpeg"
  }

  if (
    value.endsWith(
      ".png"
    )
  ) {
    return "image/png"
  }

  if (
    value.endsWith(
      ".webp"
    )
  ) {
    return "image/webp"
  }

  if (
    value.endsWith(
      ".pdf"
    )
  ) {
    return "application/pdf"
  }

  if (
    value.endsWith(
      ".mp4"
    )
  ) {
    return "video/mp4"
  }

  if (
    value.endsWith(
      ".mov"
    )
  ) {
    return "video/quicktime"
  }

  return null
}

async function safeSignedUrl(
  key: string | null
) {
  if (!key) {
    return null
  }

  try {
    return await createR2ReadUrl({
      key,
      expiresSeconds:
        900,
    })
  } catch (
    error
  ) {
    console.error(
      "R2 read URL error:",
      key,
      error
    )

    return null
  }
}

export async function GET(
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

    const token =
      clean(
        request
          .nextUrl
          .searchParams
          .get(
            "token"
          )
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
    // 1. TOKEN DE CIERRE
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
    // 2. CONTRATO
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
          owner_agreed_at,
          created_at,
          updated_at
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
    // 3. MATCH
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
          score,
          status,
          tenant_lead_id,
          owner_lead_id,
          tenant_interest_at,
          tenant_verified_at,
          owner_interest_at,
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
    // 4. TENANT + OWNER
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
          zone,
          area_macro,
          neighborhood_labels,
          property_type,
          property_rooms,
          approx_price,
          approx_price_number,
          availability_status,
          income_proof_type,
          income_range,
          income_max,
          guarantee_types
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
    // 5. VERIFICACIÓN TENANT
    // =========================================================

    const verificationFields = `
      id,
      lead_id,
      match_id,
      document_number,
      dni_front_path,
      dni_back_path,
      selfie_path,
      income_proof_path,
      employment_status,
      income_range,
      guarantee_type,
      move_notes,
      status,
      reviewed_at,
      created_at
    `

    const {
      data:
        reusableVerification,

      error:
        reusableVerificationError,
    } =
      await supabase
        .from(
          "tenant_verifications"
        )
        .select(
          verificationFields
        )
        .eq(
          "lead_id",
          contract
            .tenant_lead_id
        )
        .is(
          "match_id",
          null
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
      reusableVerificationError
    ) {
      console.error(
        "closing reusable tenant verification lookup error:",
        reusableVerificationError
      )
    }

    let tenantVerification =
      reusableVerification

    if (
      !tenantVerification
    ) {
      const {
        data:
          historicalVerification,

        error:
          historicalVerificationError,
      } =
        await supabase
          .from(
            "tenant_verifications"
          )
          .select(
            verificationFields
          )
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
        historicalVerificationError
      ) {
        console.error(
          "closing historical tenant verification lookup error:",
          historicalVerificationError
        )
      }

      tenantVerification =
        historicalVerification
    }

    // =========================================================
    // 6. COMPLETION PROPIEDAD
    // =========================================================

    const {
      data:
        completion,

      error:
        completionError,
    } =
      await supabase
        .from(
          "owner_property_completions"
        )
        .select(`
          id,
          private_address,
          floor_unit,
          expenses_amount,
          availability_status,
          requirements,
          visit_conditions,
          property_notes,
          status,
          created_at
        `)
        .eq(
          "lead_id",
          contract
            .owner_lead_id
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
      completionError
    ) {
      console.error(
        "closing completion lookup error:",
        completionError
      )
    }

    // =========================================================
    // 7. MULTIMEDIA DE LA PROPIEDAD
    // =========================================================

    let propertyMedia:
      Array<{
        id: string
        type: string
        url: string | null
        key: string | null
        filename: string | null
        content_type: string | null
        position: number
        available: boolean
      }> = []

    if (
      accessToken.role ===
        "tenant" &&
      completion?.id
    ) {
      const {
        data:
          mediaRows,

        error:
          mediaError,
      } =
        await supabase
          .from(
            "owner_property_media"
          )
          .select(`
            id,
            media_type,
            r2_key,
            public_url,
            original_filename,
            content_type,
            position
          `)
          .eq(
            "completion_id",
            completion.id
          )
          .order(
            "position",
            {
              ascending:
                true,
            }
          )

      if (
        mediaError
      ) {
        console.error(
          "closing property media lookup error:",
          mediaError
        )
      } else {
        propertyMedia =
          await Promise.all(
            (
              mediaRows ||
              []
            ).map(
              async (
                item
              ) => {
                const key =
                  nullableString(
                    item
                      .r2_key
                  )

                const signedUrl =
                  await safeSignedUrl(
                    key
                  )

                const fallbackUrl =
                  nullableString(
                    item
                      .public_url
                  )

                return {
                  id:
                    item.id,

                  type:
                    item
                      .media_type ||
                    (
                      item
                        .content_type
                        ?.startsWith(
                          "video/"
                        )
                        ? "video"
                        : "photo"
                    ),

                  url:
                    signedUrl ||
                    fallbackUrl,

                  key,

                  filename:
                    nullableString(
                      item
                        .original_filename
                    ) ||
                    filenameFromKey(
                      key
                    ),

                  content_type:
                    nullableString(
                      item
                        .content_type
                    ) ||
                    guessContentType(
                      key
                    ),

                  position:
                    Number(
                      item
                        .position ||
                        0
                    ),

                  available:
                    Boolean(
                      key ||
                      fallbackUrl
                    ),
                }
              }
            )
          )
      }
    }

    // =========================================================
    // 8. DOCUMENTOS PRIVADOS DEL TENANT
    // =========================================================

    let tenantDocuments:
      Array<{
        kind: string
        label: string
        key: string | null
        url: string | null
        filename: string | null
        content_type: string | null
        available: boolean
        readable: boolean
      }> = []

    if (
      accessToken.role ===
      "owner"
    ) {
      const rawDocuments =
        [
          {
            kind:
              "dni_front",

            label:
              "DNI — frente",

            key:
              nullableString(
                tenantVerification
                  ?.dni_front_path
              ),
          },
          {
            kind:
              "dni_back",

            label:
              "DNI — dorso",

            key:
              nullableString(
                tenantVerification
                  ?.dni_back_path
              ),
          },
          {
            kind:
              "selfie",

            label:
              "Selfie de validación",

            key:
              nullableString(
                tenantVerification
                  ?.selfie_path
              ),
          },
          {
            kind:
              "income_proof",

            label:
              "Comprobante de ingresos",

            key:
              nullableString(
                tenantVerification
                  ?.income_proof_path
              ),
          },
        ]

      tenantDocuments =
        await Promise.all(
          rawDocuments.map(
            async (
              document
            ) => {
              const url =
                await safeSignedUrl(
                  document
                    .key
                )

              return {
                kind:
                  document.kind,

                label:
                  document.label,

                key:
                  document.key,

                url,

                filename:
                  filenameFromKey(
                    document
                      .key
                  ),

                content_type:
                  guessContentType(
                    document
                      .key
                  ),

                available:
                  Boolean(
                    document
                      .key
                  ),

                readable:
                  Boolean(
                    url
                  ),
              }
            }
          )
        )
    }

    // =========================================================
    // 9. TERMS JSON
    // =========================================================

    const terms =
      contract
        .terms_json &&
      typeof contract
        .terms_json ===
        "object"
        ? contract
            .terms_json as Record<
              string,
              unknown
            >
        : {}

    // =========================================================
    // 10. TENANT LEGAL
    // =========================================================

    const tenantDni =
      nullableString(
        terms
          .tenant_dni
      ) ||
      nullableString(
        tenantVerification
          ?.document_number
      )

    const tenantLegal = {
      full_name:
        nullableString(
          tenant
            .full_name
        ),

      dni:
        tenantDni,

      tax_id:
        nullableString(
          terms
            .tenant_tax_id
        ),

      civil_status:
        nullableString(
          terms
            .tenant_civil_status
        ),

      legal_address:
        nullableString(
          terms
            .tenant_legal_address
        ),

      city:
        nullableString(
          terms
            .tenant_city
        ),

      province:
        nullableString(
          terms
            .tenant_province
        ),

      country:
        nullableString(
          terms
            .tenant_country
        ) ||
        "Argentina",

      postal_code:
        nullableString(
          terms
            .tenant_postal_code
        ),

      phone:
        nullableString(
          tenant
            .phone_normalized ||
          tenant
            .phone
        ),

      email:
        nullableString(
          tenant
            .email
        ),
    }

    // =========================================================
    // 11. OWNER LEGAL
    // =========================================================

    const ownerLegal = {
      full_name:
        nullableString(
          owner
            .full_name
        ),

      dni:
        nullableString(
          terms
            .owner_dni
        ),

      tax_id:
        nullableString(
          terms
            .owner_tax_id
        ),

      civil_status:
        nullableString(
          terms
            .owner_civil_status
        ),

      legal_address:
        nullableString(
          terms
            .owner_legal_address
        ),

      city:
        nullableString(
          terms
            .owner_city
        ),

      province:
        nullableString(
          terms
            .owner_province
        ),

      country:
        nullableString(
          terms
            .owner_country
        ) ||
        "Argentina",

      postal_code:
        nullableString(
          terms
            .owner_postal_code
        ),

      phone:
        nullableString(
          owner
            .phone_normalized ||
          owner
            .phone
        ),

      email:
        nullableString(
          owner
            .email
        ),

      acting_as:
        nullableString(
          terms
            .owner_acting_as
        ) ||
        "owner",

      power_details:
        nullableString(
          terms
            .owner_power_details
        ),
    }

    // =========================================================
    // 12. LUGAR CELEBRACIÓN
    // =========================================================

    const signingPlace = {
      city:
        nullableString(
          terms
            .signing_city
        ),

      province:
        nullableString(
          terms
            .signing_province
        ),

      country:
        nullableString(
          terms
            .signing_country
        ) ||
        "Argentina",
    }

    // =========================================================
    // 13. INMUEBLE CONTRACTUAL
    // =========================================================

    const propertyLegal = {
      street:
        nullableString(
          terms
            .property_street
        ),

      number:
        nullableString(
          terms
            .property_number
        ),

      floor:
        nullableString(
          terms
            .property_floor
        ),

      unit:
        nullableString(
          terms
            .property_unit
        ),

      city:
        nullableString(
          terms
            .property_city
        ),

      province:
        nullableString(
          terms
            .property_province
        ),

      country:
        nullableString(
          terms
            .property_country
        ) ||
        "Argentina",

      postal_code:
        nullableString(
          terms
            .property_postal_code
        ),

      private_address:
        nullableString(
          completion
            ?.private_address
        ),

      floor_unit:
        nullableString(
          completion
            ?.floor_unit
        ),
    }

    // =========================================================
    // 14. AMOBLAMIENTO
    // =========================================================

    const furnishing = {
      status:
        nullableString(
          terms
            .furnishing_status
        ),

      inventory:
        nullableString(
          terms
            .furnishing_inventory
        ),

      condition_notes:
        nullableString(
          terms
            .furnishing_condition_notes
        ),
    }

    // =========================================================
    // 15. COMPLETITUD
    // =========================================================

    const tenantLegalComplete =
      Boolean(
        tenantLegal
          .full_name &&
        tenantLegal
          .dni &&
        tenantLegal
          .civil_status &&
        tenantLegal
          .legal_address &&
        tenantLegal
          .city &&
        tenantLegal
          .province &&
        tenantLegal
          .country
      )

    const ownerIdentification =
      ownerLegal.dni ||
      ownerLegal.tax_id

    const ownerLegalComplete =
      Boolean(
        ownerLegal
          .full_name &&
        ownerIdentification &&
        ownerLegal
          .civil_status &&
        ownerLegal
          .legal_address &&
        ownerLegal
          .city &&
        ownerLegal
          .province &&
        ownerLegal
          .country
      )

    const propertyLegalComplete =
      Boolean(
        propertyLegal
          .street &&
        propertyLegal
          .number &&
        propertyLegal
          .city &&
        propertyLegal
          .province &&
        propertyLegal
          .country
      )

    const signingPlaceComplete =
      Boolean(
        signingPlace
          .city &&
        signingPlace
          .province &&
        signingPlace
          .country
      )

    const furnishingComplete =
      Boolean(
        furnishing
          .status
      )

    const legalDataComplete =
      tenantLegalComplete &&
      ownerLegalComplete &&
      propertyLegalComplete &&
      signingPlaceComplete &&
      furnishingComplete

    // =========================================================
    // 16. ESTADO DE ASSETS PARA REVISIÓN
    // =========================================================

    const propertyAssetsExpected =
      accessToken.role ===
        "tenant"

    const tenantDocumentsExpected =
      accessToken.role ===
        "owner"

    const propertyMediaReadable =
      !propertyAssetsExpected ||
      (
        propertyMedia.length >
          0 &&
        propertyMedia.every(
          item =>
            Boolean(
              item.url
            )
        )
      )

    const existingTenantDocuments =
      tenantDocuments.filter(
        document =>
          document.available
      )

    const tenantDocumentsReadable =
      !tenantDocumentsExpected ||
      (
        existingTenantDocuments.length >
          0 &&
        existingTenantDocuments.every(
          document =>
            document.readable
        )
      )

    const reviewAssetsReady =
      propertyMediaReadable &&
      tenantDocumentsReadable

    // =========================================================
    // 17. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      viewer: {
        role:
          accessToken
            .role,

        lead_id:
          accessToken
            .lead_id,
      },

      contract: {
        id:
          contract.id,

        match_id:
          contract
            .lead_match_id,

        status:
          contract.status,

        monthly_price:
          contract
            .monthly_price,

        deposit:
          contract
            .deposit,

        start_date:
          contract
            .start_date,

        end_date:
          contract
            .end_date,

        adjustment_method:
          contract
            .adjustment_method,

        terms,

        content:
          contract.content,

        tenant_agreed:
          Boolean(
            contract
              .tenant_agreed_at
          ),

        owner_agreed:
          Boolean(
            contract
              .owner_agreed_at
          ),

        tenant_agreed_at:
          contract
            .tenant_agreed_at,

        owner_agreed_at:
          contract
            .owner_agreed_at,

        created_at:
          contract
            .created_at,

        updated_at:
          contract
            .updated_at,
      },

      match: {
        id:
          match.id,

        score:
          Number(
            match.score ||
              0
          ),

        status:
          match.status,

        ready_to_connect_at:
          match
            .ready_to_connect_at,
      },

      tenant: {
        id:
          tenant.id,

        full_name:
          tenant
            .full_name,

        email:
          tenant
            .email,

        phone:
          tenant
            .phone_normalized ||
          tenant
            .phone,

        document_number:
          tenantDni,

        verification_status:
          tenantVerification
            ?.status ||
          null,
      },

      owner: {
        id:
          owner.id,

        full_name:
          owner
            .full_name,

        email:
          owner
            .email,

        phone:
          owner
            .phone_normalized ||
          owner
            .phone,
      },

      legal: {
        tenant:
          tenantLegal,

        owner:
          ownerLegal,

        signing_place:
          signingPlace,

        property:
          propertyLegal,

        furnishing,

        completeness: {
          tenant:
            tenantLegalComplete,

          owner:
            ownerLegalComplete,

          property:
            propertyLegalComplete,

          signing_place:
            signingPlaceComplete,

          furnishing:
            furnishingComplete,

          all:
            legalDataComplete,
        },
      },

      property: {
        address:
          completion
            ?.private_address ||
          null,

        floor_unit:
          completion
            ?.floor_unit ||
          null,

        neighborhood:
          owner
            .neighborhood_labels?.[0] ||
          owner
            .area_macro ||
          owner
            .zone ||
          null,

        property_type:
          owner
            .property_type ||
          null,

        rooms:
          owner
            .property_rooms ||
          null,

        approx_price:
          owner
            .approx_price ||
          null,

        approx_price_number:
          owner
            .approx_price_number ??
          null,

        expenses_amount:
          completion
            ?.expenses_amount ??
          null,

        availability_status:
          completion
            ?.availability_status ||
          owner
            .availability_status ||
          null,

        requirements:
          completion
            ?.requirements ||
          null,

        visit_conditions:
          completion
            ?.visit_conditions ||
          null,

        notes:
          completion
            ?.property_notes ||
          null,
      },

      review_assets: {
        ready:
          reviewAssetsReady,

        property_media:
          propertyMedia,

        tenant_profile:
          accessToken.role ===
          "owner"
            ? {
                full_name:
                  tenant
                    .full_name,

                document_number:
                  tenantDni,

                employment_status:
                  tenantVerification
                    ?.employment_status ||
                  null,

                income_proof_type:
                  tenant
                    .income_proof_type ||
                  null,

                income_range:
                  tenantVerification
                    ?.income_range ||
                  tenant
                    .income_range ||
                  null,

                income_max:
                  tenant
                    .income_max ??
                  null,

                guarantee_type:
                  tenantVerification
                    ?.guarantee_type ||
                  null,

                guarantee_types:
                  Array.isArray(
                    tenant
                      .guarantee_types
                  )
                    ? tenant
                        .guarantee_types
                    : [],

                move_notes:
                  tenantVerification
                    ?.move_notes ||
                  null,

                verification_status:
                  tenantVerification
                    ?.status ||
                  null,

                reviewed_at:
                  tenantVerification
                    ?.reviewed_at ||
                  null,
              }
            : null,

        tenant_documents:
          tenantDocuments,

        checks: {
          property_media_expected:
            propertyAssetsExpected,

          property_media_count:
            propertyMedia.length,

          property_media_readable:
            propertyMediaReadable,

          tenant_documents_expected:
            tenantDocumentsExpected,

          tenant_documents_count:
            existingTenantDocuments
              .length,

          tenant_documents_readable:
            tenantDocumentsReadable,
        },
      },
    })
  } catch (
    error
  ) {
    console.error(
      "closing-view error:",
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

