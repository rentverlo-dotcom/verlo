import {
  NextRequest,
  NextResponse,
} from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Role = "owner" | "tenant"

const GHL_BASE_URL =
  "https://services.leadconnectorhq.com"

const DEFAULT_GHL_LOCATION_ID =
  "cvNj4z9CkErHpF9tD4BE"

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

function normalizePhone(
  value: string
) {
  return value.replace(
    /\D/g,
    ""
  )
}

async function findGhlContact({
  token,
  locationId,
  phone,
  email,
}: {
  token: string
  locationId: string
  phone: string | null
  email: string | null
}) {
  const queries = [
    phone,
    email,
  ].filter(
    (
      value
    ): value is string =>
      Boolean(
        value &&
          value.trim()
      )
  )

  for (
    const query of queries
  ) {
    const url =
      new URL(
        `${GHL_BASE_URL}/contacts/`
      )

    url.searchParams.set(
      "locationId",
      locationId
    )

    url.searchParams.set(
      "query",
      query
    )

    url.searchParams.set(
      "limit",
      "20"
    )

    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,

            Version:
              "2023-02-21",
          },

          cache:
            "no-store",
        }
      )

    if (
      !response.ok
    ) {
      const text =
        await response
          .text()
          .catch(
            () => ""
          )

      console.error(
        "GHL contact search error:",
        response.status,
        text
      )

      continue
    }

    const data =
      await response
        .json()
        .catch(
          () => null
        )

    const contacts =
      Array.isArray(
        data?.contacts
      )
        ? data.contacts
        : []

    if (
      contacts.length ===
      0
    ) {
      continue
    }

    const normalizedPhone =
      phone
        ? normalizePhone(
            phone
          )
        : ""

    const normalizedEmail =
      email
        ? email
            .trim()
            .toLowerCase()
        : ""

    const exact =
      contacts.find(
        (
          contact: any
        ) => {
          const ghlPhone =
            normalizePhone(
              clean(
                contact?.phone
              )
            )

          const ghlEmail =
            clean(
              contact?.email
            ).toLowerCase()

          const phoneMatches =
            Boolean(
              normalizedPhone &&
                ghlPhone &&
                normalizedPhone ===
                  ghlPhone
            )

          const emailMatches =
            Boolean(
              normalizedEmail &&
                ghlEmail &&
                normalizedEmail ===
                  ghlEmail
            )

          return (
            phoneMatches ||
            emailMatches
          )
        }
      )

    if (
      exact?.id
    ) {
      return exact
    }

    /*
     * Si GHL devolvió un único
     * resultado para esa búsqueda,
     * lo usamos.
     */
    if (
      contacts.length ===
        1 &&
      contacts[0]?.id
    ) {
      return contacts[0]
    }
  }

  return null
}

async function addGhlTag({
  token,
  contactId,
  tag,
}: {
  token: string
  contactId: string
  tag: string
}) {
  const response =
    await fetch(
      `${GHL_BASE_URL}/contacts/${encodeURIComponent(
        contactId
      )}/tags`,
      {
        method: "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,

          Version:
            "v3",
        },

        body:
          JSON.stringify({
            tags: [
              tag,
            ],
          }),
      }
    )

  if (
    !response.ok
  ) {
    const text =
      await response
        .text()
        .catch(
          () => ""
        )

    throw new Error(
      `GHL add tag failed ${response.status}: ${text}`
    )
  }

  return true
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

    const ghlToken =
      clean(
        process.env
          .GHL_PRIVATE_INTEGRATION_TOKEN
      )

    const ghlLocationId =
      clean(
        process.env
          .GHL_LOCATION_ID
      ) ||
      DEFAULT_GHL_LOCATION_ID

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

    if (
      !ghlToken
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing GHL_PRIVATE_INTEGRATION_TOKEN",
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

      /*
       * tenant-matches-view
       * YA actualiza:
       *
       * first_opened_at
       * last_opened_at
       * open_count
       *
       * Acá NO incrementamos
       * otra vez para evitar
       * contar doble.
       */

      firstOpen =
        !accessToken
          .first_opened_at
    }

    // =========================================================
    // LEAD
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
          full_name,
          email,
          phone,
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
    // TAG
    // =========================================================

    const tag =
      role ===
      "owner"
        ? "verlo_match_clicked_owner"
        : "verlo_match_clicked_tenant"

    // =========================================================
    // BUSCAR CONTACTO EN GHL
    // =========================================================

    let ghlContactId:
      | string
      | null = null

    let ghlTagged =
      false

    try {
      const contact =
        await findGhlContact({
          token:
            ghlToken,

          locationId:
            ghlLocationId,

          phone:
            clean(
              lead.phone
            ) ||
            null,

          email:
            clean(
              lead.email
            ) ||
            null,
        })

      if (
        contact?.id
      ) {
        ghlContactId =
          String(
            contact.id
          )

        await addGhlTag({
          token:
            ghlToken,

          contactId:
            ghlContactId,

          tag,
        })

        ghlTagged =
          true
      } else {
        console.error(
          "GHL contact not found for lead:",
          lead.id,
          lead.phone,
          lead.email
        )
      }
    } catch (
      error
    ) {
      /*
       * IMPORTANTE:
       * si GHL falla,
       * NO rompemos la página.
       *
       * Supabase sigue siendo
       * source of truth.
       */
      console.error(
        "GHL tagging error:",
        error
      )
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      role,

      lead_id:
        lead.id,

      tag,

      opened_at:
        openedAt,

      first_open:
        firstOpen,

      ghl_contact_id:
        ghlContactId,

      ghl_tagged:
        ghlTagged,
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
