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
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
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

    const body =
      await request
        .json()
        .catch(
          () => ({})
        )

    const leadId =
      clean(
        body?.lead_id
      )

    if (!leadId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing lead_id",
        },
        {
          status: 400,
        }
      )
    }

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
    // 1. BUSCAR LEAD REAL
    // =========================================================

    const {
      data:
        lead,

      error:
        leadError,
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
          phone_normalized,
          role,
          intent
        `)
        .eq(
          "id",
          leadId
        )
        .single()

    if (
      leadError ||
      !lead
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Lead not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 2. EMAIL
    // =========================================================

    const email =
      clean(
        lead.email
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
            "El registro no tiene un email válido.",
        },
        {
          status: 409,
        }
      )
    }

    const role =
      clean(
        lead.role
      )

    if (
      role !== "tenant" &&
      role !== "owner" &&
      role !== "both"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid lead role",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 3. ENVIAR MAGIC LINK
    //
    // ESTE EMAIL:
    // - verifica el email
    // - crea/reutiliza auth.users
    // - inicia sesión
    // - luego callback vincula auth.user ↔ lead_id
    // =========================================================

    const {
      error:
        authError,
    } =
      await supabaseAdmin
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
                  lead
                    .full_name
                ),

              phone:
                clean(
                  lead
                    .phone_normalized ||
                  lead
                    .phone
                ),

              role,

              intent:
                clean(
                  lead.intent
                ),

              lead_id:
                lead.id,

              source:
                "lead_activation",
            },
          },
        })

    if (
      authError
    ) {
      console.error(
        "activate lead magic link error:",
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
    // 4. EMAIL ENMASCARADO PARA MOSTRAR EN SUCCESS
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

    // =========================================================
    // 5. OK
    // =========================================================

    return NextResponse.json({
      ok: true,

      lead_id:
        lead.id,

      email:
        maskedEmail,

      role,

      message:
        "Te enviamos un enlace seguro para entrar a Mi Verlo.",
    })
  } catch (
    error
  ) {
    console.error(
      "activate-lead error:",
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
