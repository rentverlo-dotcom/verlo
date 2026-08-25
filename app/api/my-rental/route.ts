import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  createClient,
} from "@supabase/supabase-js"

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

export async function GET(
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

    // =========================================================
    // 1. VALIDAR USUARIO AUTENTICADO
    // =========================================================

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

    // =========================================================
    // 2. ADMIN CLIENT
    // =========================================================

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
    // 3. PERFIL VERLO
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
          lead_id,
          full_name,
          email,
          phone
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
    // 4. BUSCAR ALQUILER ACTIVO DEL USUARIO
    // =========================================================

    const {
      data:
        tenantRental,

      error:
        tenantRentalError,
    } =
      await supabaseAdmin
        .from(
          "rentals"
        )
        .select(`
          id,
          lead_contract_id,
          lead_match_id,
          tenant_lead_id,
          owner_lead_id,
          status,
          start_date,
          end_date,
          activated_at
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
      tenantRentalError
    ) {
      throw new Error(
        tenantRentalError
          .message
      )
    }

    const {
      data:
        ownerRental,

      error:
        ownerRentalError,
    } =
      await supabaseAdmin
        .from(
          "rentals"
        )
        .select(`
          id,
          lead_contract_id,
          lead_match_id,
          tenant_lead_id,
          owner_lead_id,
          status,
          start_date,
          end_date,
          activated_at
        `)
        .eq(
          "owner_lead_id",
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
      ownerRentalError
    ) {
      throw new Error(
        ownerRentalError
          .message
      )
    }

    const rental =
      tenantRental ||
      ownerRental

    if (!rental) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No active rental found",
        },
        {
          status: 404,
        }
      )
    }

    const role =
      rental
        .tenant_lead_id ===
      profile.lead_id
        ? "tenant"
        : "owner"

    // =========================================================
    // 5. CONTRATO
    // =========================================================

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
          status,
          monthly_price,
          deposit,
          start_date,
          end_date,
          adjustment_method,
          terms_json,
          content,
          tenant_agreed_at,
          owner_agreed_at
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

    // =========================================================
    // 6. CONTRAPARTE
    // =========================================================

    const counterpartLeadId =
      role ===
      "tenant"
        ? rental
            .owner_lead_id
        : rental
            .tenant_lead_id

    const {
      data:
        counterpart,

      error:
        counterpartError,
    } =
      await supabaseAdmin
        .from(
          "lead_intake"
        )
        .select(`
          id,
          full_name,
          email,
          phone,
          phone_normalized
        `)
        .eq(
          "id",
          counterpartLeadId
        )
        .single()

    if (
      counterpartError ||
      !counterpart
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Counterpart not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 7. DATOS DEL INMUEBLE DESDE TERMS_JSON
    // =========================================================

    const terms =
      contract
        .terms_json &&
      typeof contract
        .terms_json ===
        "object"
        ? contract
            .terms_json as Record<
              string,
              unknown
            >
        : {}

    const property = {
      street:
        clean(
          terms
            .property_street
        ) ||
        null,

      number:
        clean(
          terms
            .property_number
        ) ||
        null,

      floor:
        clean(
          terms
            .property_floor
        ) ||
        null,

      unit:
        clean(
          terms
            .property_unit
        ) ||
        null,

      city:
        clean(
          terms
            .property_city
        ) ||
        null,

      province:
        clean(
          terms
            .property_province
        ) ||
        null,

      country:
        clean(
          terms
            .property_country
        ) ||
        null,

      postal_code:
        clean(
          terms
            .property_postal_code
        ) ||
        null,
    }

    // =========================================================
    // 8. PAGOS
    // =========================================================

    const {
      data:
        payments,

      error:
        paymentsError,
    } =
      await supabaseAdmin
        .from(
          "rental_payments"
        )
        .select(`
          id,
          rental_id,
          period_year,
          period_month,
          amount,
          due_date,
          status,
          tenant_receipt_key,
          tenant_receipt_filename,
          tenant_receipt_content_type,
          tenant_uploaded_at,
          owner_confirmed_at,
          owner_rejected_at,
          owner_note,
          created_at,
          updated_at
        `)
        .eq(
          "rental_id",
          rental.id
        )
        .order(
          "period_year",
          {
            ascending:
              false,
          }
        )
        .order(
          "period_month",
          {
            ascending:
              false,
          }
        )

    if (
      paymentsError
    ) {
      throw new Error(
        paymentsError
          .message
      )
    }

    const paymentList =
      payments || []

    const pendingPayments =
      paymentList.filter(
        payment =>
          payment.status ===
            "pending" ||
          payment.status ===
            "receipt_uploaded"
      )

    const confirmedPayments =
      paymentList.filter(
        payment =>
          payment.status ===
          "confirmed"
      )

    // =========================================================
    // 9. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok:
        true,

      user: {
        id:
          user.id,

        full_name:
          profile
            .full_name,

        email:
          profile
            .email,

        phone:
          profile
            .phone,

        role,
      },

      rental: {
        id:
          rental.id,

        status:
          rental.status,

        start_date:
          rental
            .start_date,

        end_date:
          rental
            .end_date,

        activated_at:
          rental
            .activated_at,
      },

      contract: {
        id:
          contract.id,

        status:
          contract.status,

        monthly_price:
          contract
            .monthly_price,

        deposit:
          contract
            .deposit,

        start_date:
          contract
            .start_date,

        end_date:
          contract
            .end_date,

        adjustment_method:
          contract
            .adjustment_method,

        content:
          contract
            .content,

        tenant_agreed_at:
          contract
            .tenant_agreed_at,

        owner_agreed_at:
          contract
            .owner_agreed_at,
      },

      property,

      counterpart: {
        id:
          counterpart.id,

        full_name:
          counterpart
            .full_name,

        email:
          counterpart
            .email,

        phone:
          counterpart
            .phone_normalized ||
          counterpart
            .phone,
      },

      payments:
        paymentList,

      payment_summary: {
        total:
          paymentList
            .length,

        pending:
          pendingPayments
            .length,

        confirmed:
          confirmedPayments
            .length,
      },
    })
  } catch (
    error
  ) {
    console.error(
      "my-rental error:",
      error
    )

    return NextResponse.json(
      {
        ok:
          false,

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
