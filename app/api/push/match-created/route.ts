import {
  NextResponse,
} from 'next/server'

import {
  supabaseAdmin,
} from '@/lib/supabase/admin'
import { notifyLeadOnce } from '@/lib/lead-notifications'

export const runtime =
  'nodejs'

const ACTIVE_MATCH_STATUSES = [
  'new',
  'reviewed',
  'contacted',
  'converted',
]

function clean(
  value: unknown
) {
  return String(
    value || ''
  ).trim()
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request
        .json()
        .catch(
          () => ({})
        )

    const matchId =
      clean(
        body?.match_id
      )

    if (
      !matchId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing match_id',
        },
        {
          status: 400,
        }
      )
    }

    const {
      data:
        match,

      error:
        matchError,
    } =
      await supabaseAdmin
        .from(
          'lead_matches'
        )
        .select(`
          id,
          tenant_lead_id,
          owner_lead_id,
          score,
          status
        `)
        .eq(
          'id',
          matchId
        )
        .maybeSingle()

    if (
      matchError
    ) {
      throw matchError
    }

    if (
      !match
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Match not found',
        },
        {
          status: 404,
        }
      )
    }

    if (
      !ACTIVE_MATCH_STATUSES
        .includes(
          clean(
            match.status
          )
        ) ||
      Number(
        match.score ||
        0
      ) < 80
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Match is not active',
        },
        {
          status: 409,
        }
      )
    }

    const tenantLeadId =
      clean(
        match
          .tenant_lead_id
      )

    const ownerLeadId =
      clean(
        match
          .owner_lead_id
      )

    if (
      !tenantLeadId ||
      !ownerLeadId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Invalid match participants',
        },
        {
          status: 500,
        }
      )
    }

    const [
      tenantTokenResponse,
      ownerTokenResponse,
    ] =
      await Promise.all([
        fetch(
          new URL(
            '/api/tenant-matches-token',
            request.url
          ),
          {
            method:
              'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body:
              JSON.stringify({
                tenant_lead_id:
                  tenantLeadId,
              }),
            cache:
              'no-store',
          }
        ),

        fetch(
          new URL(
            '/api/owner-candidates-token',
            request.url
          ),
          {
            method:
              'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body:
              JSON.stringify({
                owner_lead_id:
                  ownerLeadId,
              }),
            cache:
              'no-store',
          }
        ),
      ])

    const [
      tenantToken,
      ownerToken,
    ] =
      await Promise.all([
        tenantTokenResponse
          .json()
          .catch(
            () => null
          ),

        ownerTokenResponse
          .json()
          .catch(
            () => null
          ),
      ])

    if (
      !tenantTokenResponse.ok ||
      !tenantToken?.matches_url
    ) {
      throw new Error(
        'Could not resolve tenant match destination'
      )
    }

    if (
      !ownerTokenResponse.ok ||
      !ownerToken?.candidates_url
    ) {
      throw new Error(
        'Could not resolve owner match destination'
      )
    }

    const [
      tenantNotification,
      ownerNotification,
    ] =
      await Promise.all([
        notifyLeadOnce({
          eventKey:
            `match_created:tenant:${matchId}`,
          eventType:
            'match_created',
          leadId:
            tenantLeadId,
          entityType:
            'match',
          entityId:
            matchId,
          title:
            'Verlo · Tenés un match',
          body:
            'Encontramos una propiedad compatible con tu búsqueda.',
          url:
            tenantToken.matches_url,
          skipWhatsApp:
            true,
        }),

        notifyLeadOnce({
          eventKey:
            `match_created:owner:${matchId}`,
          eventType:
            'match_created',
          leadId:
            ownerLeadId,
          entityType:
            'match',
          entityId:
            matchId,
          title:
            'Verlo · Tenés un nuevo candidato',
          body:
            'Encontramos una persona compatible con tu propiedad.',
          url:
            ownerToken.candidates_url,
          skipWhatsApp:
            true,
        }),
      ])

    return NextResponse.json({
      ok:
        true,

      match_id:
        matchId,

      tenant_lead_id:
        tenantLeadId,

      owner_lead_id:
        ownerLeadId,

      notifications: {
        tenant:
          tenantNotification,

        owner:
          ownerNotification,
      },

      queued_for_daily_digest:
        Boolean(
          process.env
            .CRON_SECRET
        ),
    })
  } catch (
    error
  ) {
    console.error(
      'match-created push error:',
      error
    )

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof
          Error
            ? error.message
            : 'Unknown error',
      },
      {
        status: 500,
      }
    )
  }
}
