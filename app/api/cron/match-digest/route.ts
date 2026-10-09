
import { createHash, randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyLeadOnce } from '@/lib/lead-notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ACTIVE_STATUSES = [
  'new',
  'reviewed',
  'contacted',
  'converted',
]

// ============================================================
// PRODUCTION DIGEST SAFETY
//
// El digest productivo solo toma matches creados desde el
// lanzamiento. El histórico anterior queda fuera y se tratará
// con un backfill separado y controlado.
// ============================================================

const PRODUCTION_DIGEST_CUTOFF =
  '2026-10-09T13:45:00.000Z'

// Limites provisionales solo para el digest GHL.
const MAX_DIGEST_PER_RUN = 50
const MAX_DIGEST_PER_DAY = 50

type Role =
  | 'tenant'
  | 'owner'

type Match = {
  id: string
  tenant_lead_id: string
  owner_lead_id: string
  created_at: string
}

type Lead = {
  id: string
  email: string | null
  phone_normalized: string | null
}

function identity(
  lead: Lead
) {
  const phone =
    (
      lead.phone_normalized ||
      ''
    ).trim()

  const email =
    (
      lead.email ||
      ''
    )
      .trim()
      .toLowerCase()

  return phone
    ? `phone:${phone}`
    : email
      ? `email:${email}`
      : `lead:${lead.id}`
}

// ============================================================
// DESTINATION
// ============================================================

async function destination(
  role: Role,
  leadId: string
) {
  const table =
    role === 'tenant'
      ? 'tenant_matches_access_tokens'
      : 'owner_candidates_access_tokens'

  const column =
    role === 'tenant'
      ? 'tenant_lead_id'
      : 'owner_lead_id'

  const now =
    new Date()
      .toISOString()

  console.log(
    'MATCH DIGEST DESTINATION LOOKUP',
    {
      role,
      leadId,
      table,
    }
  )

  const {
    data:
      existing,

    error:
      lookupError,
  } =
    await supabaseAdmin
      .from(
        table
      )
      .select(
        'token'
      )
      .eq(
        column,
        leadId
      )
      .is(
        'revoked_at',
        null
      )
      .or(
        `expires_at.is.null,expires_at.gt.${now}`
      )
      .order(
        'created_at',
        {
          ascending:
            false,
        }
      )
      .limit(
        1
      )
      .maybeSingle()

  if (
    lookupError
  ) {
    console.error(
      'MATCH DIGEST DESTINATION LOOKUP FAILED',
      {
        role,
        leadId,
        table,
        error:
          lookupError,
      }
    )

    throw lookupError
  }

  let token =
    existing?.token

  if (
    !token
  ) {
    token =
      randomBytes(
        32
      )
        .toString(
          'hex'
        )

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          table
        )
        .insert({
          [column]:
            leadId,

          token,

          expires_at:
            new Date(
              Date.now() +
              30 *
              86400000
            )
              .toISOString(),
        })

    if (
      error
    ) {
      console.error(
        'MATCH DIGEST DESTINATION INSERT FAILED',
        {
          role,
          leadId,
          table,
          error,
        }
      )

      throw error
    }

    console.log(
      'MATCH DIGEST DESTINATION TOKEN CREATED',
      {
        role,
        leadId,
        table,
      }
    )
  } else {
    console.log(
      'MATCH DIGEST DESTINATION TOKEN FOUND',
      {
        role,
        leadId,
        table,
      }
    )
  }

  return `${
    role === 'tenant'
      ? '/matches'
      : '/candidatos'
  }/${token}`
}

// ============================================================
// ACTIVE PRODUCTION MATCHES
// SOLO MATCHES CREADOS DESDE EL LANZAMIENTO PRODUCTIVO
// ============================================================

