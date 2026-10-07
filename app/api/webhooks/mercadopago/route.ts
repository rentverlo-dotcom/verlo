import {
  createHmac,
  timingSafeEqual,
} from "node:crypto"

import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  supabaseAdmin,
} from "@/lib/supabase/admin"

export const runtime =
  "nodejs"

export const dynamic =
  "force-dynamic"

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

function safeEqualHex(
  left: string,
  right: string
) {
  try {
    const a =
      Buffer.from(
        left,
        "hex"
      )

    const b =
      Buffer.from(
        right,
        "hex"
      )

    return (
      a.length ===
        b.length &&
      timingSafeEqual(
        a,
        b
      )
    )
  } catch {
    return false
  }
}

function validateSignature(
  request: NextRequest,
  dataId: string
) {
  const secret =
    clean(
      process.env
        .MERCADOPAGO_WEBHOOK_SECRET
    )

  if (!secret) {
    throw new Error(
      "Missing MERCADOPAGO_WEBHOOK_SECRET"
    )
  }

  const signature =
    clean(
      request.headers.get(
        "x-signature"
      )
    )

  const requestId =
    clean(
      request.headers.get(
        "x-request-id"
      )
    )

  if (
    !signature ||
    !requestId ||
    !dataId
  ) {
    return false
  }

  let ts =
    ""

  let v1 =
    ""

  for (
    const part
    of signature.split(
      ","
    )
  ) {
    const [
      rawKey,
      ...rawValue
    ] =
      part.split(
        "="
      )

    const key =
      clean(
        rawKey
      )

    const value =
      clean(
        rawValue.join(
          "="
        )
      )

    if (
      key ===
      "ts"
    ) {
      ts = value
    }

    if (
      key ===
      "v1"
    ) {
      v1 = value
    }
  }

  if (
    !ts ||
    !v1
  ) {
    return false
  }

  const manifest =
    `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`

  const expected =
    createHmac(
      "sha256",
      secret
    )
      .update(
        manifest
      )
      .digest(
        "hex"
      )

  return safeEqualHex(
    expected,
    v1
  )
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request
        .json()
        .catch(
          () => ({})
        )

    const eventType =
      clean(
        body?.type ||
        request
          .nextUrl
          .searchParams
          .get(
            "type"
          )
      )

    const queryDataId =
      clean(
        request
          .nextUrl
          .searchParams
          .get(
            "data.id"
          )
      )

    const bodyDataId =
      clean(
        body
          ?.data
          ?.id
      )

    const paymentId =
      queryDataId ||
      bodyDataId

    if (
      eventType !==
        "payment" ||
      !paymentId
    ) {
      return NextResponse.json({
        ok: true,
        ignored: true,
      })
    }

    if (
      !validateSignature(
        request,
        paymentId
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid Mercado Pago signature",
        },
        {
          status: 401,
        }
      )
    }

    const accessToken =
      process.env
        .MERCADOPAGO_ACCESS_TOKEN

    if (
      !accessToken
    ) {
      throw new Error(
        "Missing MERCADOPAGO_ACCESS_TOKEN"
      )
    }

    const mpResponse =
      await fetch(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(
          paymentId
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },

          cache:
            "no-store",
        }
      )

    const payment =
      await mpResponse
        .json()
        .catch(
          () => null
        )

    if (
      !mpResponse.ok ||
      !payment
    ) {
      throw new Error(
        payment
          ?.message ||
        "Could not fetch Mercado Pago payment"
      )
    }

    const verloPaymentId =
      clean(
        payment
          .external_reference
      )

    if (
      !verloPaymentId
    ) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason:
          "missing_external_reference",
      })
    }

    const {
      data:
        storedPayment,

      error:
        storedPaymentError,
    } =
      await supabaseAdmin
        .from(
          "lead_payments"
        )
        .select(`
          id,
          lead_contract_id,
          lead_match_id,
          tenant_lead_id,
          amount,
          currency,
          status,
          approved_at
        `)
        .eq(
          "id",
          verloPaymentId
        )
        .maybeSingle()

    if (
      storedPaymentError ||
      !storedPayment
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Verlo payment not found",
        },
        {
          status: 404,
        }
      )
    }

    const paymentAmount =
      Number(
        payment
          .transaction_amount
      )

    const storedAmount =
      Number(
        storedPayment
          .amount
      )

    const currency =
      clean(
        payment
          .currency_id
      )

    if (
      !Number.isFinite(
        paymentAmount
      ) ||
      paymentAmount !==
        storedAmount ||
      currency !==
        storedPayment
          .currency
    ) {
      await supabaseAdmin
        .from(
          "lead_payments"
        )
        .update({
          status:
            "amount_mismatch",

          provider_payment_id:
            clean(
              payment.id
            ) ||
            null,

          raw_payload:
            payment,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          storedPayment.id
        )

      return NextResponse.json(
        {
          ok: false,
          error:
            "Payment amount or currency mismatch",
        },
        {
          status: 409,
        }
      )
    }

    const status =
      clean(
        payment.status
      ) ||
      "unknown"

    const now =
      new Date()
        .toISOString()

    const approvedAt =
      status ===
        "approved"
        ? (
            clean(
              payment
                .date_approved
            ) ||
            storedPayment
              .approved_at ||
            now
          )
        : storedPayment
            .approved_at

    const {
      error:
        paymentUpdateError,
    } =
      await supabaseAdmin
        .from(
          "lead_payments"
        )
        .update({
          provider_payment_id:
            clean(
              payment.id
            ) ||
            null,

          status,

          approved_at:
            approvedAt,

          raw_payload:
            payment,

          updated_at:
            now,
        })
        .eq(
          "id",
          storedPayment.id
        )

    if (
      paymentUpdateError
    ) {
      throw paymentUpdateError
    }

    if (
      status ===
      "approved"
    ) {
      const {
        error:
          matchUpdateError,
      } =
        await supabaseAdmin
          .from(
            "lead_matches"
          )
          .update({
            tenant_paid_at:
              approvedAt ||
              now,
          })
          .eq(
            "id",
            storedPayment
              .lead_match_id
          )
          .eq(
            "tenant_lead_id",
            storedPayment
              .tenant_lead_id
          )

      if (
        matchUpdateError
      ) {
        throw matchUpdateError
      }
    }

    return NextResponse.json({
      ok: true,
      status,
      payment_id:
        storedPayment.id,
    })
  } catch (
    error
  ) {
    console.error(
      "mercadopago webhook error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof
          Error
            ? error.message
            : "Mercado Pago webhook error",
      },
      {
        status: 500,
      }
    )
  }
}
