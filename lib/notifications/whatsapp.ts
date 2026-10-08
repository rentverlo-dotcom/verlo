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


function ghlPhone(
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

  const digits =
    raw.replace(
      /\D/g,
      ""
    )

  return digits
    ? `+${digits}`
    : ""
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

              full_name:
                clean(
                  legacyPayload
                    .full_name
                ) ||
                null,

              first_name:
                clean(
                  legacyPayload
                    .first_name
                ) ||
                null,

              email:
                clean(
                  legacyPayload
                    .email
                ) ||
                null,

              phone:
                ghlPhone(
                  legacyPayload
                    .phone ||
                  message.to
                ) ||
                null,

              to:
                ghlPhone(
                  message.to ||
                  legacyPayload
                    .phone
                ) ||
                null,

              role:
                message.role ||
                clean(
                  legacyPayload
                    .role
                ) ||
                null,

              intent:
                clean(
                  legacyPayload
                    .intent
                ) ||
                null,

              verlo_match_count:
                Number(
                  legacyPayload
                    .verlo_match_count ??
                  message.matchCount ??
                  0
                ),

              verlo_match_100_count:
                Number(
                  legacyPayload
                    .verlo_match_100_count ??
                  0
                ),

              verlo_match_80_count:
                Number(
                  legacyPayload
                    .verlo_match_80_count ??
                  0
                ),

              verlo_best_match_score:
                legacyPayload
                  .verlo_best_match_score ??
                null,

              verlo_best_zone:
                clean(
                  legacyPayload
                    .verlo_best_zone
                ) ||
                null,

              verlo_best_timing:
                clean(
                  legacyPayload
                    .verlo_best_timing
                ) ||
                null,

              verlo_best_property_type:
                clean(
                  legacyPayload
                    .verlo_best_property_type
                ) ||
                null,

              verlo_best_rooms:
                clean(
                  legacyPayload
                    .verlo_best_rooms
                ) ||
                null,

              verlo_best_price:
                clean(
                  legacyPayload
                    .verlo_best_price
                ) ||
                null,

              verlo_best_matches_on:
                clean(
                  legacyPayload
                    .verlo_best_matches_on
                ) ||
                null,

              verlo_match_summary:
                clean(
                  legacyPayload
                    .verlo_match_summary
                ) ||
                null,

              verlo_match_role:
                clean(
                  legacyPayload
                    .verlo_match_role
                ) ||
                null,

              verlo_match_updated_at:
                clean(
                  legacyPayload
                    .verlo_match_updated_at
                ) ||
                null,

              verlo_matches_token:
                clean(
                  legacyPayload
                    .verlo_matches_token
                ) ||
                null,

              verlo_matches_url:
                absoluteMatchesUrl ||
                null,

              verlo_property_token:
                clean(
                  legacyPayload
                    .verlo_property_token
                ) ||
                null,

              verlo_property_url:
                clean(
                  legacyPayload
                    .verlo_property_url
                ) ||
                null,

              verlo_candidates_token:
                clean(
                  legacyPayload
                    .verlo_candidates_token
                ) ||
                null,

              verlo_candidates_url:
                clean(
                  legacyPayload
                    .verlo_candidates_url
                ) ||
                null,

              verlo_closing_token:
                clean(
                  legacyPayload
                    .verlo_closing_token
                ) ||
                null,

              verlo_closing_url:
                clean(
                  legacyPayload
                    .verlo_closing_url
                ) ||
                null,

              template:
                clean(
                  message.template
                ),

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

              entity_type:
                clean(
                  message.context
                    ?.entity_type
                ) ||
                null,

              entity_id:
                clean(
                  message.context
                    ?.entity_id
                ) ||
                null,
            }),

          signal:
            controller.signal,

          cache:
            "no-store",
        }
      )

    const rawResponse =
      await response
        .text()
        .catch(
          () => ""
        )

    let data:
      any =
      null

    try {
      data =
        rawResponse
          ? JSON.parse(
              rawResponse
            )
          : null
    } catch {
      data =
        null
    }

    if (
      !response.ok
    ) {
      const providerDetail =
        clean(
          data?.error ||
          data?.message ||
          data?.detail ||
          rawResponse
        )

      return {
        provider:
          "ghl",

        success:
          false,

        status:
          response.status,

        error:
          providerDetail
            ? `GHL HTTP ${response.status}: ${providerDetail}`
            : `GHL HTTP ${response.status}`,
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

