import {
  NextRequest,
  NextResponse,
} from "next/server"
import {
  createClient,
} from "@supabase/supabase-js"
import {
  sendPushToLead,
} from "@/lib/push"

export const runtime =
  "nodejs"

export const dynamic =
  "force-dynamic"

const ACTIVE_MATCH_STATUSES = [
  "new",
  "reviewed",
  "contacted",
]

const MIN_MATCH_SCORE = 80
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 200

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

async function postInternal(
  req: NextRequest,
  path: string,
  body: Record<string, unknown>
) {
  const response =
    await fetch(
      new URL(
        path,
        req.url
      ),
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            body
          ),
      }
    )

  const data =
    await response
      .json()
      .catch(
        () => null
      )

  return {
    ok:
      response.ok &&
      data?.ok !==
        false,

    status:
      response.status,

    data,
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,

    endpoint:
      "pilot-matches",

    source:
      "lead_matches",

    channel:
      "push",

    min_score:
      MIN_MATCH_SCORE,

    active_statuses:
      ACTIVE_MATCH_STATUSES,

    note:
      "Legacy endpoint kept for compatibility. Notifications are Push only.",
  })
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

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Faltan variables de Supabase",
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

    const send =
      body?.send ===
      true

    const requestedLeadIds =
      Array.isArray(
        body?.lead_ids
      )
        ? body.lead_ids
            .map(
              (
                value:
                  unknown
              ) =>
                clean(
                  value
                )
            )
            .filter(
              Boolean
            )
        : []

    const notifyRoles =
      Array.isArray(
        body?.notify_roles
      )
        ? new Set(
            body.notify_roles
              .map(
                (
                  value:
                    unknown
                ) =>
                  clean(
                    value
                  )
              )
              .filter(
                (
                  value:
                    string
                ) =>
                  value ===
                    "owner" ||
                  value ===
                    "tenant"
              )
          )
        : new Set([
            "owner",
            "tenant",
          ])

    const requestedLimit =
      Number(
        body?.limit ||
          DEFAULT_LIMIT
      )

    const limit =
      Math.min(
        Math.max(
          Number.isFinite(
            requestedLimit
          )
            ? requestedLimit
            : DEFAULT_LIMIT,
          1
        ),
        MAX_LIMIT
      )

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

    // =========================================================
    // 1. MATCHES REALES ACTIVOS
    // =========================================================

    let matchQuery =
      supabase
        .from(
          "lead_matches"
        )
        .select(`
          id,
          tenant_lead_id,
          owner_lead_id,
          score,
          status
        `)
        .gte(
          "score",
          MIN_MATCH_SCORE
        )
        .in(
          "status",
          ACTIVE_MATCH_STATUSES
        )
        .order(
          "score",
          {
            ascending:
              false,
          }
        )
        .limit(
          limit
        )

    const {
      data:
        matchesRaw,
      error:
        matchesError,
    } =
      await matchQuery

    if (
      matchesError
    ) {
      throw new Error(
        matchesError.message
      )
    }

    let matches =
      matchesRaw ||
      []

    if (
      requestedLeadIds.length >
      0
    ) {
      const wanted =
        new Set(
          requestedLeadIds
        )

      matches =
        matches.filter(
          (
            match
          ) =>
            wanted.has(
              clean(
                match
                  .tenant_lead_id
              )
            ) ||
            wanted.has(
              clean(
                match
                  .owner_lead_id
              )
            )
        )
    }

    if (
      matches.length ===
      0
    ) {
      return NextResponse.json({
        ok: true,
        send,
        matches_found:
          0,
        processed:
          0,
        results: [],
      })
    }

    // =========================================================
    // 2. OWNERS CON FOTO
    //
    // Tenant solo recibe aviso cuando la propiedad ya tiene
    // al menos una foto disponible.
    // =========================================================

    const ownerLeadIds =
      Array.from(
        new Set(
          matches.map(
            (
              match
            ) =>
              clean(
                match
                  .owner_lead_id
              )
          )
        )
      ).filter(
        Boolean
      )

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
        .select(
          "lead_id"
        )
        .in(
          "lead_id",
          ownerLeadIds
        )
        .eq(
          "media_type",
          "photo"
        )

    if (
      mediaError
    ) {
      throw new Error(
        mediaError.message
      )
    }

    const ownersWithPhoto =
      new Set(
        (
          mediaRows ||
          []
        )
          .map(
            (
              row
            ) =>
              clean(
                row.lead_id
              )
          )
          .filter(
            Boolean
          )
      )

    const results:
      Array<{
        role:
          "owner" |
          "tenant"
        lead_id:
          string
        match_count:
          number
        sent:
          boolean
        url:
          string | null
        reason?:
          string
      }> = []

    // =========================================================
    // 3. NOTIFICAR TENANTS
    // =========================================================

    if (
      notifyRoles.has(
        "tenant"
      )
    ) {
      const tenantMap =
        new Map<
          string,
          number
        >()

      for (
        const match
        of matches
      ) {
        const ownerLeadId =
          clean(
            match
              .owner_lead_id
          )

        if (
          !ownersWithPhoto.has(
            ownerLeadId
          )
        ) {
          continue
        }

        const tenantLeadId =
          clean(
            match
              .tenant_lead_id
          )

        tenantMap.set(
          tenantLeadId,
          (
            tenantMap.get(
              tenantLeadId
            ) ||
            0
          ) + 1
        )
      }

      for (
        const [
          tenantLeadId,
          matchCount,
        ]
        of Array.from(
          tenantMap.entries()
        )
      ) {
        const tokenResponse =
          await postInternal(
            req,
            "/api/tenant-matches-token",
            {
              tenant_lead_id:
                tenantLeadId,
            }
          )

        const matchesUrl =
          tokenResponse.ok
            ? clean(
                tokenResponse
                  .data
                  ?.matches_url
              ) ||
              null
            : null

        if (
          !matchesUrl
        ) {
          results.push({
            role:
              "tenant",
            lead_id:
              tenantLeadId,
            match_count:
              matchCount,
            sent:
              false,
            url:
              null,
            reason:
              "could_not_create_matches_url",
          })

          continue
        }

        if (
          !send
        ) {
          results.push({
            role:
              "tenant",
            lead_id:
              tenantLeadId,
            match_count:
              matchCount,
            sent:
              false,
            url:
              matchesUrl,
            reason:
              "dry_run",
          })

          continue
        }

        try {
          const pushResult =
            await sendPushToLead(
              tenantLeadId,
              {
                title:
                  "Verlo · Tenés matches",

                body:
                  matchCount ===
                  1
                    ? "Encontramos una propiedad compatible. Entrá para verla y completar tus datos."
                    : `Encontramos ${matchCount} propiedades compatibles. Entrá para verlas y completar tus datos.`,

                url:
                  matchesUrl,
              }
            )

          const sent =
            Number(
              (
                pushResult as {
                  sent?: number
                }
              )?.sent ||
                0
            ) >
            0

          results.push({
            role:
              "tenant",
            lead_id:
              tenantLeadId,
            match_count:
              matchCount,
            sent,
            url:
              matchesUrl,
          })
        } catch (
          pushError
        ) {
          console.error(
            "pilot tenant push error:",
            tenantLeadId,
            pushError
          )

          results.push({
            role:
              "tenant",
            lead_id:
              tenantLeadId,
            match_count:
              matchCount,
            sent:
              false,
            url:
              matchesUrl,
            reason:
              "push_error",
          })
        }
      }
    }

    // =========================================================
    // 4. NOTIFICAR OWNERS
    // =========================================================

    if (
      notifyRoles.has(
        "owner"
      )
    ) {
      const ownerMap =
        new Map<
          string,
          number
        >()

      for (
        const match
        of matches
      ) {
        const ownerLeadId =
          clean(
            match
              .owner_lead_id
          )

        ownerMap.set(
          ownerLeadId,
          (
            ownerMap.get(
              ownerLeadId
            ) ||
            0
          ) + 1
        )
      }

      for (
        const [
          ownerLeadId,
          matchCount,
        ]
        of Array.from(
          ownerMap.entries()
        )
      ) {
        const tokenResponse =
          await postInternal(
            req,
            "/api/owner-property-token",
            {
              owner_lead_id:
                ownerLeadId,
            }
          )

        const propertyUrl =
          tokenResponse.ok
            ? clean(
                tokenResponse
                  .data
                  ?.property_url
              ) ||
              null
            : null

        if (
          !propertyUrl
        ) {
          results.push({
            role:
              "owner",
            lead_id:
              ownerLeadId,
            match_count:
              matchCount,
            sent:
              false,
            url:
              null,
            reason:
              "could_not_create_property_url",
          })

          continue
        }

        if (
          !send
        ) {
          results.push({
            role:
              "owner",
            lead_id:
              ownerLeadId,
            match_count:
              matchCount,
            sent:
              false,
            url:
              propertyUrl,
            reason:
              "dry_run",
          })

          continue
        }

        try {
          const pushResult =
            await sendPushToLead(
              ownerLeadId,
              {
                title:
                  "Verlo · Tenés matches",

                body:
                  "Encontramos personas compatibles con tu propiedad. Completá la publicación y sumá fotos o videos para avanzar.",

                url:
                  propertyUrl,
              }
            )

          const sent =
            Number(
              (
                pushResult as {
                  sent?: number
                }
              )?.sent ||
                0
            ) >
            0

          results.push({
            role:
              "owner",
            lead_id:
              ownerLeadId,
            match_count:
              matchCount,
            sent,
            url:
              propertyUrl,
          })
        } catch (
          pushError
        ) {
          console.error(
            "pilot owner push error:",
            ownerLeadId,
            pushError
          )

          results.push({
            role:
              "owner",
            lead_id:
              ownerLeadId,
            match_count:
              matchCount,
            sent:
              false,
            url:
              propertyUrl,
            reason:
              "push_error",
          })
        }
      }
    }

    return NextResponse.json({
      ok: true,

      send,

      matches_found:
        matches.length,

      processed:
        results.length,

      notifications_sent:
        results.filter(
          (
            item
          ) =>
            item.sent
        ).length,

      results,
    })
  } catch (
    error
  ) {
    console.error(
      "pilot-matches error:",
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

