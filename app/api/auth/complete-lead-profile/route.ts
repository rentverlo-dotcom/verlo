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
    // 1. LEER SESIÓN SUPABASE
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
    // 2. LEER IDENTIDAD DEL MAGIC LINK
    // =========================================================

    const metadata =
      user.user_metadata ||
      {}

    const leadId =
      clean(
        metadata.lead_id
      )

    const source =
      clean(
        metadata.source
      )

    if (
      source !==
      "lead_activation"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid activation source",
        },
        {
          status: 403,
        }
      )
    }

    if (!leadId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing lead identity",
        },
        {
          status: 409,
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
    // 4. BUSCAR LEAD ORIGINAL
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
    // 5. VERIFICAR QUE EL EMAIL AUTENTICADO SEA EL DEL LEAD
    // =========================================================

    const authEmail =
      clean(
        user.email
      )
        .toLowerCase()

    const leadEmail =
      clean(
        lead.email
      )
        .toLowerCase()

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
            "Authenticated email does not match lead email",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 6. EVITAR QUE OTRO AUTH USER TOME ESTE LEAD
    // =========================================================

    const {
      data:
        profileForLead,

      error:
        profileForLeadError,
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
      profileForLeadError
    ) {
      throw new Error(
        profileForLeadError
          .message
      )
    }

    if (
      profileForLead &&
      profileForLead
        .user_id !==
        user.id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This lead is already linked to another user",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 7. VER SI ESTE AUTH USER YA ESTÁ VINCULADO
    // =========================================================

    const {
      data:
        profileForUser,

      error:
        profileForUserError,
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
          "user_id",
          user.id
        )
        .maybeSingle()

    if (
      profileForUserError
    ) {
      throw new Error(
        profileForUserError
          .message
      )
    }

    if (
      profileForUser &&
      profileForUser
        .lead_id !==
        leadId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This user is already linked to another lead",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 8. CREAR / ACTUALIZAR user_profiles
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
              lead.id,

            full_name:
              clean(
                lead.full_name
              ) ||
              null,

            email:
              leadEmail,

            phone:
              clean(
                lead
                  .phone_normalized ||
                lead
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
    // 9. OK
    // =========================================================

    return NextResponse.json({
      ok: true,

      user_id:
        user.id,

      lead_id:
        lead.id,

      role:
        lead.role,

      intent:
        lead.intent,
    })
  } catch (
    error
  ) {
    console.error(
      "complete-lead-profile error:",
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
