import tls from "node:tls"

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
  subject: string
  body: string
  url: string
  status:
    | "pending"
    | "sent"
    | "failed"
  updated_at: string
}

const SITE_URL =
  (
    process.env
      .SITE_URL ||
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

async function sendZohoEmail(
  to: string,
  subject: string,
  body: string,
  url: string,
  eventKey: string
) {
  const host =
    clean(
      process.env
        .ZOHO_SMTP_HOST
    ) ||
    "smtp.zoho.com"

  const port =
    Number(
      process.env
        .ZOHO_SMTP_PORT ||
      465
    )

  const user =
    clean(
      process.env
        .ZOHO_SMTP_USER
    )

  const pass =
    clean(
      process.env
        .ZOHO_SMTP_PASS
    )

  const from =
    clean(
      process.env
        .EMAIL_FROM
    ) ||
    `Verlo <${user}>`

  if (
    !user ||
    !pass ||
    !Number.isFinite(
      port
    )
  ) {
    return {
      ok: false,
      configured:
        false,
      provider_id:
        null,
      error:
        "Zoho SMTP not configured",
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

  const boundary =
    `verlo-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`

  const encodedSubject =
    Buffer
      .from(
        subject,
        "utf8"
      )
      .toString(
        "base64"
      )

  const textBody =
    `${body}\n\nAbrir Verlo: ${targetUrl}`

  const message =
    [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${encodedSubject}?=`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${eventKey.replace(/[^a-zA-Z0-9._-]/g, "-")}@verlo.lat>`,
      `X-Verlo-Event-Key: ${eventKey}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      textBody,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "",
      html,
      "",
      `--${boundary}--`,
      "",
    ]
      .join(
        "\r\n"
      )
      .replace(
        /^\./gm,
        ".."
      )

  return await new Promise<{
    ok: boolean
    configured: boolean
    provider_id: string | null
    error?: string
  }>(
    (
      resolve
    ) => {
      let settled =
        false

      function finish(
        result: {
          ok: boolean
          configured: boolean
          provider_id: string | null
          error?: string
        }
      ) {
        if (
          settled
        ) {
          return
        }

        settled =
          true

        resolve(
          result
        )
      }

      const socket =
        tls.connect({
          host,
          port,
          servername:
            host,
          rejectUnauthorized:
            true,
        })

      let buffer =
        ""

      const waiters:
        Array<{
          expected:
            number[]
          resolve:
            () => void
          reject:
            (
              error:
                Error
            ) => void
        }> = []

      function consumeResponse() {
        while (
          waiters.length >
          0
        ) {
          const lines =
            buffer.split(
              "\r\n"
            )

          if (
            lines.length <
            2
          ) {
            return
          }

          const first =
            lines[0]
              .match(
                /^(\d{3})([ -])/
              )

          if (
            !first
          ) {
            return
          }

          const code =
            Number(
              first[1]
            )

          let endIndex =
            -1

          for (
            let i = 0;
            i <
            lines.length -
              1;
            i += 1
          ) {
            if (
              lines[i]
                .startsWith(
                  `${code} `
                )
            ) {
              endIndex =
                i

              break
            }
          }

          if (
            endIndex <
            0
          ) {
            return
          }

          const responseLines =
            lines.slice(
              0,
              endIndex +
                1
            )

          buffer =
            lines
              .slice(
                endIndex +
                  1
              )
              .join(
                "\r\n"
              )

          const waiter =
            waiters.shift()

          if (
            !waiter
          ) {
            return
          }

          if (
            waiter.expected
              .includes(
                code
              )
          ) {
            waiter.resolve()
          } else {
            waiter.reject(
              new Error(
                `SMTP ${code}: ${responseLines.join(" | ")}`
              )
            )
          }
        }
      }

      socket.on(
        "data",
        (
          chunk
        ) => {
          buffer +=
            chunk.toString(
              "utf8"
            )

          consumeResponse()
        }
      )

      function waitFor(
        expected:
          number[]
      ) {
        return new Promise<void>(
          (
            resolveCommand,
            rejectCommand
          ) => {
            waiters.push({
              expected,
              resolve:
                resolveCommand,
              reject:
                rejectCommand,
            })

            consumeResponse()
          }
        )
      }

      async function command(
        value:
          string,
        expected:
          number[]
      ) {
        socket.write(
          `${value}\r\n`
        )

        await waitFor(
          expected
        )
      }

      socket.setTimeout(
        15000
      )

      socket.on(
        "timeout",
        () => {
          socket.destroy()

          finish({
            ok: false,
            configured:
              true,
            provider_id:
              null,
            error:
              "Zoho SMTP timeout",
          })
        }
      )

      socket.on(
        "error",
        (
          error
        ) => {
          finish({
            ok: false,
            configured:
              true,
            provider_id:
              null,
            error:
              error.message,
          })
        }
      )

      socket.on(
        "secureConnect",
        async () => {
          try {
            await waitFor(
              [
                220,
              ]
            )

            await command(
              "EHLO verlo.lat",
              [
                250,
              ]
            )

            await command(
              "AUTH LOGIN",
              [
                334,
              ]
            )

            await command(
              Buffer
                .from(
                  user,
                  "utf8"
                )
                .toString(
                  "base64"
                ),
              [
                334,
              ]
            )

            await command(
              Buffer
                .from(
                  pass,
                  "utf8"
                )
                .toString(
                  "base64"
                ),
              [
                235,
              ]
            )

            await command(
              `MAIL FROM:<${user}>`,
              [
                250,
              ]
            )

            await command(
              `RCPT TO:<${to}>`,
              [
                250,
                251,
              ]
            )

            await command(
              "DATA",
              [
                354,
              ]
            )

            socket.write(
              `${message}\r\n.\r\n`
            )

            await waitFor(
              [
                250,
              ]
            )

            socket.end(
              "QUIT\r\n"
            )

            finish({
              ok: true,
              configured:
                true,
              provider_id:
                eventKey,
            })
          } catch (
            error
          ) {
            socket.destroy()

            finish({
              ok: false,
              configured:
                true,
              provider_id:
                null,
              error:
                error instanceof
                Error
                  ? error.message
                  : "Zoho SMTP error",
            })
          }
        }
      )
    }
  )
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
        "id, event_key, lead_id, email, subject, body, url, status, updated_at"
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
          "id, event_key, lead_id, email, subject, body, url, status, updated_at"
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
          "id, event_key, lead_id, email, subject, body, url, status, updated_at"
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
    await sendZohoEmail(
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


export async function retryFailedLeadEmails(
  leadIdInput: string,
  limitInput = 3
) {
  const leadId =
    clean(
      leadIdInput
    )

  const limit =
    Math.min(
      Math.max(
        Number(
          limitInput ||
          1
        ),
        1
      ),
      3
    )

  if (
    !leadId
  ) {
    return {
      ok: false,
      retried: 0,
      sent: 0,
    }
  }

  const retryBefore =
    new Date(
      Date.now() -
        5 *
          60 *
          1000
    ).toISOString()

  const {
    data:
      failedEvents,

    error,
  } =
    await supabaseAdmin
      .from(
        "lead_email_events"
      )
      .select(
        "id, event_key, lead_id, email, subject, body, url, status, updated_at"
      )
      .eq(
        "lead_id",
        leadId
      )
      .eq(
        "status",
        "failed"
      )
      .lte(
        "updated_at",
        retryBefore
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      )
      .limit(
        limit
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
    of failedEvents ||
      []
  ) {
    const event =
      row as
        EmailEventRow

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
          event.id
        )
        .eq(
          "status",
          "failed"
        )
        .eq(
          "updated_at",
          event.updated_at
        )
        .select(
          "id, event_key, lead_id, email, subject, body, url, status, updated_at"
        )
        .maybeSingle()

    if (
      claimError ||
      !claimed
    ) {
      continue
    }

    retried +=
      1

    const result =
      await sendZohoEmail(
        event.email,
        event.subject,
        event.body,
        event.url,
        event.event_key
      )

    if (
      !result.ok
    ) {
      await markEmailFailed(
        event.id,
        result.error ||
          "Email delivery failed"
      )

      continue
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
          event.id
        )

    if (
      !sentError
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
