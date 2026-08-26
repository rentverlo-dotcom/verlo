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
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY

    const ghlWebhookUrl =
      clean(
        process.env
          .GHL_MATCH_ACTIVITY_WEBHOOK_URL
      )

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
      ].includes(role)
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

    let firstOpened = false

    // =========================================================
    // OWNER
    // /propiedad/[token]
    // =========================================================

    if (
      role ===
      "owner"
    ) {
      const {
        data:
          accessToken,
        error:
          tokenError,
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

      firstOpened =
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
          "owner link tracking error:",
          trackingError
        )
      }
    }

    // =========================================================
    // TENANT
    // /matches/[token]
    // =========================================================

    if (
      role ===
      "tenant"
    ) {
      const {
        data:
          accessToken,
        error:
          tokenError,
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

      /*
       * tenant-matches-view
       * YA registra:
       *
       * first_opened_at
       * last_opened_at
       * open_count
       *
       * Por eso NO volvemos
       * a incrementar acá.
       */

      firstOpened =
        !accessToken
          .first_opened_at
    }

    if (
      !leadId
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
    // DATOS DEL LEAD
    // =========================================================

    const {
      data: lead,
      error: leadError,
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
    // AVISO A GHL
    // NO bloqueamos la UX si GHL falla.
    // =========================================================

    let ghlSent =
      false

    if (
      ghlWebhookUrl
    ) {
      try {
        const ghlResponse =
          await fetch(
            ghlWebhookUrl,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    event:
                      "verlo_match_link_opened",

                    role,

                    tag:
                      role ===
                      "owner"
                        ? "verlo_match_clicked_owner"
                        : "verlo_match_clicked_tenant",

                    lead_id:
                      lead.id,

                    full_name:
                      lead.full_name,

                    email:
                      lead.email,

                    phone:
                      lead
                        .phone_normalized ||
                      lead.phone,

                    token_type:
                      role ===
                      "owner"
                        ? "owner_property"
                        : "tenant_matches",

                    first_open:
                      firstOpened,

                    opened_at:
                      openedAt,

                    source:
                      "verlo_private_link",
                  }
                ),
            }
          )

        ghlSent =
          ghlResponse.ok

        if (
          !ghlResponse.ok
        ) {
          const text =
            await ghlResponse
              .text()
              .catch(
                () => ""
              )

          console.error(
            "GHL match activity webhook error:",
            ghlResponse.status,
            text
          )
        }
      } catch (
        error
      ) {
        console.error(
          "GHL match activity webhook exception:",
          error
        )
      }
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        ok: true,

        role,

        lead_id:
          lead.id,

        tag:
          role ===
          "owner"
            ? "verlo_match_clicked_owner"
            : "verlo_match_clicked_tenant",

        opened_at:
          openedAt,

        ghl_sent:
          ghlSent,
      }
    )
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
