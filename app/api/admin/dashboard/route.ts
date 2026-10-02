import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  createClient,
} from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ADMIN_EMAILS = new Set([
  "juanoddone29@gmail.com",
  "juanmanueloddone74@gmail.com",
])

const E2E_EMAILS = [
  "juanoddone29@gmail.com",
  "juanmanueloddone74@gmail.com",
  "lalito030217@gmail.com",
  "aedevincenzi@gmail.com",
  "licpuentegarat@gmail.com",
  "memo.oddone@gmail.com",
  "hugo_gaston@hotmail.com",
  "walter@wnavarrete.com",
"johi.pirrello@gmail.com",
]

function clean(value: unknown) {
  return String(value || "").trim()
}

function asInList(ids: string[]) {
  return "(" + ids.join(",") + ")"
}

export async function GET(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing configuration",
        },
        { status: 500 }
      )
    }

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
          error: "Missing session",
        },
        { status: 401 }
      )
    }

    const accessToken =
      authorization
        .slice(
          "Bearer ".length
        )
        .trim()

    const supabaseAuth =
      createClient(
        supabaseUrl,
        anonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )

    const {
      data: userData,
      error: userError,
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
          error: "Invalid session",
        },
        { status: 401 }
      )
    }

    const adminEmail =
      clean(
        userData.user.email
      ).toLowerCase()

    if (
      !ADMIN_EMAILS.has(
        adminEmail
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden",
        },
        { status: 403 }
      )
    }

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )

    const mode =
      clean(
        request.nextUrl
          .searchParams
          .get("mode")
      ) || "all"

    const {
      data: e2eLeadRows,
      error: e2eError,
    } =
      await supabase
        .from("lead_intake")
        .select("id,email")
        .in(
          "email",
          E2E_EMAILS
        )

    if (e2eError) {
      throw e2eError
    }

    const e2eIds =
      (
        e2eLeadRows || []
      )
        .map(
          row => clean(row.id)
        )
        .filter(Boolean)

    const applyLeadMode =
      (query: any) => {
        if (
          mode === "e2e"
        ) {
          return query.in(
            "id",
            e2eIds.length
              ? e2eIds
              : ["00000000-0000-0000-0000-000000000000"]
          )
        }

        if (
          mode === "production" &&
          e2eIds.length
        ) {
          return query.not(
            "id",
            "in",
            asInList(e2eIds)
          )
        }

        return query
      }

    const applyMatchMode =
      (query: any) => {
        if (
          mode === "e2e"
        ) {
          const ids =
            e2eIds.length
              ? asInList(e2eIds)
              : "(00000000-0000-0000-0000-000000000000)"

          return query
            .filter(
              "tenant_lead_id",
              "in",
              ids
            )
            .filter(
              "owner_lead_id",
              "in",
              ids
            )
        }

        if (
          mode === "production" &&
          e2eIds.length
        ) {
          const ids =
            asInList(e2eIds)

          return query
            .not(
              "tenant_lead_id",
              "in",
              ids
            )
            .not(
              "owner_lead_id",
              "in",
              ids
            )
        }

        return query
      }

    const applyNotificationMode =
      (query: any) => {
        if (
          mode === "e2e"
        ) {
          return query.in(
            "lead_id",
            e2eIds.length
              ? e2eIds
              : ["00000000-0000-0000-0000-000000000000"]
          )
        }

        if (
          mode === "production" &&
          e2eIds.length
        ) {
          return query.not(
            "lead_id",
            "in",
            asInList(e2eIds)
          )
        }

        return query
      }

    const countQuery =
      async (
        table: string,
        apply:
          (query: any) => any
      ) => {
        let query =
          supabase
            .from(table)
            .select(
              "id",
              {
                count: "exact",
                head: true,
              }
            )

        query =
          apply(query)

        const {
          count,
          error,
        } =
          await query

        if (error) {
          throw error
        }

        return count || 0
      }

    const [
      leadsTotal,
      matchesTotal,
      notificationTotal,
      notificationSent,
      notificationFailed,
      contractsTotal,
      rentalsTotal,
    ] =
      await Promise.all([
        countQuery(
          "lead_intake",
          applyLeadMode
        ),

        countQuery(
          "lead_matches",
          applyMatchMode
        ),

        countQuery(
          "lead_notification_events",
          applyNotificationMode
        ),

        (async () => {
          let q =
            supabase
              .from(
                "lead_notification_events"
              )
              .select(
                "id",
                {
                  count: "exact",
                  head: true,
                }
              )
              .eq(
                "status",
                "sent"
              )

          q =
            applyNotificationMode(q)

          const {
            count,
            error,
          } =
            await q

          if (error) throw error

          return count || 0
        })(),

        (async () => {
          let q =
            supabase
              .from(
                "lead_notification_events"
              )
              .select(
                "id",
                {
                  count: "exact",
                  head: true,
                }
              )
              .eq(
                "status",
                "failed"
              )

          q =
            applyNotificationMode(q)

          const {
            count,
            error,
          } =
            await q

          if (error) throw error

          return count || 0
        })(),

        countQuery(
          "lead_contracts",
          query => query
        ),

        countQuery(
          "rentals",
          query => query
        ),
      ])

    let recentLeadsQuery =
      supabase
        .from("lead_intake")
        .select(`
          id,
          created_at,
          full_name,
          email,
          phone_normalized,
          role,
          intent,
          zone,
          neighborhood_slug,
          property_type,
          desired_property_type,
          property_rooms,
          desired_rooms,
          lead_quality
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(60)

    recentLeadsQuery =
      applyLeadMode(
        recentLeadsQuery
      )

    const {
      data: recentLeads,
      error: leadsError,
    } =
      await recentLeadsQuery

    if (leadsError) {
      throw leadsError
    }

    let recentMatchesQuery =
      supabase
        .from("lead_matches")
        .select(`
          id,
          created_at,
          tenant_lead_id,
          owner_lead_id,
          score,
          status,
          tenant_interest_at,
          tenant_verified_at,
          owner_interest_at,
          ready_to_connect_at,
          tenant_post_visit_decision,
          owner_post_visit_decision
        `)
        .gte(
          "score",
          80
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(100)

    recentMatchesQuery =
      applyMatchMode(
        recentMatchesQuery
      )

    const {
      data: recentMatches,
      error: matchesError,
    } =
      await recentMatchesQuery

    if (matchesError) {
      throw matchesError
    }

    const relatedLeadIds =
      Array.from(
        new Set(
          (
            recentMatches || []
          )
            .flatMap(
              match => [
                clean(
                  match.tenant_lead_id
                ),
                clean(
                  match.owner_lead_id
                ),
              ]
            )
            .filter(Boolean)
        )
      )

    const {
      data: relatedLeads,
      error: relatedError,
    } =
      relatedLeadIds.length
        ? await supabase
            .from(
              "lead_intake"
            )
            .select(`
              id,
              full_name,
              email,
              role,
              zone,
              neighborhood_slug,
              property_type,
              desired_property_type,
              property_rooms,
              desired_rooms
            `)
            .in(
              "id",
              relatedLeadIds
            )
        : {
            data: [],
            error: null,
          }

    if (relatedError) {
      throw relatedError
    }

    const leadMap =
      new Map(
        (
          relatedLeads || []
        ).map(
          lead => [
            lead.id,
            lead,
          ]
        )
      )

    const matches =
      (
        recentMatches || []
      ).map(
        match => ({
          ...match,

          tenant:
            leadMap.get(
              match.tenant_lead_id
            ) || null,

          owner:
            leadMap.get(
              match.owner_lead_id
            ) || null,
        })
      )

    let notificationsQuery =
      supabase
        .from(
          "lead_notification_events"
        )
        .select(`
          id,
          event_type,
          lead_id,
          entity_type,
          entity_id,
          title,
          url,
          status,
          sent_at,
          last_error,
          updated_at
        `)
        .order(
          "updated_at",
          {
            ascending: false,
          }
        )
        .limit(100)

    notificationsQuery =
      applyNotificationMode(
        notificationsQuery
      )

    const {
      data: notifications,
      error: notificationsError,
    } =
      await notificationsQuery

    if (notificationsError) {
      throw notificationsError
    }

    const notificationLeadIds =
      Array.from(
        new Set(
          (
            notifications || []
          )
            .map(
              row =>
                clean(
                  row.lead_id
                )
            )
            .filter(Boolean)
        )
      )

    const {
      data: notificationLeads,
      error:
        notificationLeadsError,
    } =
      notificationLeadIds.length
        ? await supabase
            .from(
              "lead_intake"
            )
            .select(
              "id,full_name,email"
            )
            .in(
              "id",
              notificationLeadIds
            )
        : {
            data: [],
            error: null,
          }

    if (
      notificationLeadsError
    ) {
      throw notificationLeadsError
    }

    const notificationLeadMap =
      new Map(
        (
          notificationLeads || []
        ).map(
          lead => [
            lead.id,
            lead,
          ]
        )
      )

    const notificationRows =
      (
        notifications || []
      ).map(
        event => ({
          ...event,

          lead:
            notificationLeadMap.get(
              event.lead_id
            ) || null,
        })
      )

    let pushQuery =
      supabase
        .from(
          "push_subscriptions"
        )
        .select(`
          id,
          lead_id,
          role,
          user_agent,
          created_at,
          updated_at,
          revoked_at
        `)
        .is(
          "revoked_at",
          null
        )
        .order(
          "updated_at",
          {
            ascending: false,
          }
        )
        .limit(100)

    pushQuery =
      applyNotificationMode(
        pushQuery
      )

    const {
      data: pushSubscriptions,
      error: pushError,
    } =
      await pushQuery

    if (pushError) {
      throw pushError
    }

    const funnel = {
      matches:
        matchesTotal,

      tenant_interest:
        matches.filter(
          m =>
            Boolean(
              m.tenant_interest_at
            )
        ).length,

      tenant_verified:
        matches.filter(
          m =>
            Boolean(
              m.tenant_verified_at
            )
        ).length,

      owner_interest:
        matches.filter(
          m =>
            Boolean(
              m.owner_interest_at
            )
        ).length,

      ready:
        matches.filter(
          m =>
            Boolean(
              m.ready_to_connect_at
            )
        ).length,

      post_visit_double_ok:
        matches.filter(
          m =>
            m.tenant_post_visit_decision ===
              "yes" &&
            m.owner_post_visit_decision ===
              "yes"
        ).length,
    }

    return NextResponse.json({
      ok: true,

      mode,

      generated_at:
        new Date()
          .toISOString(),

      summary: {
        leads:
          leadsTotal,

        matches:
          matchesTotal,

        notifications:
          notificationTotal,

        push_sent:
          notificationSent,

        push_failed:
          notificationFailed,

        push_active:
          (
            pushSubscriptions ||
            []
          ).length,

        contracts:
          contractsTotal,

        rentals:
          rentalsTotal,
      },

      funnel,

      leads:
        recentLeads || [],

      matches,

      notifications:
        notificationRows,

      push_subscriptions:
        pushSubscriptions || [],
    })
  } catch (error) {
    console.error(
      "admin dashboard error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Unexpected error",
      },
      {
        status: 500,
      }
    )
  }
}
