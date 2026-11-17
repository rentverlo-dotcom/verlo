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
import { decideMpContractPayment } from "@/lib/payments/mercadopago-contract-state"

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
          approved_at,
          provider,
          provider_payment_id
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

    // Repair a partially processed approved notification on replay too.
    // Idempotent: an already paid match keeps its original paid timestamp.
    const syncApprovedMatch = async (approvedAt: string) => {
      const result = await supabaseAdmin.from("lead_matches")
        .update({ tenant_paid_at: approvedAt })
        .eq("id", storedPayment.lead_match_id)
        .eq("tenant_lead_id", storedPayment.tenant_lead_id)
        .is("tenant_paid_at", null)
      if (result.error) throw result.error
    }

    const decision = decideMpContractPayment({
      storedProvider: storedPayment.provider,
      storedStatus: storedPayment.status,
      storedProviderPaymentId: storedPayment.provider_payment_id,
      storedAmount: Number(storedPayment.amount),
      storedCurrency: storedPayment.currency,
      notificationId: paymentId,
      paymentId: payment.id,
      paymentAmount: Number(payment.transaction_amount),
      paymentCurrency: clean(payment.currency_id),
      paymentStatus: clean(payment.status),
    })

    if (decision === "reject_reference") {
      return NextResponse.json(
        { ok: false, error: "Payment reference mismatch" },
        { status: 409 }
      )
    }
    if (decision === "duplicate") {
      await syncApprovedMatch(storedPayment.approved_at || new Date().toISOString())
      return NextResponse.json({
        ok: true, status: "approved", payment_id: storedPayment.id,
        already_processed: true,
      })
    }
    if (decision === "reject_amount") {
      // Mismatched amount or currency must never unlock the contract.
      return NextResponse.json(
        { ok: false, error: "Payment amount or currency mismatch" },
        { status: 409 }
      )
    }
    if (decision === "ignore_status") {
      return NextResponse.json({
        ok: true, ignored: true, reason: "unsupported_payment_status",
      })
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
      data: updatedRows,
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
        .neq("status", "approved")
        .select("id")

    if (
      paymentUpdateError
    ) {
      throw paymentUpdateError
    }

    // The update is conditional: another webhook may have approved this
    // payment after our initial read. Never downgrade that approved state.
    if (!updatedRows?.length) {
      const latest = await supabaseAdmin.from("lead_payments")
        .select("status").eq("id", storedPayment.id).maybeSingle()
      if (latest.error) throw latest.error
      if (latest.data?.status === "approved") {
        await syncApprovedMatch(storedPayment.approved_at || now)
        return NextResponse.json({
          ok: true, status: "approved", payment_id: storedPayment.id,
          already_processed: true,
        })
      }
      return NextResponse.json({ ok: false, error: "Concurrent payment update" }, { status: 409 })
    }

    if (status === "approved") {
      await syncApprovedMatch(approvedAt || now)
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
