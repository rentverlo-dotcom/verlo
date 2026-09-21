import {
  NextResponse,
} from 'next/server'

import {
  supabaseAdmin,
} from '@/lib/supabase/admin'

import {
  notifyLeadOnce,
} from '@/lib/lead-notifications'

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

async function postInternal(
  request: Request,
  path: string,
  body: Record<
    string,
    unknown
  >
) {
  const response =
    await fetch(
      new URL(
        path,
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
          JSON.stringify(
            body
          ),

        cache:
          'no-store',
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

    // =====================================================
    // TENANT DESTINATION
    // =====================================================

    const tenantToken =
      await postInternal(
        request,
        '/api/tenant-matches-token',
        {
          tenant_lead_id:
            tenantLeadId,
        }
      )

    const tenantUrl =
      tenantToken.ok &&
      tenantToken.data
        ?.matches_url
        ? clean(
            tenantToken.data
              .matches_url
          )
        : ''

    // =====================================================
    // OWNER NO SE NOTIFICA EN MATCH PASIVO
    //
    // Flujo de producto:
    // match -> tenant muestra interés -> tenant valida ->
    // recién entonces owner recibe candidato validado.
    // =====================================================

    if (
      !tenantUrl
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            'Could not resolve tenant match destination',

          match_id:
            matchId,

          tenant_url:
            null,
        },
        {
          status: 500,
        }
      )
    }

    const tenantNotification =
      await notifyLeadOnce({
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
          tenantUrl,
      })

    return NextResponse.json({
      ok: true,

      match_id:
        matchId,

      tenant_lead_id:
        tenantLeadId,

      owner_lead_id:
        ownerLeadId,

      tenant_url:
        tenantUrl,

      notifications: {
        tenant:
          tenantNotification,
      },
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
