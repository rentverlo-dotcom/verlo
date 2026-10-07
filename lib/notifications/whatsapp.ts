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
  legacyPayload?: Record<string, any>
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

const SITE_URL =
  (
    process.env
      .SITE_URL ||
    "https://verlo.lat"
  ).replace(
    /\/$/,
    ""
  )

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

function absoluteUrl(
  value: unknown
) {
  const raw =
    clean(
      value
    )

  if (
    !raw
  ) {
    return ""
  }

  if (
    /^https?:\/\//i.test(
      raw
    )
  ) {
    return raw
  }

  return `${SITE_URL}${
    raw.startsWith("/")
      ? raw
      : `/${raw}`
  }`
}

/**
 * Canal WhatsApp / GHL best-effort vía webhook.
 *
 * REGLA:
 * - nunca debe romper el flujo principal de Verlo;
 * - si no hay webhook configurado, se omite;
 * - si GHL falla o demora demasiado, devuelve error;
 * - push / DB / contrato siguen funcionando igual.
 *
 * Env aceptadas:
 * - GHL_TENANT_DIGEST_WEBHOOK_URL
 * - GHL_OWNER_DIGEST_WEBHOOK_URL
 * - GHL_READY_TO_CONNECT_WEBHOOK_URL
 */
export async function sendWhatsApp(
  message: WhatsAppMessage
): Promise<WhatsAppResult> {
  const eventType =
    clean(
      message.eventType ||
      message.template
    )

  const readyToConnectEvents =
    new Set([
      "double_ok_1",
      "ready_to_connect",
    ])

  let webhookUrl =
    ""

  if (
    eventType ===
    "match_digest_tenant"
  ) {
    webhookUrl =
      clean(
        process.env
          .GHL_TENANT_DIGEST_WEBHOOK_URL
      )
  }

  else if (
    eventType ===
      "owner_match_digest" ||
    eventType ===
      "tenant_verification_submitted"
  ) {
    webhookUrl =
      clean(
        process.env
          .GHL_OWNER_DIGEST_WEBHOOK_URL
      )
  }

  else if (
    readyToConnectEvents.has(
      eventType
    )
  ) {
    webhookUrl =
      clean(
        process.env
          .GHL_READY_TO_CONNECT_WEBHOOK_URL
      )
  }

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

  const absoluteMessageUrl =
    absoluteUrl(
      message.url
    )

  const absoluteMatchesUrl =
    absoluteUrl(
      message.matchesUrl ||
      message.url
    )

  const legacyPayload =
    {
      ...(
        message.legacyPayload ||
        {}
      ),
    }

  if (
    legacyPayload
      .verlo_matches_url
  ) {
    legacyPayload
      .verlo_matches_url =
      absoluteUrl(
        legacyPayload
          .verlo_matches_url
      )
  }

  if (
    legacyPayload
      .verlo_property_url
  ) {
    legacyPayload
      .verlo_property_url =
      absoluteUrl(
        legacyPayload
          .verlo_property_url
      )
  }

  if (
    legacyPayload
      .verlo_candidates_url
  ) {
    legacyPayload
      .verlo_candidates_url =
      absoluteUrl(
        legacyPayload
          .verlo_candidates_url
      )
  }

  if (
    legacyPayload
      .verlo_closing_url
  ) {
    legacyPayload
      .verlo_closing_url =
      absoluteUrl(
        legacyPayload
          .verlo_closing_url
      )
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
                absoluteMatchesUrl ||
                null,

              ...legacyPayload,

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
                absoluteMessageUrl ||
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

