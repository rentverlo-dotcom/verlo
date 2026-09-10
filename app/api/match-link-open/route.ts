import {
  NextRequest,
  NextResponse,
} from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Role =
  | "owner"
  | "tenant"

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

export async function POST(
  req: NextRequest
) {
  try {
    // =========================================================
    // CONFIG
    // =========================================================

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
            "Missing Supabase configuration",
        },
        {
          status: 500,
        }
      )
    }

    // =========================================================
    // BODY
    // =========================================================

    const body =
      await req
        .json()
        .catch(
          () => ({})
        )

    const token =
      clean(
        body?.token
      )

    const role =
      clean(
        body?.role
      ) as Role

    if (
      !token ||
      ![
        "owner",
        "tenant",
      ].includes(
        role
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid request",
        },
        {
          status: 400,
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

    const openedAt =
      new Date()
        .toISOString()

    let leadId:
      | string
      | null = null

    let firstOpen =
      false

    // =========================================================
    // OWNER
    // /propiedad/[token]
    //
    // Acá sí registramos:
    // - first_opened_at
    // - last_opened_at
    // - open_count
    // =========================================================

    if (
      role ===
      "owner"
    ) {
      const {
        data:
          accessToken,
        error:
          accessError,
      } =
        await supabase
          .from(
            "owner_property_access_tokens"
          )
          .select(`
            id,
            owner_lead_id,
            expires_at,
            revoked_at,
            first_opened_at,
            open_count
          `)
          .eq(
            "token",
            token
          )
          .single()

      if (
        accessError ||
        !accessToken
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Invalid owner token",
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
              "Token expired",
          },
          {
            status: 403,
          }
        )
      }

      leadId =
        accessToken
          .owner_lead_id

      firstOpen =
        !accessToken
          .first_opened_at

      const {
        error:
          trackingError,
      } =
        await supabase
          .from(
            "owner_property_access_tokens"
          )
          .update({
            first_opened_at:
              accessToken
                .first_opened_at ||
              openedAt,

            last_opened_at:
              openedAt,

            open_count:
              Number(
                accessToken
                  .open_count ||
                  0
              ) + 1,
          })
          .eq(
            "id",
            accessToken.id
          )

      if (
        trackingError
      ) {
        console.error(
          "owner open tracking error:",
          trackingError
        )
      }
    }

    // =========================================================
    // TENANT
    // /matches/[token]
    //
    // tenant-matches-view ya registra:
    // - first_opened_at
    // - last_opened_at
    // - open_count
    //
    // Acá NO incrementamos de nuevo.
    // =========================================================

    if (
      role ===
      "tenant"
    ) {
      const {
        data:
          accessToken,
        error:
          accessError,
      } =
        await supabase
          .from(
            "tenant_matches_access_tokens"
          )
          .select(`
            id,
            tenant_lead_id,
            expires_at,
            revoked_at,
            first_opened_at
          `)
          .eq(
            "token",
            token
          )
          .single()

      if (
        accessError ||
        !accessToken
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Invalid tenant token",
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
              "Token expired",
          },
          {
            status: 403,
          }
        )
      }

      leadId =
        accessToken
          .tenant_lead_id

      firstOpen =
        !accessToken
          .first_opened_at
    }

    // =========================================================
    // VALIDAR LEAD
    // =========================================================

    if (
      !leadId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Lead ID missing",
        },
        {
          status: 404,
        }
      )
    }

    const {
      data: lead,
      error:
        leadError,
    } =
      await supabase
        .from(
          "lead_intake"
        )
        .select(`
          id,
          role
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
    // RESPONSE
    //
    // Sin GHL.
    // Supabase queda como única fuente de verdad.
    // =========================================================

    return NextResponse.json({
      ok: true,

      role,

      lead_id:
        lead.id,

      opened_at:
        openedAt,

      first_open:
        firstOpen,
    })
  } catch (
    error
  ) {
    console.error(
      "match-link-open error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Unexpected server error",
      },
      {
        status: 500,
      }
    )
  }
}

