import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  createClient,
} from "@supabase/supabase-js"

import {
  buildR2Key,
  createR2UploadUrl,
} from "@/lib/r2"

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

function validContentType(
  value: string
) {
  return [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ].includes(value)
}

function periodNumber(
  year: number,
  month: number
) {
  return (
    year * 100 +
    month
  )
}

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL

    const anonKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing configuration",
        },
        {
          status: 500,
        }
      )
    }

    // =========================================================
    // 1. SESIÓN
    // =========================================================

    const authorization =
      clean(
        request.headers.get(
          "authorization"
        )
      )

    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing session",
        },
        {
          status: 401,
        }
      )
    }

    const accessToken =
      authorization
        .slice(
          "Bearer ".length
        )
        .trim()

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing access token",
        },
        {
          status: 401,
        }
      )
    }

    const supabaseAuth =
      createClient(
        supabaseUrl,
        anonKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      )

    const {
      data:
        userData,

      error:
        userError,
    } =
      await supabaseAuth
        .auth
        .getUser(
          accessToken
        )

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid session",
        },
        {
          status: 401,
        }
      )
    }

    const user =
      userData.user

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      )

    // =========================================================
    // 2. PERFIL
    // =========================================================

    const {
      data:
        profile,

      error:
        profileError,
    } =
      await supabaseAdmin
        .from(
          "user_profiles"
        )
        .select(`
          user_id,
          lead_id
        `)
        .eq(
          "user_id",
          user.id
        )
        .single()

    if (
      profileError ||
      !profile
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Profile not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 3. ALQUILER ACTIVO — SOLO TENANT
    // =========================================================

    const {
      data:
        rental,

      error:
        rentalError,
    } =
      await supabaseAdmin
        .from(
          "rentals"
        )
        .select(`
          id,
          lead_contract_id,
          tenant_lead_id,
          owner_lead_id,
          status,
          start_date,
          end_date
        `)
        .eq(
          "tenant_lead_id",
          profile.lead_id
        )
        .eq(
          "status",
          "active"
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(1)
        .maybeSingle()

    if (
      rentalError
    ) {
      throw new Error(
        rentalError.message
      )
    }

    if (!rental) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Active tenant rental not found",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 4. BODY / ACTION
    // =========================================================

    const body =
      await request
        .json()
        .catch(
          () => ({})
        )

    const action =
      clean(
        body?.action
      )

    // =========================================================
    // ACTION: PRESIGN
    // =========================================================

    if (
      action ===
      "presign"
    ) {
      const year =
        Number(
          body
            ?.period_year
        )

      const month =
        Number(
          body
            ?.period_month
        )

      const filename =
        clean(
          body?.filename
        )

      const contentType =
        clean(
          body
            ?.content_type
        ).toLowerCase()

      if (
        !Number.isInteger(
          year
        ) ||
        year < 2020 ||
        year > 2200
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Invalid payment year",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !Number.isInteger(
          month
        ) ||
        month < 1 ||
        month > 12
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Invalid payment month",
          },
          {
            status: 400,
          }
        )
      }

      if (!filename) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Missing filename",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !validContentType(
          contentType
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "File type not allowed",
          },
          {
            status: 400,
          }
        )
      }

      // -------------------------------------------------------
      // PERÍODO DEBE ESTAR DENTRO DE LA VIGENCIA DEL ALQUILER
      // -------------------------------------------------------

      const [
        startYear,
        startMonth,
      ] =
        String(
          rental.start_date
        )
          .split("-")
          .map(Number)

      const [
        endYear,
        endMonth,
      ] =
        String(
          rental.end_date
        )
          .split("-")
          .map(Number)

      const requestedPeriod =
        periodNumber(
          year,
          month
        )

      const firstPeriod =
        periodNumber(
          startYear,
          startMonth
        )

      const lastPeriod =
        periodNumber(
          endYear,
          endMonth
        )

      if (
        requestedPeriod <
          firstPeriod ||
        requestedPeriod >
          lastPeriod
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Payment period is outside rental dates",
          },
          {
            status: 409,
          }
        )
      }

      // -------------------------------------------------------
      // MONTO ACTUAL DEL CONTRATO
      // -------------------------------------------------------

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
            monthly_price
          `)
          .eq(
            "id",
            rental
              .lead_contract_id
          )
          .single()

      if (
        contractError ||
        !contract
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Contract not found",
          },
          {
            status: 404,
          }
        )
      }

      // -------------------------------------------------------
      // CREAR O REUTILIZAR PAGO DEL MES
      // -------------------------------------------------------

      const {
        data:
          existingPayment,

        error:
          existingPaymentError,
      } =
        await supabaseAdmin
          .from(
            "rental_payments"
          )
          .select(`
            id,
            status
          `)
          .eq(
            "rental_id",
            rental.id
          )
          .eq(
            "period_year",
            year
          )
          .eq(
            "period_month",
            month
          )
          .maybeSingle()

      if (
        existingPaymentError
      ) {
        throw new Error(
          existingPaymentError
            .message
        )
      }

      if (
        existingPayment
          ?.status ===
        "confirmed"
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Payment is already confirmed",
          },
          {
            status: 409,
          }
        )
      }

      let paymentId:
        string

      if (
        existingPayment
      ) {
        paymentId =
          existingPayment.id
      } else {
        const {
          data:
            createdPayment,

          error:
            createdPaymentError,
        } =
          await supabaseAdmin
            .from(
              "rental_payments"
            )
            .insert({
              rental_id:
                rental.id,

              period_year:
                year,

              period_month:
                month,

              amount:
                contract
                  .monthly_price,

              status:
                "pending",
            })
            .select(
              "id"
            )
            .single()

        if (
          createdPaymentError ||
          !createdPayment
        ) {
          throw new Error(
            createdPaymentError
              ?.message ||
              "Could not create payment"
          )
        }

        paymentId =
          createdPayment.id
      }

      // -------------------------------------------------------
      // R2
      // -------------------------------------------------------

      const key =
        buildR2Key({
          folder:
            "rental-payments",

          id:
            paymentId,

          filename,
        })

      const uploadUrl =
        await createR2UploadUrl({
          key,

          contentType,
        })

      return NextResponse.json({
        ok: true,

        payment_id:
          paymentId,

        upload_url:
          uploadUrl,

        key,

        content_type:
          contentType,
      })
    }

    // =========================================================
    // ACTION: CONFIRM
    // =========================================================

    if (
      action ===
      "confirm"
    ) {
      const paymentId =
        clean(
          body
            ?.payment_id
        )

      const key =
        clean(
          body?.key
        )

      const filename =
        clean(
          body?.filename
        )

      const contentType =
        clean(
          body
            ?.content_type
        ).toLowerCase()

      if (
        !paymentId ||
        !key ||
        !filename ||
        !contentType
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Missing receipt data",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !validContentType(
          contentType
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "File type not allowed",
          },
          {
            status: 400,
          }
        )
      }

      const {
        data:
          payment,

        error:
          paymentError,
      } =
        await supabaseAdmin
          .from(
            "rental_payments"
          )
          .select(`
            id,
            rental_id,
            status
          `)
          .eq(
            "id",
            paymentId
          )
          .single()

      if (
        paymentError ||
        !payment
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Payment not found",
          },
          {
            status: 404,
          }
        )
      }

      if (
        payment
          .rental_id !==
        rental.id
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Payment does not belong to this rental",
          },
          {
            status: 403,
          }
        )
      }

      if (
        payment.status ===
        "confirmed"
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Payment is already confirmed",
          },
          {
            status: 409,
          }
        )
      }

      // El key debe pertenecer al payment_id que acabamos de validar.
      if (
        !key.includes(
          `/rental-payments/${paymentId}/`
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Invalid receipt key",
          },
          {
            status: 403,
          }
        )
      }

      const now =
        new Date()
          .toISOString()

      const {
        error:
          updateError,
      } =
        await supabaseAdmin
          .from(
            "rental_payments"
          )
          .update({
            status:
              "receipt_uploaded",

            tenant_receipt_key:
              key,

            tenant_receipt_filename:
              filename,

            tenant_receipt_content_type:
              contentType,

            tenant_uploaded_at:
              now,

            owner_rejected_at:
              null,

            owner_note:
              null,

            updated_at:
              now,
          })
          .eq(
            "id",
            paymentId
          )

      if (
        updateError
      ) {
        throw new Error(
          updateError.message
        )
      }

      return NextResponse.json({
        ok: true,

        payment_id:
          paymentId,

        status:
          "receipt_uploaded",
      })
    }

    // =========================================================
    // ACTION INVÁLIDA
    // =========================================================

    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid action",
      },
      {
        status: 400,
      }
    )
  } catch (
    error
  ) {
    console.error(
      "rental payment receipt error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof
            Error
            ? error.message
            : "Unexpected server error",
      },
      {
        status: 500,
      }
    )
  }
}
