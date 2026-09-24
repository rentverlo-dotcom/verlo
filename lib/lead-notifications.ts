import {
  supabaseAdmin,
} from "@/lib/supabase/admin"

import {
  sendPushToLead,
} from "@/lib/push"

import {
  sendEmailToLeadOnce,
} from "@/lib/email"

import {
  sendWhatsApp,
} from "@/lib/notifications/whatsapp"

type NotifyLeadOnceInput = {
  eventKey: string
  eventType: string

  leadId: string

  entityType?: string | null
  entityId?: string | null

  title: string
  body: string
  url: string
}

type NotificationEventStatus =
  | "pending"
  | "sent"
  | "failed"

type NotificationEventRow = {
  id: string

  event_key: string
  event_type: string

  lead_id: string

  entity_type:
    | string
    | null

  entity_id:
    | string
    | null

  title: string
  body: string
  url: string

  status:
    NotificationEventStatus

  updated_at: string
}

type LeadRole =
  | "tenant"
  | "owner"

const EVENT_SELECT = `
  id,
  event_key,
  event_type,
  lead_id,
  entity_type,
  entity_id,
  title,
  body,
  url,
  status,
  updated_at
`

const PROCESSING_TIMEOUT_MS =
  2 *
  60 *
  1000

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

// ============================================================
// GHL — TOKEN ACTIVO DE INQUILINO
// ============================================================

async function getTenantMatchesToken(
  leadId: string
) {
  try {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "tenant_matches_access_tokens"
        )
        .select(
          "token, expires_at, revoked_at, created_at"
        )
        .eq(
          "tenant_lead_id",
          leadId
        )
        .is(
          "revoked_at",
          null
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
      error
    ) {
      console.error(
        "ghl tenant token lookup error:",
        {
          leadId,
          error,
        }
      )

      return null
    }

    if (
      !data
    ) {
      return null
    }

    if (
      data.expires_at &&
      new Date(
        data.expires_at
      ).getTime() <=
        Date.now()
    ) {
      return null
    }

    return clean(
      data.token
    ) ||
    null
  } catch (
    error
  ) {
    console.error(
      "ghl tenant token unexpected error:",
      {
        leadId,
        error,
      }
    )

    return null
  }
}

// ============================================================
// GHL — TOKEN ACTIVO DE PROPIETARIO
// ============================================================

async function getOwnerPropertyToken(
  leadId: string
) {
  try {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "owner_property_access_tokens"
        )
        .select(
          "token, expires_at, revoked_at, created_at"
        )
        .eq(
          "owner_lead_id",
          leadId
        )
        .is(
          "revoked_at",
          null
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
      error
    ) {
      console.error(
        "ghl owner token lookup error:",
        {
          leadId,
          error,
        }
      )

      return null
    }

    if (
      !data
    ) {
      return null
    }

    if (
      data.expires_at &&
      new Date(
        data.expires_at
      ).getTime() <=
        Date.now()
    ) {
      return null
    }

    return clean(
      data.token
    ) ||
    null
  } catch (
    error
  ) {
    console.error(
      "ghl owner token unexpected error:",
      {
        leadId,
        error,
      }
    )

    return null
  }
}

// ============================================================
// GHL — RESUMEN DE MATCHES
//
// Mantiene los mismos nombres de campos que utilizaba
// el workflow viejo de GoHighLevel.
// ============================================================

