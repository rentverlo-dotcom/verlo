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

const GHL_PILOT_MATCH_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/cvNj4z9CkErHpF9tD4BE/webhook-trigger/295302fb-a1ee-459e-a075-ec639b80177d"

const ACTIVE_MATCH_STATUSES = [
  "new",
  "reviewed",
  "contacted",
]

const MIN_MATCH_SCORE = 80
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 200

// ============================================================
// TEMPORAL E2E
//
// ESTA ES LA ÚNICA DIFERENCIA ENTRE E2E Y PRODUCCIÓN.
//
// Cuando terminemos correctamente el E2E,
// eliminamos este Set + el .filter correspondiente.
//
// NO cambia ninguna otra parte de la arquitectura.
// ============================================================

const E2E_ALLOWED_PHONES =
  new Set([
    "5491156906473", // Guillermo
    "5491133614865", // Juan Manuel
  ])

type MatchRow = {
  id: string

  tenant_lead_id:
    string

  owner_lead_id:
    string

  score:
    number | string

  status:
    string

  reasons:
    Record<
      string,
      any
    > | null
}

type LeadRow = {
  id: string

  full_name:
    string | null

  email:
    string | null

  phone:
    string | null

  phone_normalized:
    string | null

  role:
    string | null

  intent:
    string | null

  lead_quality:
    string | null
}

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

function normalizeEmail(
  value: unknown
) {
  return clean(
    value
  ).toLowerCase()
}

function normalizePhone(
  value: unknown
) {
  return clean(
    value
  ).replace(
    /\D/g,
    ""
  )
}

function firstName(
  value: unknown
) {
  return (
    clean(value)
      .split(/\s+/)[0] ||
    ""
  )
}

function money(
  value: unknown
) {
  const n =
    Number(
      value || 0
    )

  if (
    !Number.isFinite(n) ||
    n <= 0
  ) {
    return ""
  }

  return `$ ${Math.round(
    n
  ).toLocaleString(
    "es-AR"
  )}`
}

function roleFromLead(
  lead: LeadRow
) {
  if (
    lead.intent ===
    "owner_new_listing"
  ) {
    return "owner"
  }

  if (
    lead.intent ===
    "tenant_search"
  ) {
    return "tenant"
  }

  return lead.role
}

function contactKey(
  lead: LeadRow,
  role: string
) {
  const email =
    normalizeEmail(
      lead.email
    )

  if (email) {
    return `${role}|email:${email}`
  }

  const phone =
    normalizePhone(
      lead.phone_normalized ||
        lead.phone
    )

  if (phone) {
    return `${role}|phone:${phone}`
  }

  return `${role}|lead:${lead.id}`
}

