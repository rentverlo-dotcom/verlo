import {
  NextResponse,
} from 'next/server'

import {
  notifyLeadOnce,
} from '@/lib/lead-notifications'

export const runtime =
  'nodejs'

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

    const leadId =
      String(
        body?.lead_id ||
        ''
      ).trim()

    const role =
      String(
        body?.role ||
        ''
      ).trim()

    if (!leadId) {
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

    let url =
      `/success?role=${role}&lead=${encodeURIComponent(
        leadId
      )}`

    // ===============================================
    // OWNER
    //
    // Si ya tiene match, lo mandamos al flujo
    // real de su propiedad.
    // ===============================================

    if (
      role ===
      'owner'
    ) {
      const result =
        await postInternal(
          request,
          '/api/owner-property-token',
          {
            owner_lead_id:
              leadId,
          }
        )

      if (
        result.ok &&
        result.data
          ?.property_url
      ) {
        url =
          String(
            result.data
              .property_url
          )
      }
    }

    // ===============================================
    // TENANT
    //
    // Si ya tiene match, lo mandamos directo
    // a su dashboard de matches.
    // ===============================================

    if (
      role ===
      'tenant'
    ) {
      const result =
        await postInternal(
          request,
          '/api/tenant-matches-token',
          {
            tenant_lead_id:
              leadId,
          }
        )

      if (
        result.ok &&
        result.data
          ?.matches_url
      ) {
        url =
          String(
            result.data
              .matches_url
          )
      }
    }

    const notification =
      await notifyLeadOnce({
        eventKey:
          `intake_received:${leadId}`,

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