async function getGhlMatchSummary(
  leadId: string,
  role: LeadRole
) {
  const matchColumn =
    role ===
      "owner"
      ? "owner_lead_id"
      : "tenant_lead_id"

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "lead_matches"
      )
      .select(`
        id,
        score,
        income_proof_ok,
        income_amount_ok,
        guarantee_ok,
        prequalified,
        reasons,
        tenant_lead_id,
        owner_lead_id
      `)
      .eq(
        matchColumn,
        leadId
      )
      .order(
        "score",
        {
          ascending:
            false,
        }
      )

  if (
    error
  ) {
    console.error(
      "ghl match summary error:",
      {
        leadId,
        role,
        error,
      }
    )

    return {
      verlo_match_count:
        0,

      verlo_match_100_count:
        0,

      verlo_match_80_count:
        0,

      verlo_best_match_score:
        null,

      verlo_best_zone:
        null,

      verlo_best_timing:
        null,

      verlo_best_property_type:
        null,

      verlo_best_rooms:
        null,

      verlo_best_price:
        null,

      verlo_best_matches_on:
        null,

      verlo_match_summary:
        null,

      verlo_match_role:
        role,

      verlo_match_updated_at:
        new Date()
          .toISOString(),
    }
  }

  const matches =
    data ||
    []

  const match100Count =
    matches.filter(
      (
        match:
          any
      ) =>
        Number(
          match.score
        ) ===
        100
    ).length

  const match80Count =
    matches.filter(
      (
        match:
          any
      ) =>
        Number(
          match.score
        ) ===
        80
    ).length

  const bestMatch =
    matches[0] ||
    null

  const reasons =
    bestMatch?.reasons &&
    typeof bestMatch.reasons ===
      "object"
      ? bestMatch.reasons
      : {}

  const bestZone =
    role ===
      "owner"
      ? reasons
          ?.matched_tenant_neighborhood ||
        reasons
          ?.owner_neighborhood_slug ||
        null
      : reasons
          ?.owner_neighborhood_slug ||
        reasons
          ?.matched_tenant_neighborhood ||
        null

  const bestTiming =
    role ===
      "owner"
      ? reasons
          ?.tenant_move_timing ||
        null
      : reasons
          ?.owner_availability_status ||
        null

  const bestPropertyType =
    role ===
      "owner"
      ? reasons
          ?.tenant_type ||
        null
      : reasons
          ?.owner_type ||
        null

  const bestRooms =
    role ===
      "owner"
      ? reasons
          ?.tenant_rooms ||
        null
      : reasons
          ?.owner_rooms ||
        null

  const bestPrice =
    role ===
      "owner"
      ? reasons
          ?.tenant_budget_max ||
        null
      : reasons
          ?.owner_price ||
        null

  const matchesOn:
    string[] =
    []

  if (
    reasons
      ?.neighborhood_ok
  ) {
    matchesOn.push(
      "zona"
    )
  }

  if (
    reasons
      ?.type_ok
  ) {
    matchesOn.push(
      "tipo de propiedad"
    )
  }

  if (
    reasons
      ?.rooms_ok
  ) {
    matchesOn.push(
      "ambientes"
    )
  }

  if (
    reasons
      ?.price_ok
  ) {
    matchesOn.push(
      "presupuesto"
    )
  }

  if (
    reasons
      ?.time_ok
  ) {
    matchesOn.push(
      "momento de mudanza"
    )
  }

  if (
    reasons
      ?.income_proof_ok
  ) {
    matchesOn.push(
      "demostración de ingresos"
    )
  }

  if (
    reasons
      ?.income_amount_ok
  ) {
    matchesOn.push(
      "nivel de ingresos"
    )
  }

  if (
    reasons
      ?.guarantee_ok
  ) {
    matchesOn.push(
      "garantía"
    )
  }

  const summary =
    matches.length >
    0
      ? `${matches.length} matches: ${match100Count} al 100% y ${match80Count} al 80%`
      : "Todavía no encontramos matches activos"

  return {
    verlo_match_count:
      matches.length,

    verlo_match_100_count:
      match100Count,

    verlo_match_80_count:
      match80Count,

    verlo_best_match_score:
      bestMatch
        ? Number(
            bestMatch.score
          )
        : null,

    verlo_best_zone:
      bestZone,

    verlo_best_timing:
      bestTiming,

    verlo_best_property_type:
      bestPropertyType,

    verlo_best_rooms:
      bestRooms,

    verlo_best_price:
      bestPrice,

    verlo_best_matches_on:
      matchesOn.length >
      0
        ? matchesOn.join(
            ", "
          )
        : null,

    verlo_match_summary:
      summary,

    verlo_match_role:
      role,

    verlo_match_updated_at:
      new Date()
        .toISOString(),
  }
}

// ============================================================
// GHL — TAGS LEGACY
// ============================================================