function buildMatchFields(
  role: string,
  matches: MatchRow[]
) {
  const ordered = [
    ...matches,
  ].sort(
    (
      a,
      b
    ) =>
      Number(
        b.score || 0
      ) -
      Number(
        a.score || 0
      )
  )

  const best =
    ordered[0] ||
    null

  const reasons =
    best?.reasons ||
    {}

  const matches100 =
    ordered.filter(
      (match) =>
        Number(
          match.score
        ) === 100
    ).length

  const matches80 =
    ordered.filter(
      (match) =>
        Number(
          match.score
        ) === 80
    ).length

  const bestZone =
    role === "owner"
      ? reasons
          .matched_tenant_neighborhood ||
        reasons
          .owner_neighborhood_slug ||
        ""
      : reasons
          .owner_neighborhood_slug ||
        reasons
          .matched_tenant_neighborhood ||
        ""

  const bestTiming =
    role === "owner"
      ? reasons
          .tenant_move_timing ||
        ""
      : reasons
          .owner_availability_status ||
        ""

  const bestPropertyType =
    role === "owner"
      ? reasons
          .tenant_type ||
        ""
      : reasons
          .owner_type ||
        ""

  const bestRooms =
    role === "owner"
      ? reasons
          .tenant_rooms ||
        ""
      : reasons
          .owner_rooms ||
        ""

  const bestPrice =
    role === "owner"
      ? money(
          reasons
            .tenant_budget_max
        )
      : money(
          reasons
            .owner_price
        )

  const matchesOn:
    string[] = []

  if (
    reasons
      .neighborhood_ok
  ) {
    matchesOn.push(
      "zona"
    )
  }

  if (
    reasons.type_ok
  ) {
    matchesOn.push(
      "tipo de propiedad"
    )
  }

  if (
    reasons.rooms_ok
  ) {
    matchesOn.push(
      "ambientes"
    )
  }

  if (
    reasons.price_ok
  ) {
    matchesOn.push(
      "presupuesto"
    )
  }

  if (
    reasons.time_ok
  ) {
    matchesOn.push(
      "momento de mudanza"
    )
  }

  return {
    verlo_match_count:
      ordered.length,

    verlo_match_100_count:
      matches100,

    verlo_match_80_count:
      matches80,

    verlo_best_match_score:
      best
        ? Number(
            best.score
          )
        : 0,

    verlo_best_zone:
      bestZone,

    verlo_best_timing:
      bestTiming,

    verlo_best_property_type:
      bestPropertyType,

    verlo_best_rooms:
      bestRooms,

    verlo_best_price:
      bestPrice,

    verlo_best_matches_on:
      matchesOn.join(
        ", "
      ),

    verlo_match_summary:
      `${matches100} matches al 100% y ${matches80} matches al 80%`,

    verlo_match_role:
      role,

    verlo_match_updated_at:
      new Date()
        .toISOString(),
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,

    endpoint:
      "pilot-matches",

    source:
      "lead_matches",

    min_score:
      MIN_MATCH_SCORE,

    active_statuses:
      ACTIVE_MATCH_STATUSES,

    default_limit:
      DEFAULT_LIMIT,

    e2e_mode:
      true,

    e2e_allowed_phones:
      Array.from(
        E2E_ALLOWED_PHONES
      ),

    note:
      "POST con { send: true } para enviar a GHL. Sin send:true funciona como dry-run.",
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
    // 1. MATCHES REALES ACTUALES
    // =========================================================

    const {
      data:
        matchesRaw,

      error:
        matchesError,
    } =
      await supabase
        .from(
          "lead_matches"
        )
        .select(`
          id,
          tenant_lead_id,
          owner_lead_id,
          score,
          status,
          reasons
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

    if (
      matchesError
    ) {
      throw new Error(
        matchesError.message
      )
    }

    let matches =
      (
        matchesRaw ||
        []
      ) as MatchRow[]

    // =========================================================
    // 2. SI EL CALLER MANDA LEAD IDS, SOLO TRABAJAMOS MATCHES
    //    RELACIONADOS CON ESOS LEADS.
    //
    //    El match incluye ambos lados, por lo tanto el flujo
    //    real puede notificar tenant + owner.
    // =========================================================

    if (
      requestedLeadIds
        .length > 0
    ) {
      const requestedSet =
        new Set(
          requestedLeadIds
        )

      matches =
        matches.filter(
          (match) =>
            requestedSet.has(
              match
                .tenant_lead_id
            ) ||
            requestedSet.has(
              match
                .owner_lead_id
            )
        )
    }

    // =========================================================
    // 3. LEADS INVOLUCRADOS
    // =========================================================

    const leadIds =
      Array.from(
        new Set(
          matches.flatMap(
            (match) => [
              match
                .tenant_lead_id,

              match
                .owner_lead_id,
            ]
          )
        )
      )

    if (
      leadIds.length ===
      0
    ) {
      return NextResponse.json({
        ok: true,
        send,

        matches_found:
          0,

        contacts_ready:
          0,

        processed:
          0,

        results: [],
      })
    }

    const {
      data:
        leadsRaw,

      error:
        leadsError,
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
          role,
          intent,
          lead_quality
        `)
        .in(
          "id",
          leadIds
        )

    if (
      leadsError
    ) {
      throw new Error(
        leadsError.message
      )
    }

    // =========================================================
    // 4. EXCLUIR DUPLICATES / NEEDS_RECLASSIFICATION
    // =========================================================

    const leads =
      (
        (
          leadsRaw ||
          []
        ) as LeadRow[]
      ).filter(
        (lead) =>
          lead
            .lead_quality !==
            "duplicate" &&
          lead
            .lead_quality !==
            "needs_reclassification"
      )

    const leadsById =
      new Map(
        leads.map(
          (lead) => [
            lead.id,
            lead,
          ]
        )
      )

    // =========================================================
    // 5. AGRUPAR POR PERSONA
    // =========================================================

    const groups =
      new Map<
        string,
        {
          role:
            string

          lead:
            LeadRow

          leadIds:
            Set<string>

          matches:
            Map<
              string,
              MatchRow
            >
        }
      >()

    for (
      const match
      of matches
    ) {
      const sides = [
        {
          role:
            "tenant",

          leadId:
            match
              .tenant_lead_id,
        },
        {
          role:
            "owner",

          leadId:
            match
              .owner_lead_id,
        },
      ]

      for (
        const side
        of sides
      ) {
        const lead =
          leadsById.get(
            side.leadId
          )

        if (!lead) {
          continue
        }

        const actualRole =
          roleFromLead(
            lead
          )

        if (
          actualRole !==
          side.role
        ) {
          continue
        }

        const key =
          contactKey(
            lead,
            side.role
          )

        if (
          !groups.has(
            key
          )
        ) {
          groups.set(
            key,
            {
              role:
                side.role,

              lead,

              leadIds:
                new Set<
                  string
                >(),

              matches:
                new Map<
                  string,
                  MatchRow
                >(),
            }
          )
        }

        const group =
          groups.get(
            key
          )!

        group
          .leadIds
          .add(
            lead.id
          )

        group
          .matches
          .set(
            match.id,
            match
          )
      }
    }

    // =========================================================
    // 6. E2E ALLOWLIST ANTES DEL LIMIT
    //
    // Esto corrige el problema que vimos donde Juan/Guillermo
    // podían quedar afuera de los primeros 25.
    //
    // PRODUCCIÓN:
    // borrar solamente este .filter(...)
    // y la constante E2E_ALLOWED_PHONES de arriba.
    // =========================================================

    const contacts =
      Array.from(
        groups.values()
      )
        .filter(
          (group) =>
            group
              .matches
              .size > 0
        )

        .filter(
          (group) => {
            const phone =
              normalizePhone(
                group
                  .lead
                  .phone_normalized ||
                  group
                    .lead
                    .phone
              )

            return (
              E2E_ALLOWED_PHONES
                .has(
                  phone
                )
            )
          }
        )

        .sort(
          (
            a,
            b
          ) => {
            const aBest =
              Math.max(
                ...Array.from(
                  a.matches
                    .values()
                ).map(
                  (
                    match
                  ) =>
                    Number(
                      match
                        .score
                    )
                )
              )

            const bBest =
              Math.max(
                ...Array.from(
                  b.matches
                    .values()
                ).map(
                  (
                    match
                  ) =>
                    Number(
                      match
                        .score
                    )
                )
              )

            if (
              bBest !==
              aBest
            ) {
              return (
                bBest -
                aBest
              )
            }

            return (
              b.matches
                .size -
              a.matches
                .size
            )
          }
        )
        .slice(
          0,
          limit
        )

    const results:
      Record<
        string,
        unknown
      >[] = []

    // =========================================================
    // 7. PREPARAR / ENVIAR A GHL
    // =========================================================

    for (
      const group
      of contacts
    ) {
      const lead =
        group.lead

      const role =
        group.role

      const leadMatches =
        Array.from(
          group
            .matches
            .values()
        )

      const matchFields =
        buildMatchFields(
          role,
          leadMatches
        )

      // =======================================================
      // 7A. TOKEN TENANT
      // =======================================================

      let verloMatchesToken =
        ""

      let verloMatchesUrl =
        ""

      if (
        role ===
        "tenant"
      ) {
        const tokenResponse =
          await fetch(
            `${req.nextUrl.origin}/api/tenant-matches-token`,
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
                    tenant_lead_id:
                      lead.id,
                  }
                ),
            }
          )

        const tokenData =
          await tokenResponse
            .json()
            .catch(
              () =>
                null
            )

        if (
          !tokenResponse.ok ||
          !tokenData?.ok ||
          !tokenData?.token
        ) {
          console.error(
            "tenant matches token error:",
            tokenData
          )

          results.push({
            lead_id:
              lead.id,

            name:
              lead.full_name,

            email:
              lead.email,

            role,

            sent:
              false,

            dry_run:
              !send,

            error:
              "No se pudo generar verlo_matches_token",

            token_status:
              tokenResponse.status,

            token_response:
              tokenData,
          })

          continue
        }

        verloMatchesToken =
          String(
            tokenData
              .token ||
              ""
          )

        verloMatchesUrl =
          String(
            tokenData
              .matches_url ||
              ""
          )
      }

      // =======================================================
      // 7B. TOKEN OWNER
      // =======================================================

      let verloPropertyToken =
        ""

      let verloPropertyUrl =
        ""

      if (
        role ===
        "owner"
      ) {
        const tokenResponse =
          await fetch(
            `${req.nextUrl.origin}/api/owner-property-token`,
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
                    owner_lead_id:
                      lead.id,
                  }
                ),
            }
          )

        const tokenData =
          await tokenResponse
            .json()
            .catch(
              () =>
                null
            )

        if (
          !tokenResponse.ok ||
          !tokenData?.ok ||
          !tokenData?.token
        ) {
          console.error(
            "owner property token error:",
            tokenData
          )

          results.push({
            lead_id:
              lead.id,

            name:
              lead.full_name,

            email:
              lead.email,

            role,

            sent:
              false,

            dry_run:
              !send,

            error:
              "No se pudo generar verlo_property_token",

            token_status:
              tokenResponse.status,

            token_response:
              tokenData,
          })

          continue
        }

        verloPropertyToken =
          String(
            tokenData
              .token ||
              ""
          )

        verloPropertyUrl =
          String(
            tokenData
              .property_url ||
              ""
          )
      }

      const tags = [
        "verlo_lead",

        role ===
        "owner"
          ? "verlo_owner"
          : "verlo_tenant",

        role ===
        "owner"
          ? "verlo_owner_new_listing"
          : "verlo_tenant_search",

        "verlo_pilot_match",
      ]

      // =======================================================
      // 8. PAYLOAD ÚNICO PARA GHL
      // =======================================================

      const payload = {
        lead_id:
          lead.id,

        lead_ids:
          Array.from(
            group.leadIds
          ),

        full_name:
          lead.full_name,

        first_name:
          firstName(
            lead.full_name
          ),

        email:
          normalizeEmail(
            lead.email
          ),

        phone:
          normalizePhone(
            lead.phone_normalized ||
              lead.phone
          ),

        role,

        intent:
          role ===
          "owner"
            ? "owner_new_listing"
            : "tenant_search",

        // Tenant

        verlo_matches_token:
          verloMatchesToken,

        verlo_matches_url:
          verloMatchesUrl,

        // Owner

        verlo_property_token:
          verloPropertyToken,

        verlo_property_url:
          verloPropertyUrl,

        tags,

        ...matchFields,

        source:
          "verlo_pilot_match_v2",
      }

      // =======================================================
      // 9. DRY RUN
      // =======================================================

      if (!send) {
        results.push({
          lead_id:
            lead.id,

          name:
            lead.full_name,

          email:
            lead.email,

          phone:
            payload.phone,

          role,

          matches:
            matchFields
              .verlo_match_count,

          matches_100:
            matchFields
              .verlo_match_100_count,

          matches_80:
            matchFields
              .verlo_match_80_count,

          best_score:
            matchFields
              .verlo_best_match_score,

          verlo_matches_token:
            verloMatchesToken,

          verlo_matches_url:
            verloMatchesUrl,

          verlo_property_token:
            verloPropertyToken,

          verlo_property_url:
            verloPropertyUrl,

          sent:
            false,

          dry_run:
            true,
        })

        continue
      }

      // =======================================================
      // 10. ÚNICO ENVÍO REAL HACIA EL WORKFLOW GHL
      // =======================================================

      const response =
        await fetch(
          GHL_PILOT_MATCH_WEBHOOK_URL,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        )

      const responseText =
        await response
          .text()
          .catch(
            () => ""
          )

      results.push({
        lead_id:
          lead.id,

        name:
          lead.full_name,

        email:
          lead.email,

        phone:
          payload.phone,

        role,

        matches:
          matchFields
            .verlo_match_count,

        matches_100:
          matchFields
            .verlo_match_100_count,

        matches_80:
          matchFields
            .verlo_match_80_count,

        best_score:
          matchFields
            .verlo_best_match_score,

        verlo_matches_token:
          verloMatchesToken,

        verlo_matches_url:
          verloMatchesUrl,

        verlo_property_token:
          verloPropertyToken,

        verlo_property_url:
          verloPropertyUrl,

        sent:
          response.ok,

        dry_run:
          false,

        ghl_status:
          response.status,

        ghl_response:
          responseText,
      })
    }

    return NextResponse.json({
      ok: true,

      send,

      source:
        "lead_matches",

      min_score:
        MIN_MATCH_SCORE,

      e2e_mode:
        true,

      matches_found:
        matches.length,

      contacts_ready:
        contacts.length,

      processed:
        results.length,

      limit,

      results,
    })
  } catch (
    error
  ) {
    console.error(
      "pilot matches v2 error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof
          Error
            ? error.message
            : "Error procesando matches actuales",
      },
      {
        status: 500,
      }
    )
  }
}
