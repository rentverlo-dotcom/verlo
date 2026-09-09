import { NextResponse } from 'next/server'
import { sendPushToLead } from '@/lib/push'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const leadId = String(
      body?.lead_id || ''
    ).trim()

    const title = String(
      body?.title || 'Verlo'
    ).trim()

    const message = String(
      body?.body ||
        'Tenés una nueva notificación en Verlo.'
    ).trim()

    const url = String(
      body?.url || '/'
    ).trim()

    if (!leadId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing lead_id',
        },
        {
          status: 400,
        }
      )
    }

    const result =
      await sendPushToLead(
        leadId,
        {
          title,
          body: message,
          url,
        }
      )

    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (error) {
    console.error(
      'push test error',
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      {
        status: 500,
      }
    )
  }
}
