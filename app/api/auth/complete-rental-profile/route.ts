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

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL

    const anonKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY

    if (
      !supabaseUrl ||
      !anonKey ||
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

    // =========================================================
    // 1. LEER SESIÓN DEL USUARIO
    // =========================================================

    const authorization =
      clean(
        request.headers.get(
          "authorization"
        )
      )

    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing session",
        },
        {
          status: 401,
        }
      )
    }

    const accessToken =
      authorization
        .slice(
          "Bearer ".length
        )
        .trim()

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing access token",
        },
        {
          status: 401,
        }
      )
    }

    const supabaseAuth =
      createClient(
        supabaseUrl,
        anonKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      )

    const {
      data:
        userData,

      error:
        userError,
    } =
      await supabaseAuth
        .auth
        .getUser(
          accessToken
        )

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid session",
        },
        {
          status: 401,
        }
      )
    }

    const user =
      userData.user

    // =========================================================
    // 2. METADATA CREADA POR ACTIVATE-RENTAL
    // =========================================================

    const metadata =
      user.user_metadata ||
      {}

    const leadId =
      clean(
        metadata.lead_id
      )

    const rentalId =
      clean(
        metadata.rental_id
      )

    const role =
      clean(
        metadata.role
      )

    const source =
      clean(
        metadata.source
      )

    if (
      source !==
      "rental_activation"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This account was not activated from a rental",
        },
        {
          status: 403,
        }
      )
    }

    if (
      !leadId ||
      !rentalId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing rental identity",
        },
        {
          status: 409,
        }
      )
    }

    if (
      role !==
        "tenant" &&
      role !==
        "owner"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid rental role",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 3. CLIENTE ADMIN
    // =========================================================

    const supabaseAdmin =
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

    // =========================================================
    // 4. VALIDAR ALQUILER
    // =========================================================

    const {
      data:
        rental,

      error:
        rentalError,
    } =
      await supabaseAdmin
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
          "id",
          rentalId
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

    const expectedLeadId =
      role ===
      "tenant"
        ? rental
            .tenant_lead_id
        : rental
            .owner_lead_id

    if (
      expectedLeadId !==
      leadId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Rental identity mismatch",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 5. CARGAR PERSONA ORIGINAL
    // =========================================================

    const {
      data:
        person,

      error:
        personError,
    } =
      await supabaseAdmin
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
          leadId
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

    const authEmail =
      clean(
        user.email
      ).toLowerCase()

    const leadEmail =
      clean(
        person.email
      ).toLowerCase()

    if (
      !authEmail ||
      !leadEmail ||
      authEmail !==
        leadEmail
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Authenticated email does not match rental email",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 6. EVITAR QUE OTRO AUTH.USER SE APROPIE DEL MISMO LEAD
    // =========================================================

    const {
      data:
        existingProfile,

      error:
        existingProfileError,
    } =
      await supabaseAdmin
        .from(
          "user_profiles"
        )
        .select(`
          user_id,
          lead_id
        `)
        .eq(
          "lead_id",
          leadId
        )
        .maybeSingle()

    if (
      existingProfileError
    ) {
      throw new Error(
        existingProfileError
          .message
      )
    }

    if (
      existingProfile &&
      existingProfile
        .user_id !==
        user.id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This rental identity is already linked to another user",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 7. CREAR / ACTUALIZAR PERFIL
    // =========================================================

    const {
      error:
        profileError,
    } =
      await supabaseAdmin
        .from(
          "user_profiles"
        )
        .upsert(
          {
            user_id:
              user.id,

            lead_id:
              leadId,

            full_name:
              clean(
                person
                  .full_name
              ) ||
              null,

            email:
              leadEmail,

            phone:
              clean(
                person
                  .phone_normalized ||
                person
                  .phone
              ) ||
              null,

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "user_id",
          }
        )

    if (
      profileError
    ) {
      throw new Error(
        profileError.message
      )
    }

    // =========================================================
    // 8. OK
    // =========================================================

    return NextResponse.json({
      ok: true,

      user_id:
        user.id,

      lead_id:
        leadId,

      rental_id:
        rentalId,

      role,
    })
  } catch (
    error
  ) {
    console.error(
      "complete-rental-profile error:",
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
