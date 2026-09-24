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

    // Until the protected cron is configured in Vercel, keep today's
    // existing immediate notification flow so no match goes silent.
    if (!process.env.CRON_SECRET) {
      const response = await fetch(
        new URL('/api/tenant-matches-token', request.url),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_lead_id: tenantLeadId }),
          cache: 'no-store',
        }
      )
      const token = await response.json().catch(() => null)
      if (!response.ok || !token?.matches_url) {
        throw new Error('Could not resolve tenant match destination')
      }
      const notification = await notifyLeadOnce({
        eventKey: `match_created:tenant:${matchId}`,
        eventType: 'match_created',
        leadId: tenantLeadId,
        entityType: 'match',
        entityId: matchId,
        title: 'Verlo · Tenés un match',
        body: 'Encontramos una propiedad compatible con tu búsqueda.',
        url: token.matches_url,
      })
      return NextResponse.json({ ok: true, match_id: matchId,
        notifications: { tenant: notification }, daily_digest_active: false })
    }

    return NextResponse.json({
      ok: true,

      match_id:
        matchId,

      tenant_lead_id:
        tenantLeadId,

      owner_lead_id:
        ownerLeadId,

      queued_for_daily_digest: true,
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
