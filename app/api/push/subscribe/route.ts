import {
  NextResponse,
} from "next/server"

import {
  supabaseAdmin,
} from "@/lib/supabase/admin"

import {
  retryFailedLeadNotifications,
} from "@/lib/lead-notifications"

import {
  retryFailedLeadEmails,
} from "@/lib/email"

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

    const subscription =
      body?.subscription

    const endpoint =
      clean(
        subscription
          ?.endpoint
      )

    const p256dh =
      clean(
        subscription
          ?.keys
          ?.p256dh
      )

    const auth =
      clean(
        subscription
          ?.keys
          ?.auth
      )

    if (
      !leadId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing lead_id",
        },
        {
          status: 400,
        }
      )
    }

    if (
      role !== "tenant" &&
      role !== "owner"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid role",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid push subscription",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. VALIDAR LEAD
    // =========================================================

    const {
      data:
        lead,

      error:
        leadError,
    } =
      await supabaseAdmin
        .from(
          "lead_intake"
        )
        .select(`
          id,
          role
        `)
        .eq(
          "id",
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
            "Lead not found",
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

    const roleAllowed =
      leadRole ===
        role ||
      leadRole ===
        "both"

    if (
      !roleAllowed
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Role does not match lead",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 2. REGISTRAR / ACTUALIZAR ESTE DISPOSITIVO
    //
    // endpoint es UNIQUE.
    //
    // Si ya existía:
    // - actualiza lead
    // - actualiza role
    // - actualiza keys
    // - reactiva revoked_at
    //
    // NO crea ningún evento de negocio.
    // =========================================================

    const now =
      new Date()
        .toISOString()

    const {
      data:
        savedSubscription,

      error:
        subscriptionError,
    } =
      await supabaseAdmin
        .from(
          "push_subscriptions"
        )
        .upsert(
          {
            lead_id:
              leadId,

            role,

            endpoint,

            p256dh,

            auth,

            user_agent:
              request
                .headers
                .get(
                  "user-agent"
                ),

            updated_at:
              now,

            revoked_at:
              null,
          },
          {
            onConflict:
              "endpoint",
          }
        )
        .select(`
          id,
          lead_id,
          role,
          endpoint,
          revoked_at
        `)
        .single()

    if (
      subscriptionError ||
      !savedSubscription
    ) {
      throw (
        subscriptionError ||
        new Error(
          "Could not save push subscription"
        )
      )
    }

    // =========================================================
    // 3. REINTENTAR SOLO EVENTOS FAILED YA EXISTENTES
    //
    // IMPORTANTE:
    // Suscribirse NO crea:
    // - intake confirmation
    // - match
    // - interés
    // - doble OK
    // - contrato
    //
    // Solo puede reintentar eventos de negocio
    // que ya existían y habían fallado.
    // =========================================================

    let retryResult:
      unknown =
      null

    let emailRetryResult:
      unknown =
      null

    try {
      retryResult =
        await retryFailedLeadNotifications(
          leadId
        )
    } catch (
      retryError
    ) {
      console.error(
        "push failed-event retry error:",
        retryError
      )
    }

    try {
      emailRetryResult =
        await retryFailedLeadEmails(
          leadId,
          1
        )
    } catch (
      retryError
    ) {
      console.error(
        "email failed-event retry error:",
        retryError
      )
    }

    // =========================================================
    // 4. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      registered:
        true,

      lead_id:
        leadId,

      role,

      subscription_id:
        savedSubscription.id,

      retries:
        retryResult,

      email_retries:
        emailRetryResult,
    })
  } catch (
    error
  ) {
    console.error(
      "push subscribe error:",
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
