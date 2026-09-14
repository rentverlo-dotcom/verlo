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

function clean(
  value: unknown
) {
  return String(
    value || ''
  ).trim()
}

async function getOwnerDestination(
  leadId: string
) {
  const {
    data:
      candidateToken,
  } =
    await supabaseAdmin
      .from(
        'owner_candidates_access_tokens'
      )
      .select(
        'token, expires_at, revoked_at, created_at'
      )
      .eq(
        'owner_lead_id',
        leadId
      )
      .is(
        'revoked_at',
        null
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
    candidateToken &&
    (
      !candidateToken
        .expires_at ||
      new Date(
        candidateToken
          .expires_at
      ).getTime() >
        Date.now()
    )
  ) {
    return `/candidatos/${candidateToken.token}`
  }

  const {
    data:
      propertyToken,
  } =
    await supabaseAdmin
      .from(
        'owner_property_access_tokens'
      )
      .select(
        'token, expires_at, revoked_at, created_at'
      )
      .eq(
        'owner_lead_id',
        leadId
      )
      .is(
        'revoked_at',
        null
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
    propertyToken &&
    (
      !propertyToken
        .expires_at ||
      new Date(
        propertyToken
          .expires_at
      ).getTime() >
        Date.now()
    )
  ) {
    return `/propiedad/${propertyToken.token}`
  }

  return `/success?role=owner&lead=${encodeURIComponent(
    leadId
  )}`
}

async function getTenantDestination(
  leadId: string
) {
  const {
    data:
      matchesToken,
  } =
    await supabaseAdmin
      .from(
        'tenant_matches_access_tokens'
      )
      .select(
        'token, expires_at, revoked_at, created_at'
      )
      .eq(
        'tenant_lead_id',
        leadId
      )
      .is(
        'revoked_at',
        null
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
    matchesToken &&
    (
      !matchesToken
        .expires_at ||
      new Date(
        matchesToken
          .expires_at
      ).getTime() >
        Date.now()
    )
  ) {
    return `/matches/${matchesToken.token}`
  }

  return `/success?role=tenant&lead=${encodeURIComponent(
    leadId
  )}`
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

    const leadId =
      clean(
        body?.lead_id
      )

    const role =
      clean(
        body?.role
      )

    if (
      !leadId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing lead_id',
        },
        {
          status: 400,
        }
      )
    }

    if (
      role !==
        'owner' &&
      role !==
        'tenant'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Invalid role',
        },
        {
          status: 400,
        }
      )
    }

    const {
      data:
        lead,
      error:
        leadError,
    } =
      await supabaseAdmin
        .from(
          'lead_intake'
        )
        .select(
          'id, role'
        )
        .eq(
          'id',
          leadId
        )
        .maybeSingle()

    if (
      leadError
    ) {
      throw leadError
    }

    if (
      !lead
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Lead not found',
        },
        {
          status: 404,
        }
      )
    }

    const leadRole =
      clean(
        lead.role
      )

    if (
      leadRole !==
        role &&
      leadRole !==
        'both'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Role does not match lead',
        },
        {
          status: 403,
        }
      )
    }

    const url =
      role ===
      'owner'
        ? await getOwnerDestination(
            leadId
          )
        : await getTenantDestination(
            leadId
          )

    const notification =
      await notifyLeadOnce({
        eventKey:
          `intake_received:${role}:${leadId}`,

        eventType:
          'intake_received',

        leadId,

        entityType:
          'lead',

        entityId:
          leadId,

        title:
          'Verlo · Datos recibidos',

        body:
          role ===
          'owner'
            ? 'Guardamos los datos de tu propiedad correctamente.'
            : 'Guardamos tu búsqueda correctamente.',

        url,
      })

    return NextResponse.json({
      ok: true,
      lead_id:
        leadId,
      role,
      url,
      notification,
    })
  } catch (
    error
  ) {
    console.error(
      'intake confirmation error:',
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
