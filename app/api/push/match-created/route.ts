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
    // OWNER STATE
    //
    // Property completed:
    // /candidatos/[token]
    //
    // Property incomplete:
    // /propiedad/[token]
    // =====================================================

    const {
      data:
        ownerCompletion,

      error:
        completionError,
    } =
      await supabaseAdmin
        .from(
          'owner_property_completions'
        )
        .select(
          'id, status'
        )
        .eq(
          'lead_id',
          ownerLeadId
        )
        .eq(
          'status',
          'submitted'
        )
        .order(
          'created_at',
          {
            ascending:
              false,
          }
        )
        .limit(1)
        .maybeSingle()

    if (
      completionError
    ) {
      throw completionError
    }

    let ownerUrl =
      ''

    if (
      ownerCompletion
    ) {
      const ownerToken =
        await postInternal(
          request,
          '/api/owner-candidates-token',
          {
            owner_lead_id:
              ownerLeadId,
          }
        )

      if (
        ownerToken.ok &&
        ownerToken.data
          ?.candidates_url
      ) {
        ownerUrl =
          clean(
            ownerToken.data
              .candidates_url
          )
      }
    } else {
      const ownerToken =
        await postInternal(
          request,
          '/api/owner-property-token',
          {
            owner_lead_id:
              ownerLeadId,
          }
        )

      if (
        ownerToken.ok &&
        ownerToken.data
          ?.property_url
      ) {
        ownerUrl =
          clean(
            ownerToken.data
              .property_url
          )
      }
    }

    // =====================================================
    // NO CREAMOS EVENTOS SIN DESTINO VÁLIDO
    // =====================================================

    if (
      !tenantUrl ||
      !ownerUrl
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            'Could not resolve match destinations',

          match_id:
            matchId,

          tenant_url:
            tenantUrl ||
            null,

          owner_url:
            ownerUrl ||
            null,
        },
        {
          status: 500,
        }
      )
    }

    // =====================================================
    // UN EVENTO LÓGICO POR PERSONA Y MATCH
    // =====================================================

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
            tenantUrl,
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
            'Verlo · Tenés un match',

          body:
            ownerCompletion
              ? 'Encontramos una persona compatible con tu propiedad. Revisá tus candidatos.'
              : 'Encontramos una persona compatible con tu propiedad. Completá la publicación para continuar.',

          url:
            ownerUrl,
        }),
      ])

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

      owner_url:
        ownerUrl,

      notifications: {
        tenant:
          tenantNotification,

        owner:
          ownerNotification,
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
