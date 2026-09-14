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

async function postInternal(
  request: Request,
  path: string,
  body: Record<string, unknown>
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
      String(
        body?.match_id ||
        ''
      ).trim()

    if (!matchId) {
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
      data: match,
      error: matchError,
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
        .single()

    if (
      matchError ||
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
      !ACTIVE_MATCH_STATUSES.includes(
        String(
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
      String(
        match.tenant_lead_id
      )

    const ownerLeadId =
      String(
        match.owner_lead_id
      )

    // =========================================================
    // TENANT URL
    // =========================================================

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
        ? String(
            tenantToken.data
              .matches_url
          )
        : null

    // =========================================================
    // OWNER URL
    //
    // Si completó propiedad -> candidatos.
    // Si todavía no -> propiedad.
    // =========================================================

    const {
      data: ownerCompletion,
      error:
        ownerCompletionError,
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
      ownerCompletionError
    ) {
      throw ownerCompletionError
    }

    let ownerUrl:
      string |
      null =
      null

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
          String(
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
          String(
            ownerToken.data
              .property_url
          )
      }
    }

    const results:
      Record<
        string,
        unknown
      > = {}

    // =========================================================
    // PUSH TENANT
    // =========================================================

    if (
      tenantUrl
    ) {
      results.tenant =
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
    } else {
      results.tenant = {
        ok: false,
        sent: false,
        reason:
          'tenant_url_unavailable',
      }
    }

    // =========================================================
    // PUSH OWNER
    // =========================================================

    if (
      ownerUrl
    ) {
      results.owner =
        await notifyLeadOnce({
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
            'Encontramos una persona compatible con tu propiedad.',

          url:
            ownerUrl,
        })
    } else {
      results.owner = {
        ok: false,
        sent: false,
        reason:
          'owner_url_unavailable',
      }
    }

    return NextResponse.json({
      ok: true,

      match_id:
        matchId,

      tenant_lead_id:
        tenantLeadId,

      owner_lead_id:
        ownerLeadId,

      results,
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