function getGhlTags(
  role: LeadRole,
  intent: string
) {
  const tags =
    new Set<string>()

  tags.add(
    "verlo_lead"
  )

  if (
    role ===
    "tenant"
  ) {
    tags.add(
      "verlo_tenant"
    )
  }

  if (
    role ===
    "owner"
  ) {
    tags.add(
      "verlo_owner"
    )
  }

  if (
    intent ===
    "tenant_search"
  ) {
    tags.add(
      "verlo_tenant_search"
    )
  }

  if (
    intent ===
    "owner_new_listing"
  ) {
    tags.add(
      "verlo_owner_new_listing"
    )
  }

  if (
    intent ===
    "contract_renewal"
  ) {
    tags.add(
      "verlo_contract_renewal"
    )
  }

  return Array.from(
    tags
  )
}

// ============================================================
// MARCAR FAILED
// ============================================================

async function markFailed(
  eventId: string,
  message: string
) {
  const now =
    new Date()
      .toISOString()

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "lead_notification_events"
      )
      .update({
        status:
          "failed",

        last_error:
          message,

        updated_at:
          now,
      })
      .eq(
        "id",
        eventId
      )
      .eq(
        "status",
        "pending"
      )

  if (
    error
  ) {
    console.error(
      "notification mark failed error:",
      {
        eventId,
        error,
      }
    )
  }
}

// ============================================================
// MARCAR SENT
// ============================================================

async function markSent(
  eventId: string,
  failedCount: number
) {
  const now =
    new Date()
      .toISOString()

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "lead_notification_events"
      )
      .update({
        status:
          "sent",

        sent_at:
          now,

        last_error:
          failedCount > 0
            ? `${failedCount} device(s) failed`
            : null,

        updated_at:
          now,
      })
      .eq(
        "id",
        eventId
      )
      .eq(
        "status",
        "pending"
      )

  if (
    error
  ) {
    throw error
  }
}

// ============================================================
// ENTREGAR EVENTO
//
// IMPORTANTE:
// sendPushToLead puede enviar a más de un dispositivo físico
// del MISMO lead.
//
// Eso sigue siendo UN evento lógico.
// ============================================================

async function deliverEvent(
  event:
    NotificationEventRow
) {
  try {
    const result =
      await sendPushToLead(
        event.lead_id,
        {
          title:
            event.title,

          body:
            event.body,

          url:
            event.url,
        }
      )

    const sentCount =
      Number(
        result?.sent ||
        0
      )

    const failedCount =
      Number(
        result?.failed ||
        0
      )

    // ========================================================
    // AL MENOS UN DISPOSITIVO RECIBIÓ
    // ========================================================

    if (
      sentCount >
      0
    ) {
      await markSent(
        event.id,
        failedCount
      )

      return {
        ok: true,

        sent: true,

        duplicate:
          false,

        event_id:
          event.id,

        devices_sent:
          sentCount,

        devices_failed:
          failedCount,
      }
    }

    // ========================================================
    // NINGÚN DISPOSITIVO RECIBIÓ
    //
    // Lo dejamos FAILED para que pueda reintentarse cuando
    // vuelva a registrarse una suscripción Push.
    // ========================================================

    const message =
      failedCount > 0
        ? "Push delivery failed"
        : "No active push subscriptions"

    await markFailed(
      event.id,
      message
    )

    return {
      ok: false,

      sent: false,

      duplicate:
        false,

      event_id:
        event.id,

      devices_sent:
        sentCount,

      devices_failed:
        failedCount,

      error:
        message,
    }
  } catch (
    error
  ) {
    const message =
      error instanceof
      Error
        ? error.message
        : String(
            error
          )

    await markFailed(
      event.id,
      message
    )

    console.error(
      "notification delivery error:",
      {
        eventKey:
          event.event_key,

        leadId:
          event.lead_id,

        error,
      }
    )

    return {
      ok: false,

      sent: false,

      duplicate:
        false,

      event_id:
        event.id,

      error:
        message,
    }
  }
}

// ============================================================
// CLAIM SEGURO
//
// Hace compare-and-set usando:
// - id
// - status anterior
// - updated_at anterior
//
// Así dos requests simultáneos NO pueden reclamar
// el mismo evento.
// ============================================================

