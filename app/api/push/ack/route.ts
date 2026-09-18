import {
  NextResponse,
} from 'next/server'

import {
  supabaseAdmin,
} from '@/lib/supabase/admin'

export const runtime =
  'nodejs'

export const dynamic =
  'force-dynamic'

type AckStage =
  | 'delivered'
  | 'displayed'
  | 'clicked'

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

    const deliveryId =
      clean(
        body?.delivery_id
      )

    const stage =
      clean(
        body?.stage
      ) as AckStage

    if (
      !deliveryId
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            'Missing delivery_id',
        },
        {
          status: 400,
        }
      )
    }

    if (
      ![
        'delivered',
        'displayed',
        'clicked',
      ].includes(
        stage
      )
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            'Invalid ACK stage',
        },
        {
          status: 400,
        }
      )
    }

    const {
      data:
        existingReceipt,

      error:
        existingReceiptError,
    } =
      await supabaseAdmin
        .from(
          'push_delivery_receipts'
        )
        .select(`
          delivery_id,
          delivered_at,
          displayed_at,
          clicked_at
        `)
        .eq(
          'delivery_id',
          deliveryId
        )
        .maybeSingle()

    if (
      existingReceiptError
    ) {
      throw existingReceiptError
    }

    if (
      !existingReceipt
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            'Push delivery receipt not found',
        },
        {
          status: 404,
        }
      )
    }

    const now =
      new Date()
        .toISOString()

    const updatePayload:
      Record<
        string,
        string
      > = {
        updated_at:
          now,
      }

    if (
      stage ===
        'delivered' &&
      !existingReceipt
        .delivered_at
    ) {
      updatePayload.delivered_at =
        now
    }

    if (
      stage ===
      'displayed'
    ) {
      if (
        !existingReceipt
          .delivered_at
      ) {
        updatePayload.delivered_at =
          now
      }

      if (
        !existingReceipt
          .displayed_at
      ) {
        updatePayload.displayed_at =
          now
      }
    }

    if (
      stage ===
      'clicked'
    ) {
      if (
        !existingReceipt
          .delivered_at
      ) {
        updatePayload.delivered_at =
          now
      }

      if (
        !existingReceipt
          .displayed_at
      ) {
        updatePayload.displayed_at =
          now
      }

      if (
        !existingReceipt
          .clicked_at
      ) {
        updatePayload.clicked_at =
          now
      }
    }

    const {
      data:
        updatedReceipt,

      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          'push_delivery_receipts'
        )
        .update(
          updatePayload
        )
        .eq(
          'delivery_id',
          deliveryId
        )
        .select(`
          delivery_id,
          lead_id,
          subscription_id,
          provider_accepted_at,
          delivered_at,
          displayed_at,
          clicked_at,
          last_error
        `)
        .single()

    if (
      updateError ||
      !updatedReceipt
    ) {
      throw (
        updateError ||
        new Error(
          'Could not update push receipt'
        )
      )
    }

    return NextResponse.json({
      ok: true,

      delivery_id:
        deliveryId,

      stage,

      receipt:
        updatedReceipt,
    })
  } catch (
    error
  ) {
    console.error(
      'push ACK error:',
      error
    )

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof
          Error
            ? error.message
            : 'Unexpected server error',
      },
      {
        status: 500,
      }
    )
  }
}

