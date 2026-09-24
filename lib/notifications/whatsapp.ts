type WhatsAppMessage = {
  to?: string
  role?: "tenant" | "owner"
  template: string
  variables?: Record<string, string | number>
  context?: Record<string, any>
  eventKey?: string
  eventType?: string
  leadId?: string
  title?: string
  body?: string
  url?: string
  matchCount?: number
  matchesUrl?: string
}

type WhatsAppResult = {
  provider: string
  success: boolean
  skipped?: boolean
  status?: number
  message_id?: string
  error?: string
}

const GHL_TIMEOUT_MS =
  4000

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

/**
 * Canal WhatsApp best-effort vía webhook de GoHighLevel.
 *
 * REGLA:
 * - nunca debe romper el flujo principal de Verlo;
 * - si no hay webhook configurado, se omite;
 * - si GHL falla o demora demasiado, devuelve error;
 * - push / DB / contrato siguen funcionando igual.
 *
 * Env aceptadas:
 * - GHL_PILOT_MATCH_WEBHOOK_URL
 * - GHL_READY_TO_CONNECT_WEBHOOK_URL
 * - GHL_WHATSAPP_WEBHOOK_URL (fallback)
 * - GHL_WEBHOOK_URL (fallback)
 */
export async function sendWhatsApp(
  message: WhatsAppMessage
): Promise<WhatsAppResult> {
  const eventType =
    clean(
      message.eventType ||
      message.template
    )

  const pilotMatchEvents =
    new Set([
      "intake_received",
      "match_created",
      "tenant_verification_submitted",
    ])

  const readyToConnectEvents =
    new Set([
      "double_ok_1",
      "ready_to_connect",
    ])

  const webhookUrl =
    (
      readyToConnectEvents.has(
        eventType
      )
        ? clean(
            process.env
              .GHL_READY_TO_CONNECT_WEBHOOK_URL
          )
        : pilotMatchEvents.has(
            eventType
          )
          ? clean(
              process.env
                .GHL_PILOT_MATCH_WEBHOOK_URL
            )
          : ""
    ) ||
    clean(
      process.env
        .GHL_WHATSAPP_WEBHOOK_URL
    ) ||
    clean(
      process.env
        .GHL_WEBHOOK_URL
    )

  if (
    !webhookUrl
  ) {
    return {
      provider:
        "ghl",
      success:
        false,
      skipped:
        true,
      error:
        "GHL webhook not configured",
    }
  }

  const controller =
    new AbortController()

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      GHL_TIMEOUT_MS
    )

  try {
    const response =
      await fetch(
        webhookUrl,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              channel:
                "whatsapp",

              source:
                "verlo",
                            verlo_match_count:
                Number(
                  message.matchCount ||
                  0
                ),

              verlo_matches_url:
                clean(
                  message.matchesUrl ||
                  message.url
                ) ||
                null,

              to:
                clean(
                  message.to
                ) ||
                null,

              role:
                message.role ||
                null,

              template:
                clean(
                  message.template
                ),

              variables:
                message.variables ||
                {},

              event_key:
                clean(
                  message.eventKey
                ) ||
                null,

              event_type:
                clean(
                  message.eventType
                ) ||
                null,

              lead_id:
                clean(
                  message.leadId
                ) ||
                null,

              title:
                clean(
                  message.title
                ) ||
                null,

              body:
                clean(
                  message.body
                ) ||
                null,

              url:
                clean(
                  message.url
                ) ||
                null,

              context:
                message.context ||
                {},
            }),

          signal:
            controller.signal,

          cache:
            "no-store",
        }
      )

    const data =
      await response
        .json()
        .catch(
          () => null
        )

    if (
      !response.ok
    ) {
      return {
        provider:
          "ghl",
        success:
          false,
        status:
          response.status,
        error:
          data?.error ||
          `GHL HTTP ${response.status}`,
      }
    }

    return {
      provider:
        "ghl",
      success:
        true,
      status:
        response.status,
      message_id:
        clean(
          data?.message_id ||
          data?.id
        ) ||
        undefined,
    }
  } catch (
    error
  ) {
    return {
      provider:
        "ghl",
      success:
        false,
      error:
        error instanceof
          Error
          ? error.name ===
              "AbortError"
            ? "GHL webhook timeout"
            : error.message
          : String(
              error
            ),
    }
  } finally {
    clearTimeout(
      timeout
    )
  }
}
