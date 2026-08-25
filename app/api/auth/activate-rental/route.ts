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

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
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
    // 1. VALIDAR TOKEN PRIVADO DEL CIERRE
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
            "Invalid role",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 2. CONTRATO DEBE ESTAR COMPLETAMENTE CERRADO
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
          tenant_lead_id,
          owner_lead_id,
          status,
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
            "Invalid contract party",
        },
        {
          status: 403,
        }
      )
    }

    if (
      contract.status !==
        "agreed" ||
      !contract
        .tenant_agreed_at ||
      !contract
        .owner_agreed_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Contract is not closed yet",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 3. DEBE EXISTIR EL ALQUILER ACTIVO
    // =========================================================

    const {
      data:
        rental,

      error:
        rentalError,
    } =
      await supabase
        .from(
          "rentals"
        )
        .select(`
          id,
          tenant_lead_id,
          owner_lead_id,
          status
        `)
        .eq(
          "lead_contract_id",
          contract.id
        )
        .single()

    if (
      rentalError ||
      !rental
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Rental not found",
        },
        {
          status: 404,
        }
      )
    }

    if (
      rental.status !==
        "active"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Rental is not active",
        },
        {
          status: 409,
        }
      )
    }

    const rentalLeadId =
      accessToken.role ===
      "tenant"
        ? rental
            .tenant_lead_id
        : rental
            .owner_lead_id

    if (
      rentalLeadId !==
      accessToken
        .lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Rental party mismatch",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 4. DATOS REALES DE LA PERSONA
    // =========================================================

    const {
      data:
        person,

      error:
        personError,
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
          phone_normalized
        `)
        .eq(
          "id",
          accessToken
            .lead_id
        )
        .single()

    if (
      personError ||
      !person
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Person not found",
        },
        {
          status: 404,
        }
      )
    }

    const email =
      clean(
        person.email
      )
        .toLowerCase()

    if (
      !isValidEmail(
        email
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No valid email available for this user",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 5. ENVIAR MAGIC LINK
    // =========================================================

    const {
      error:
        authError,
    } =
      await supabase
        .auth
        .signInWithOtp({
          email,

          options: {
            shouldCreateUser:
              true,

            emailRedirectTo:
              "https://verlo.lat/auth/callback",

            data: {
              full_name:
                clean(
                  person
                    .full_name
                ),

              phone:
                clean(
                  person
                    .phone_normalized ||
                  person
                    .phone
                ),

              role:
                accessToken
                  .role,

              lead_id:
                accessToken
                  .lead_id,

              rental_id:
                rental.id,

              source:
                "rental_activation",
            },
          },
        })

    if (
      authError
    ) {
      console.error(
        "rental activation magic link error:",
        authError
      )

      return NextResponse.json(
        {
          ok: false,
          error:
            authError.message,
        },
        {
          status: 500,
        }
      )
    }

    // =========================================================
    // 6. RESPONSE
    // =========================================================

    const maskedEmail =
      email.replace(
        /^(.{1,2})(.*)(@.*)$/,
        (
          _match,
          start,
          middle,
          end
        ) =>
          `${start}${"*".repeat(
            Math.min(
              String(
                middle
              ).length,
              6
            )
          )}${end}`
      )

    return NextResponse.json({
      ok: true,

      email:
        maskedEmail,

      role:
        accessToken.role,

      rental_id:
        rental.id,
    })
  } catch (
    error
  ) {
    console.error(
      "activate-rental error:",
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
