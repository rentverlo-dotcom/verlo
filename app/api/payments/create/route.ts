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

const VERLO_FEE_ARS =
  89000

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

export async function POST(
  request: NextRequest
) {
  try {
    const accessToken =
      process.env
        .MERCADOPAGO_ACCESS_TOKEN

    if (
      !accessToken
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Mercado Pago no está configurado.",
        },
        {
          status: 500,
        }
      )
    }

    const body =
      await request
        .json()
        .catch(
          () => ({})
        )

    const token =
      clean(
        body?.token
      )

    if (
      !token
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta el acceso al contrato.",
        },
        {
          status: 400,
        }
      )
    }

    const {
      data:
        closingToken,

      error:
        closingTokenError,
    } =
      await supabaseAdmin
        .from(
          "lead_contract_access_tokens"
        )
        .select(`
          contract_id,
          lead_id,
          role,
          expires_at,
          revoked_at
        `)
        .eq(
          "token",
          token
        )
        .maybeSingle()

    if (
      closingTokenError ||
      !closingToken
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Acceso inválido.",
        },
        {
          status: 404,
        }
      )
    }

    if (
      closingToken.role !==
      "tenant"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El propietario no paga en Verlo.",
        },
        {
          status: 403,
        }
      )
    }

    if (
      closingToken
        .revoked_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Este acceso ya no está activo.",
        },
        {
          status: 403,
        }
      )
    }

    if (
      closingToken
        .expires_at &&
      new Date(
        closingToken
          .expires_at
      ).getTime() <
        Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Este acceso venció.",
        },
        {
          status: 403,
        }
      )
    }

    const {
      data:
        contract,

      error:
        contractError,
    } =
      await supabaseAdmin
        .from(
          "lead_contracts"
        )
        .select(`
          id,
          lead_match_id,
          tenant_lead_id,
          status,
          content
        `)
        .eq(
          "id",
          closingToken
            .contract_id
        )
        .maybeSingle()

    if (
      contractError ||
      !contract
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Contrato no encontrado.",
        },
        {
          status: 404,
        }
      )
    }

    if (
      contract
        .tenant_lead_id !==
      closingToken
        .lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Este acceso no corresponde al inquilino del contrato.",
        },
        {
          status: 403,
        }
      )
    }

    if (
      !contract.content ||
      (
        contract.status !==
          "generated" &&
        contract.status !==
          "agreed"
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El contrato todavía no está listo para pagar.",
        },
        {
          status: 409,
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
          "lead_matches"
        )
        .select(`
          id,
          tenant_lead_id,
          tenant_paid_at,
          tenant_post_visit_decision,
          owner_post_visit_decision
        `)
        .eq(
          "id",
          contract
            .lead_match_id
        )
        .maybeSingle()

    if (
      matchError ||
      !match
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Match no encontrado.",
        },
        {
          status: 404,
        }
      )
    }

    if (
      match
        .tenant_lead_id !==
      contract
        .tenant_lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El contrato y el match no corresponden.",
        },
        {
          status: 409,
        }
      )
    }

    if (
      match
        .tenant_paid_at
    ) {
      return NextResponse.json({
        ok: true,
        already_paid:
          true,
      })
    }

    if (
      match
        .tenant_post_visit_decision !==
        "yes" ||
      match
        .owner_post_visit_decision !==
        "yes"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Las dos partes deben confirmar después de la visita antes del pago.",
        },
        {
          status: 409,
        }
      )
    }

    const {
      data:
        tenant,

      error:
        tenantError,
    } =
      await supabaseAdmin
        .from(
          "lead_intake"
        )
        .select(
          "email, full_name"
        )
        .eq(
          "id",
          contract
            .tenant_lead_id
        )
        .maybeSingle()

    if (
      tenantError
    ) {
      throw tenantError
    }

    const {
      data:
        paymentRow,

      error:
        paymentInsertError,
    } =
      await supabaseAdmin
        .from(
          "lead_payments"
        )
        .insert({
          lead_contract_id:
            contract.id,

          lead_match_id:
            match.id,

          tenant_lead_id:
            contract
              .tenant_lead_id,

          provider:
            "mercadopago",

          amount:
            VERLO_FEE_ARS,

          currency:
            "ARS",

          status:
            "pending",
        })
        .select(
          "id"
        )
        .single()

    if (
      paymentInsertError ||
      !paymentRow
    ) {
      throw (
        paymentInsertError ||
        new Error(
          "No se pudo crear el intento de pago."
        )
      )
    }

    const siteUrl =
      (
        process.env
          .SITE_URL ||
        process.env
          .NEXT_PUBLIC_BASE_URL ||
        "https://verlo.lat"
      ).replace(
        /\/$/,
        ""
      )

    const returnBase =
      `${siteUrl}/cierre/${encodeURIComponent(
        token
      )}`

    const preferenceResponse =
      await fetch(
        "https://api.mercadopago.com/checkout/preferences",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json",

            "X-Idempotency-Key":
              paymentRow.id,
          },

          body:
            JSON.stringify({
              items: [
                {
                  id:
                    "verlo-contract-fee",

                  title:
                    "Verlo · Gestión de contrato",

                  description:
                    "Pago único del inquilino por el proceso de cierre y contrato en Verlo.",

                  quantity:
                    1,

                  unit_price:
                    VERLO_FEE_ARS,

                  currency_id:
                    "ARS",
                },
              ],

              payer:
                tenant?.email
                  ? {
                      email:
                        tenant.email,
                    }
                  : undefined,

              external_reference:
                paymentRow.id,

              metadata: {
                verlo_payment_id:
                  paymentRow.id,

                lead_contract_id:
                  contract.id,

                lead_match_id:
                  match.id,

                tenant_lead_id:
                  contract
                    .tenant_lead_id,
              },

              back_urls: {
                success:
                  `${returnBase}?payment=approved`,

                pending:
                  `${returnBase}?payment=pending`,

                failure:
                  `${returnBase}?payment=failure`,
              },

              auto_return:
                "approved",

              statement_descriptor:
                "VERLO",
            }),

          cache:
            "no-store",
        }
      )

    const preference =
      await preferenceResponse
        .json()
        .catch(
          () => null
        )

    if (
      !preferenceResponse.ok ||
      !preference?.id
    ) {
      await supabaseAdmin
        .from(
          "lead_payments"
        )
        .update({
          status:
            "preference_error",

          raw_payload:
            preference,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          paymentRow.id
        )

      return NextResponse.json(
        {
          ok: false,
          error:
            preference
              ?.message ||
            "Mercado Pago no pudo iniciar el pago.",
        },
        {
          status: 502,
        }
      )
    }

    const {
      error:
        preferenceSaveError,
    } =
      await supabaseAdmin
        .from(
          "lead_payments"
        )
        .update({
          provider_preference_id:
            preference.id,

          raw_payload:
            preference,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          paymentRow.id
        )

    if (
      preferenceSaveError
    ) {
      throw preferenceSaveError
    }

    const sandbox =
      accessToken
        .startsWith(
          "TEST-"
        )

    const initPoint =
      sandbox
        ? (
            preference
              .sandbox_init_point ||
            preference
              .init_point
          )
        : preference
            .init_point

    if (
      !initPoint
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Mercado Pago no devolvió una URL de pago.",
        },
        {
          status: 502,
        }
      )
    }

    return NextResponse.json({
      ok: true,

      already_paid:
        false,

      amount:
        VERLO_FEE_ARS,

      currency:
        "ARS",

      payment_id:
        paymentRow.id,

      preference_id:
        preference.id,

      init_point:
        initPoint,

      sandbox,
    })
  } catch (
    error
  ) {
    console.error(
      "mercadopago create payment error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof
          Error
            ? error.message
            : "No se pudo iniciar el pago.",
      },
      {
        status: 500,
      }
    )
  }
}
