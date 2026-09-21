import {
  supabaseAdmin,
} from "@/lib/supabase/admin"

type EmailPayload = {
  eventKey: string
  leadId: string
  title: string
  body: string
  url: string
}

type EmailEventRow = {
  id: string
  event_key: string
  lead_id: string
  email: string
  status:
    | "pending"
    | "sent"
    | "failed"
  updated_at: string
}

const SITE_URL =
  (
    process.env
      .NEXT_PUBLIC_SITE_URL ||
    "https://verlo.lat"
  ).replace(
    /\/$/,
    ""
  )

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

function absoluteUrl(
  value: string
) {
  const url =
    clean(
      value
    )

  if (
    /^https?:\/\//i.test(
      url
    )
  ) {
    return url
  }

  return `${SITE_URL}${
    url.startsWith("/")
      ? url
      : `/${url}`
  }`
}

function escapeHtml(
  value: string
) {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    )
}

async function markEmailFailed(
  id: string,
  message: string
) {
  const now =
    new Date()
      .toISOString()

  await supabaseAdmin
    .from(
      "lead_email_events"
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
      id
    )
}

async function sendResendEmail(
  to: string,
  subject: string,
  body: string,
  url: string,
  eventKey: string
) {
  const apiKey =
    clean(
      process.env
        .RESEND_API_KEY
    )

  const from =
    clean(
      process.env
        .EMAIL_FROM
    )

  if (
    !apiKey ||
    !from
  ) {
    return {
      ok: false,
      configured:
        false,
      error:
        "Email provider not configured",
    }
  }

  const targetUrl =
    absoluteUrl(
      url
    )

  const html =
    `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;padding:32px;color:#111111">
        <div style="font-size:28px;font-weight:800;margin-bottom:24px">Verlo</div>
        <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px">${escapeHtml(subject)}</h1>
        <p style="font-size:16px;line-height:1.6;margin:0 0 28px">${escapeHtml(body)}</p>
        <a href="${escapeHtml(targetUrl)}" style="display:inline-block;background:#050002;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">
          Abrir Verlo
        </a>
        <p style="font-size:12px;line-height:1.5;color:#777777;margin-top:28px">
          Este mensaje corresponde a una novedad de tu cuenta en Verlo.
        </p>
      </div>
    `

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json",

          "Idempotency-Key":
            eventKey,
        },

        body:
          JSON.stringify({
            from,
            to: [
              to,
            ],
            subject,
            html,
            text:
              `${body}\n\nAbrir Verlo: ${targetUrl}`,
          }),
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
      ok: false,
      configured:
        true,
      error:
        clean(
          data?.message
        ) ||
        `Resend HTTP ${response.status}`,
    }
  }

  return {
    ok: true,
    configured:
      true,
    provider_id:
      clean(
        data?.id
      ) ||
      null,
  }
}

export async function sendEmailToLeadOnce(
  input:
    EmailPayload
) {
  const eventKey =
    clean(
      input.eventKey
    )

  const leadId =
    clean(
      input.leadId
    )

  if (
    !eventKey ||
    !leadId
  ) {
    return {
      ok: false,
      sent: false,
      error:
        "Invalid email notification input",
    }
  }

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
      .select(
        "id, email"
      )
      .eq(
        "id",
        leadId
      )
      .maybeSingle()

  if (
    leadError
  ) {
    return {
      ok: false,
      sent: false,
      error:
        leadError.message,
    }
  }

  const email =
    clean(
      lead?.email
    )

  if (
    !email
  ) {
    return {
      ok: true,
      sent: false,
      skipped:
        true,
      reason:
        "lead_has_no_email",
    }
  }

  const now =
    new Date()
      .toISOString()

  const {
    data:
      inserted,

    error:
      insertError,
  } =
    await supabaseAdmin
      .from(
        "lead_email_events"
      )
      .insert({
        event_key:
          eventKey,

        lead_id:
          leadId,

        email,

        subject:
          input.title,

        body:
          input.body,

        url:
          input.url,

        status:
          "pending",

        updated_at:
          now,
      })
      .select(
        "id, event_key, lead_id, email, status, updated_at"
      )
      .maybeSingle()

  let emailEvent =
    inserted as
      EmailEventRow |
      null

  if (
    insertError?.code ===
    "42P01"
  ) {
    return {
      ok: false,
      sent: false,
      configured:
        false,
      error:
        "lead_email_events table missing",
    }
  }

  if (
    insertError &&
    insertError.code !==
      "23505"
  ) {
    return {
      ok: false,
      sent: false,
      error:
        insertError.message,
    }
  }

  if (
    !emailEvent
  ) {
    const {
      data:
        existing,

      error:
        existingError,
    } =
      await supabaseAdmin
        .from(
          "lead_email_events"
        )
        .select(
          "id, event_key, lead_id, email, status, updated_at"
        )
        .eq(
          "event_key",
          eventKey
        )
        .maybeSingle()

    if (
      existingError
    ) {
      return {
        ok: false,
        sent: false,
        error:
          existingError.message,
      }
    }

    if (
      !existing
    ) {
      return {
        ok: false,
        sent: false,
        error:
          "Email event not found",
      }
    }

    emailEvent =
      existing as
        EmailEventRow

    if (
      emailEvent.status ===
      "sent"
    ) {
      return {
        ok: true,
        sent: false,
        duplicate:
          true,
        reason:
          "already_sent",
      }
    }

    if (
      emailEvent.status ===
      "pending"
    ) {
      const updatedAtMs =
        new Date(
          emailEvent
            .updated_at
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
        }
      }
    }

    const claimNow =
      new Date()
        .toISOString()

    const {
      data:
        claimed,

      error:
        claimError,
    } =
      await supabaseAdmin
        .from(
          "lead_email_events"
        )
        .update({
          status:
            "pending",

          last_error:
            null,

          updated_at:
            claimNow,
        })
        .eq(
          "id",
          emailEvent.id
        )
        .eq(
          "status",
          emailEvent.status
        )
        .eq(
          "updated_at",
          emailEvent.updated_at
        )
        .select(
          "id, event_key, lead_id, email, status, updated_at"
        )
        .maybeSingle()

    if (
      claimError
    ) {
      return {
        ok: false,
        sent: false,
        error:
          claimError.message,
      }
    }

    if (
      !claimed
    ) {
      return {
        ok: true,
        sent: false,
        duplicate:
          true,
        reason:
          "already_claimed",
      }
    }

    emailEvent =
      claimed as
        EmailEventRow
  }

  const result =
    await sendResendEmail(
      email,
      input.title,
      input.body,
      input.url,
      eventKey
    )

  if (
    !result.ok
  ) {
    await markEmailFailed(
      emailEvent.id,
      result.error ||
        "Email delivery failed"
    )

    return {
      ok: false,
      sent: false,
      configured:
        result.configured,
      error:
        result.error,
    }
  }

  const sentAt =
    new Date()
      .toISOString()

  const {
    error:
      sentError,
  } =
    await supabaseAdmin
      .from(
        "lead_email_events"
      )
      .update({
        status:
          "sent",

        sent_at:
          sentAt,

        provider_id:
          result.provider_id,

        last_error:
          null,

        updated_at:
          sentAt,
      })
      .eq(
        "id",
        emailEvent.id
      )

  if (
    sentError
  ) {
    return {
      ok: false,
      sent: false,
      error:
        sentError.message,
    }
  }

  return {
    ok: true,
    sent: true,
    email,
    provider_id:
      result.provider_id,
  }
}