async function activeProductionMatches():
Promise<Match[]> {
  const matches:
    Match[] =
    []

  for (
    let start = 0;
    ;
    start += 500
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          'lead_matches'
        )
        .select(`
          id,
          tenant_lead_id,
          owner_lead_id,
          created_at
        `)
        .gte(
          'score',
          80
        )
        .in(
          'status',
          ACTIVE_STATUSES
        )
        .gte(
          'created_at',
          PRODUCTION_DIGEST_CUTOFF
        )
        .order(
          'created_at',
          {
            ascending:
              false,
          }
        )
        .order(
          'id',
          {
            ascending:
              false,
          }
        )
        .range(
          start,
          start + 499
        )

    if (
      error
    ) {
      throw error
    }

    matches.push(
      ...(
        data ||
        []
      )
    )

    if (
      !data ||
      data.length <
      500
    ) {
      break
    }
  }

  return matches
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request:
    NextRequest
) {
  const secret =
    process.env
      .CRON_SECRET

  const authHeader =
    request.headers.get(
      'authorization'
    )

  console.log(
    'MATCH DIGEST REQUEST RECEIVED',
    {
      hasCronSecret:
        Boolean(
          secret
        ),

      hasAuthorizationHeader:
        Boolean(
          authHeader
        ),

      authorizationMatches:
        Boolean(
          secret &&
          authHeader ===
          `Bearer ${secret}`
        ),

      productionDigestCutoff:
        PRODUCTION_DIGEST_CUTOFF,
    }
  )

  // ==========================================================
  // AUTH
  // ==========================================================

  if (
    !secret ||
    authHeader !==
    `Bearer ${secret}`
  ) {
    console.error(
      'MATCH DIGEST AUTH FAILED',
      {
        hasCronSecret:
          Boolean(
            secret
          ),

        hasAuthorizationHeader:
          Boolean(
            authHeader
          ),
      }
    )

    return NextResponse.json(
      {
        ok:
          false,

        diagnostic:
          true,

        stage:
          'auth',

        error:
          'unauthorized',

        hasCronSecret:
          Boolean(
            secret
          ),

        hasAuthorizationHeader:
          Boolean(
            authHeader
          ),
      },
      {
        status:
          401,
      }
    )
  }

  console.log(
    'MATCH DIGEST AUTH OK'
  )

  try {
    // ========================================================
    // DATE
    // ========================================================

    const today =
      new Date(
        Date.now() -
        3 *
        3600000
      )
        .toISOString()
        .slice(
          0,
          10
        )

    // ========================================================
    // MATCHES
    // ========================================================

    const matches =
      await activeProductionMatches()

    console.log(
      'MATCH DIGEST MATCHES',
      {
        count:
          matches.length,

        matches:
          matches.map(
            (
              match
            ) => ({
              id:
                match.id,

              tenantLeadId:
                match
                  .tenant_lead_id,

              ownerLeadId:
                match
                  .owner_lead_id,

              createdAt:
                match
                  .created_at,
            })
          ),
      }
    )

    // ========================================================
    // IDS
    // ========================================================

    const ids =
      Array.from(
        new Set(
          matches.flatMap(
            (
              match
            ) => [
              match
                .tenant_lead_id,

              match
                .owner_lead_id,
            ]
          )
        )
      )

    // ========================================================
    // LEADS
    // ========================================================

    const leads =
      new Map<
        string,
        Lead
      >()

    for (
      let i = 0;
      i < ids.length;
      i += 300
    ) {
      const batch =
        ids.slice(
          i,
          i + 300
        )

      if (
        !batch.length
      ) {
        continue
      }

      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from(
            'lead_intake'
          )
          .select(`
            id,
            email,
            phone_normalized
          `)
          .in(
            'id',
            batch
          )

      if (
        error
      ) {
        throw error
      }

      for (
        const lead
        of data ||
        []
      ) {
        leads.set(
          lead.id,
          lead
        )
      }
    }

    console.log(
      'MATCH DIGEST LEADS LOADED',
      {
        requested:
          ids.length,

        loaded:
          leads.size,
      }
    )

    const safeMatches =
      matches.filter(
        (
          match
        ) => {
          const tenantLead =
            leads.get(
              match
                .tenant_lead_id
            )

          const ownerLead =
            leads.get(
              match
                .owner_lead_id
            )

          const tenantIsAutomatedTest =
            (
              tenantLead
                ?.email ||
              ''
            )
              .trim()
              .toLowerCase()
              .endsWith(
                '@example.com'
              )

          const ownerIsAutomatedTest =
            (
              ownerLead
                ?.email ||
              ''
            )
              .trim()
              .toLowerCase()
              .endsWith(
                '@example.com'
              )

          return (
            !tenantIsAutomatedTest &&
            !ownerIsAutomatedTest
          )
        }
      )

    // ========================================================
    // RECIPIENTS
    // ========================================================

    const recipients =
      new Map<
        string,
        {
          role: Role
          leadId: string
        }
      >()

    for (
      const match
      of safeMatches
    ) {
      for (
        const role
        of [
          'tenant',
          'owner',
        ] as const
      ) {
        const leadId =
          role ===
          'tenant'
            ? match
                .tenant_lead_id
            : match
                .owner_lead_id

        const lead =
          leads.get(
            leadId
          )

        if (
          !lead
        ) {
          console.error(
            'MATCH DIGEST LEAD NOT FOUND',
            {
              role,
              leadId,
            }
          )

          continue
        }

        const key =
          `${role}:${identity(
            lead
          )}`

        if (
          !recipients.has(
            key
          )
        ) {
          recipients.set(
            key,
            {
              role,
              leadId,
            }
          )
        }
      }
    }

    console.log(
      'MATCH DIGEST RECIPIENTS',
      {
        count:
          recipients.size,

        recipients:
          Array.from(
            recipients.values()
          ),
      }
    )

    // ========================================================
    // DIAGNOSTICS
    // ========================================================

    const diagnostics:
      Array<
        Record<
          string,
          unknown
        >
      > =
      []

    // ========================================================
    // SEND RECIPIENT
    // ========================================================

    const sendRecipient =
      async (
        recipient:
          string,

        role:
          Role,

        leadId:
          string
      ) => {
        try {
          console.log(
            'MATCH DIGEST RECIPIENT START',
            {
              role,
              leadId,
            }
          )

          const count =
            safeMatches.filter(
              (
                match
              ) =>
                role ===
                'tenant'
                  ? match
                      .tenant_lead_id ===
                    leadId
                  : match
                      .owner_lead_id ===
                    leadId
            ).length

          console.log(
            'MATCH DIGEST ACTIVE COUNT',
            {
              role,
              leadId,
              count,
            }
          )

          if (
            !count
          ) {
            diagnostics.push({
              role,
              leadId,
              stage:
                'count',
              ok:
                true,
              skipped:
                true,
            })

            return true
          }

          // ==================================================
          // DESTINATION
          // ==================================================

          console.log(
            'MATCH DIGEST DESTINATION START',
            {
              role,
              leadId,
            }
          )

          const url =
            await destination(
              role,
              leadId
            )

          console.log(
            'MATCH DIGEST DESTINATION OK',
            {
              role,
              leadId,
              url,
            }
          )

          // ==================================================
          // EVENT KEY
          // ==================================================

          const key =
            createHash(
              'sha256'
            )
              .update(
                recipient
              )
              .digest(
                'hex'
              )

          const eventType =
            role ===
            'tenant'
              ? 'match_digest_tenant'
              : 'owner_match_digest'

          // ==================================================
          // NOTIFY
          // ==================================================

          console.log(
            'MATCH DIGEST NOTIFY START',
            {
              role,
              leadId,
              eventType,
            }
          )

          const result =
            await notifyLeadOnce({
              eventKey:
                `match_digest:v3:${today}:${key}`,

              eventType,

              leadId,

              entityType:
                'lead',

              entityId:
                leadId,

              title:
                role ===
                'tenant'
                  ? 'Verlo · Tus propiedades compatibles'
                  : 'Verlo · Tus candidatos compatibles',

              body:
                role ===
                'tenant'
                  ? `En esta búsqueda tenés ${count} propiedades compatibles para revisar.`
                  : `En esta publicación tenés ${count} candidatos compatibles. Pueden estar pendientes de validación.`,

              url,

              // =================================================
              // IMPORTANTE:
              // POR AHORA DEJAMOS ESTO COMO ESTABA.
              // OWNER GHL SE ARREGLA DESPUES DEL DIAGNOSTICO.
              // =================================================

              skipWhatsApp:
                false,
            })

          console.log(
            'MATCH DIGEST NOTIFY RESULT',
            {
              role,
              leadId,
              result,
            }
          )

          diagnostics.push({
            role,
            leadId,
            stage:
              'notify',
            ok:
              Boolean(
                result.ok
              ),
            result,
          })

          return Boolean(
            result.ok
          )
        } catch (
          error
        ) {
          const message =
            error instanceof
            Error
              ? error.message
              : String(
                  error
                )

          console.error(
            'MATCH DIGEST RECIPIENT FAILED',
            {
              role,
              leadId,
              error,
            }
          )

          diagnostics.push({
            role,
            leadId,
            stage:
              'recipient',
            ok:
              false,
            error:
              message,
          })

          return false
        }
      }

    // ========================================================
    // PROCESS RECIPIENTS
    // ========================================================

    let sent =
      0

    let failed =
      0

    const entries = Array.from(recipients)

    // Reservas y eventos ya generados hoy. Sin cupo no hay envio.
    const [
      { data: reservations, error: reservationError },
      { data: events, error: eventsError },
    ] = await Promise.all([
      supabaseAdmin
        .from('ghl_digest_daily_reservations')
        .select('recipient_key')
        .eq('day', today)
        .limit(100),
      supabaseAdmin
        .from('lead_notification_events')
        .select('event_key')
        .like('event_key', `match_digest:v3:${today}:%`)
        .limit(100),
    ])

    if (reservationError || eventsError || !reservations || !events) {
      throw new Error('No se pudo consultar el cupo diario GHL')
    }

    const prefix = `match_digest:v3:${today}:`
    const used = new Set([
      ...reservations.map((row) => row.recipient_key),
      ...events.map((row) => row.event_key.slice(prefix.length)),
    ])

    // Filtrar antes de tomar la tanda: cada cron avanza con pendientes.
    const pending = entries.filter(([recipient]) => {
      const hash = createHash('sha256').update(recipient).digest('hex')
      return !used.has(hash)
    })

    let reservedThisRun = 0
    let quotaBlocked = false

    for (const [recipient, value] of pending) {
      if (reservedThisRun >= MAX_DIGEST_PER_RUN) break

      const recipientKey = createHash('sha256')
        .update(recipient)
        .digest('hex')

      // Reserva atomica en Supabase: tambien controla concurrencia.
      const { data: granted, error: reserveError } =
        await supabaseAdmin.rpc('reserve_ghl_digest_slot', {
          p_day: today,
          p_recipient_key: recipientKey,
        })

      if (reserveError) {
        throw new Error(`Reserva atomica GHL fallida: ${reserveError.message}`)
      }

      if (granted !== true) {
        // Otra ejecucion pudo reservar esta persona, o el cupo se agoto.
        const { count, error: countError } = await supabaseAdmin
          .from('ghl_digest_daily_reservations')
          .select('recipient_key', { count: 'exact', head: true })
          .eq('day', today)

        if (countError || count === null) {
          throw new Error('No se pudo verificar el cupo GHL')
        }

        if (count >= MAX_DIGEST_PER_DAY) {
          quotaBlocked = true
          break
        }
        continue
      }

      reservedThisRun += 1
      const result = await sendRecipient(recipient, value.role, value.leadId)
      if (result) sent += 1
      else failed += 1
    }

    const deferred = Math.max(0, pending.length - reservedThisRun)
    const reservedToday = reservations.length + reservedThisRun

    // ========================================================
    // FINISH
    // ========================================================

    console.log(
      'MATCH DIGEST RUN COMPLETE',
      {
        date:
          today,

        matches:
          safeMatches.length,

        rawMatchesSinceCutoff:
          matches.length,

        recipients:
          recipients.size,

        deferred,
        quotaBlocked,
        reservedToday,
        maxPerRun: MAX_DIGEST_PER_RUN,
        maxPerDay: MAX_DIGEST_PER_DAY,
        sent,

        failed,

        diagnostics,
      }
    )

    return NextResponse.json(
      {
        ok:
          failed ===
          0,

        diagnostic:
          true,

        date:
          today,

        matches:
          safeMatches.length,

        rawMatchesSinceCutoff:
          matches.length,

        recipients:
          recipients.size,

        sent,

        failed,

        diagnostics,
      },
      {
        status:
          failed
            ? 500
            : 200,
      }
    )
  } catch (
    error
  ) {
    console.error(
      'MATCH DIGEST TOP LEVEL FAILED',
      error
    )

    return NextResponse.json(
      {
        ok:
          false,

        diagnostic:
          true,

        stage:
          'top-level',

        error:
          error instanceof
          Error
            ? error.message
            : String(
                error
              ),
      },
      {
        status:
          500,
      }
    )
  }
}