async function claimEvent(
  event:
    NotificationEventRow
) {
  const now =
    new Date()
      .toISOString()

  const {
    data:
      claimedEvent,

    error:
      claimError,
  } =
    await supabaseAdmin
      .from(
        "lead_notification_events"
      )
      .update({
        status:
          "pending",

        last_error:
          null,

        updated_at:
          now,
      })
      .eq(
        "id",
        event.id
      )
      .eq(
        "status",
        event.status
      )
      .eq(
        "updated_at",
        event.updated_at
      )
      .select(
        EVENT_SELECT
      )
      .maybeSingle()

  if (
    claimError
  ) {
    throw claimError
  }

  return claimedEvent
    ? (
        claimedEvent as
          NotificationEventRow
      )
    : null
}

// ============================================================
// NOTIFICACIÓN LÓGICA EXACTAMENTE UNA VEZ
// ============================================================

export async function notifyLeadOnce(
  input:
    NotifyLeadOnceInput
) {
  const eventKey =
    clean(
      input.eventKey
    )

  const eventType =
    clean(
      input.eventType
    )

  const leadId =
    clean(
      input.leadId
    )

  const entityType =
    clean(
      input.entityType
    ) ||
    null

  const entityId =
    clean(
      input.entityId
    ) ||
    null

  const title =
    clean(
      input.title
    )

  const body =
    clean(
      input.body
    )

  const url =
    clean(
      input.url
    )

  if (
    !eventKey ||
    !eventType ||
    !leadId ||
    !title ||
    !body ||
    !url
  ) {
    throw new Error(
      "Invalid notification event"
    )
  }

  try {
    const emailResult =
      await sendEmailToLeadOnce({
        eventKey,
        leadId,
        title,
        body,
        url,
      })

    const emailSkipped =
      "skipped" in emailResult &&
      emailResult.skipped ===
        true

    if (
      !emailResult?.ok &&
      !emailSkipped
    ) {
      console.error(
        "email notification delivery error:",
        {
          eventKey,
          leadId,
          result:
            emailResult,
        }
      )
    }
  } catch (
    emailError
  ) {
    console.error(
      "email notification unexpected error:",
      {
        eventKey,
        leadId,
        error:
          emailError,
      }
    )
  }

  const now =
    new Date()
      .toISOString()

  // =========================================================
  // 1. INTENTAR CREAR EVENTO
  //
  // event_key UNIQUE es la primera barrera anti-duplicados.
  // =========================================================

  const {
    data:
      insertedEvent,

    error:
      insertError,
  } =
    await supabaseAdmin
      .from(
        "lead_notification_events"
      )
      .insert({
        event_key:
          eventKey,

        event_type:
          eventType,

        lead_id:
          leadId,

        entity_type:
          entityType,

        entity_id:
          entityId,

        title,

        body,

        url,

        status:
          "pending",

        updated_at:
          now,
      })
      .select(
        EVENT_SELECT
      )
      .maybeSingle()

  // =========================================================
  // 2. EVENTO NUEVO
  // =========================================================

  if (
    !insertError &&
    insertedEvent
  ) {
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
          full_name,
          email,
          phone,
          phone_normalized,
          role,
          intent
        `)
        .eq(
          "id",
          leadId
        )
        .maybeSingle()

    if (
      leadError
    ) {
      console.error(
        "whatsapp lead lookup error:",
        {
          eventKey,
          leadId,
          error:
            leadError,
        }
      )
    }

    const leadRole =
      lead?.role ===
        "owner" ||
      lead?.role ===
        "tenant"
        ? (
            lead.role as
              LeadRole
          )
        : undefined

    const leadIntent =
      clean(
        lead?.intent
      )

    let matchSummary:
      Awaited<
        ReturnType<
          typeof getGhlMatchSummary
        >
      > |
      null =
      null

    if (
      leadRole
    ) {
      matchSummary =
        await getGhlMatchSummary(
          leadId,
          leadRole
        )
    }

    let tenantMatchesToken:
      string |
      null =
      null

    let ownerPropertyToken:
      string |
      null =
      null

    if (
      leadRole ===
      "tenant"
    ) {
      tenantMatchesToken =
        await getTenantMatchesToken(
          leadId
        )
    }

    if (
      leadRole ===
      "owner"
    ) {
      ownerPropertyToken =
        await getOwnerPropertyToken(
          leadId
        )
    }

    const fullName =
      clean(
        lead?.full_name
      )

    const firstName =
      fullName
        .split(
          /\s+/
        )[0] ||
      ""

    const phone =
      clean(
        lead
          ?.phone_normalized ||
        lead
          ?.phone
      )

    const matchesUrl =
      tenantMatchesToken
        ? `/matches/${tenantMatchesToken}`
        : (
            leadRole ===
              "tenant" &&
            url.startsWith(
              "/matches/"
            )
              ? url
              : null
          )

    const propertyUrl =
      ownerPropertyToken
        ? `/propiedad/${ownerPropertyToken}`
        : (
            leadRole ===
              "owner" &&
            url.startsWith(
              "/propiedad/"
            )
              ? url
              : null
          )

    const tags =
      leadRole
        ? getGhlTags(
            leadRole,
            leadIntent
          )
        : []

    const legacyGhlPayload = {
      full_name:
        fullName ||
        null,

      first_name:
        firstName ||
        null,

      email:
        clean(
          lead?.email
        ) ||
        null,

      phone:
        phone ||
        null,

      role:
        leadRole ||
        null,

      intent:
        leadIntent ||
        null,

      tags,

      source:
        "verlo",

      verlo_match_count:
        matchSummary
          ?.verlo_match_count ??
        0,

      verlo_match_100_count:
        matchSummary
          ?.verlo_match_100_count ??
        0,

      verlo_match_80_count:
        matchSummary
          ?.verlo_match_80_count ??
        0,

      verlo_best_match_score:
        matchSummary
          ?.verlo_best_match_score ??
        null,

      verlo_best_zone:
        matchSummary
          ?.verlo_best_zone ??
        null,

      verlo_best_timing:
        matchSummary
          ?.verlo_best_timing ??
        null,

      verlo_best_property_type:
        matchSummary
          ?.verlo_best_property_type ??
        null,

      verlo_best_rooms:
        matchSummary
          ?.verlo_best_rooms ??
        null,

      verlo_best_price:
        matchSummary
          ?.verlo_best_price ??
        null,

      verlo_best_matches_on:
        matchSummary
          ?.verlo_best_matches_on ??
        null,

      verlo_match_summary:
        matchSummary
          ?.verlo_match_summary ??
        null,

          verlo_match_role:
        (
          matchSummary
            ?.verlo_match_role ??
          leadRole
        ) ||
        null,

      verlo_match_updated_at:
        matchSummary
          ?.verlo_match_updated_at ??
        new Date()
          .toISOString(),

      verlo_matches_token:
        tenantMatchesToken,

      verlo_matches_url:
        matchesUrl,

      verlo_property_token:
        ownerPropertyToken,

      verlo_property_url:
        propertyUrl,
    }

    const whatsappPromise =
      sendWhatsApp({
        to:
          phone ||
          undefined,

        role:
          leadRole,

        matchCount:
          matchSummary
            ?.verlo_match_count ??
          0,

        matchesUrl:
          matchesUrl ||
          url,

        legacyPayload:
          legacyGhlPayload,

        template:
          eventType,

        eventKey,
        eventType,
        leadId,
        title,
        body,
        url,

        context: {
          entity_type:
            entityType,

          entity_id:
            entityId,
        },
      })
        .then(
          (
            result
          ) => {
            if (
              !result.success &&
              !result.skipped
            ) {
              console.error(
                "whatsapp notification delivery error:",
                {
                  eventKey,
                  leadId,
                  result,
                }
              )
            }

            return result
          }
        )
        .catch(
          (
            whatsappError
          ) => {
            console.error(
              "whatsapp notification unexpected error:",
              {
                eventKey,
                leadId,
                error:
                  whatsappError,
              }
            )

            return null
          }
        )

    // Push y WhatsApp salen en paralelo.
    // El resultado comercial de GHL nunca modifica el resultado
    // del evento principal ni puede romper el flujo de Verlo.
    const [
      pushResult,
    ] =
      await Promise.all([
        deliverEvent(
          insertedEvent as
            NotificationEventRow
        ),

        whatsappPromise,
      ])

    return pushResult
  }

  // =========================================================
  // 3. ERROR QUE NO ES DUPLICADO
  // =========================================================

  if (
    insertError?.code !==
    "23505"
  ) {
    throw (
      insertError ||
      new Error(
        "Could not create notification event"
      )
    )
  }

  // =========================================================
  // 4. YA EXISTE EVENT_KEY
  // =========================================================

  const {
    data:
      existingEvent,

    error:
      existingError,
  } =
    await supabaseAdmin
      .from(
        "lead_notification_events"
      )
      .select(
        EVENT_SELECT
      )
      .eq(
        "event_key",
        eventKey
      )
      .maybeSingle()

  if (
    existingError
  ) {
    throw existingError
  }

  if (
    !existingEvent
  ) {
    throw new Error(
      "Notification event not found"
    )
  }

  const event =
    existingEvent as
      NotificationEventRow

  // =========================================================
  // 5. YA FUE ENVIADO
  //
  // Nunca reenviar.
  // =========================================================

  if (
    event.status ===
    "sent"
  ) {
    return {
      ok: true,

      sent: false,

      duplicate:
        true,

      reason:
        "already_sent",

      event_id:
        event.id,
    }
  }

  // =========================================================
  // 6. PENDING RECIENTE
  //
  // Otro request probablemente lo está procesando.
  // =========================================================

  if (
    event.status ===
    "pending"
  ) {
    const updatedAtMs =
      new Date(
        event.updated_at
      ).getTime()

    const stale =
      !Number.isFinite(
        updatedAtMs
      ) ||
      (
        Date.now() -
          updatedAtMs >
        PROCESSING_TIMEOUT_MS
      )

    if (
      !stale
    ) {
      return {
        ok: true,

        sent: false,

        duplicate:
          true,

        reason:
          "already_processing",

        event_id:
          event.id,
      }
    }
  }

  // =========================================================
  // 7. FAILED O PENDING VIEJO
  //
  // Intentamos reclamarlo con compare-and-set.
  // =========================================================

  const claimedEvent =
    await claimEvent(
      event
    )

  if (
    !claimedEvent
  ) {
    return {
      ok: true,

      sent: false,

      duplicate:
        true,

      reason:
        "already_claimed",

      event_id:
        event.id,
    }
  }

  // =========================================================
  // 8. SOLO EL REQUEST QUE GANÓ EL CLAIM ENVÍA
  // =========================================================

  return deliverEvent(
    claimedEvent
  )
}

// ============================================================
// REINTENTAR EVENTOS FALLIDOS DE UN LEAD
//
// Se usa después de registrar / recuperar una suscripción Push.
//
// IMPORTANTE:
// registrar un dispositivo NO crea eventos de negocio.
// Solamente intenta entregar eventos YA EXISTENTES y FAILED.
// ============================================================

export async function retryFailedLeadNotifications(
  leadIdInput: string
) {
  const leadId =
    clean(
      leadIdInput
    )

  if (
    !leadId
  ) {
    return {
      ok: false,

      retried:
        0,

      sent:
        0,
    }
  }

  const {
    data:
      events,

    error,
  } =
    await supabaseAdmin
      .from(
        "lead_notification_events"
      )
      .select(
        EVENT_SELECT
      )
      .eq(
        "lead_id",
        leadId
      )
      .eq(
        "status",
        "failed"
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      )
      .limit(
        20
      )

  if (
    error
  ) {
    throw error
  }

  let retried =
    0

  let sent =
    0

  for (
    const row
    of events ||
    []
  ) {
    const event =
      row as
        NotificationEventRow

    // ========================================================
    // CLAIM ATÓMICO DEL FAILED
    //
    // Si otro request ya lo tomó, devuelve null.
    // ========================================================

    let claimedEvent:
      NotificationEventRow |
      null =
      null

    try {
      claimedEvent =
        await claimEvent(
          event
        )
    } catch (
      claimError
    ) {
      console.error(
        "notification retry claim error:",
        {
          eventKey:
            event.event_key,

          leadId:
            event.lead_id,

          error:
            claimError,
        }
      )

      continue
    }

    if (
      !claimedEvent
    ) {
      continue
    }

    retried +=
      1

    const result =
      await deliverEvent(
        claimedEvent
      )

    if (
      result.sent
    ) {
      sent +=
        1
    }
  }

  return {
    ok: true,

    retried,

    sent,
  }
}
