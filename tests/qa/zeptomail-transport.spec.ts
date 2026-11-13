import { test, expect } from "@playwright/test"
import { sendWithZeptoMail, getZeptoMailReadiness } from "../../lib/notifications/zeptomail"
import { renderVerloEmail, safeVerloEmailUrl } from "../../lib/notifications/verlo-email-templates"

const message = {
  to: "tenant@example.com", subject: "Novedad VERLO", html: "<p>Prueba</p>",
  text: "Prueba", eventKey: "qa_e2e_zepto",
}

test("ZeptoMail QA: live delivery stays disabled by default", async () => {
  const result = await sendWithZeptoMail(message, { enabled: false,
    fetcher: async () => { throw Error("External email must not be sent") } })
  expect(result).toMatchObject({ accepted: false, reason: "disabled" })
})

test("ZeptoMail QA: rejects sender addresses with whitespace and never invokes provider", async () => {
  const before = process.env.VERLO_ZEPTO_FROM_EMAIL
  process.env.VERLO_ZEPTO_FROM_EMAIL = "hola @verlo.lat"
  try {
    const result = await sendWithZeptoMail(message, { enabled: true, apiKey: "qa-not-a-secret",
      fetcher: async () => { throw Error("Invalid sender should not reach provider") } })
    expect(result).toMatchObject({ accepted: false, reason: "invalid_sender" })
  } finally {
    if (before === undefined) delete process.env.VERLO_ZEPTO_FROM_EMAIL
    else process.env.VERLO_ZEPTO_FROM_EMAIL = before
  }
})

test("ZeptoMail QA: provider acceptance is not treated as actual delivery", async () => {
  let requests = 0
  const result = await sendWithZeptoMail(message, { enabled: true, apiKey: "qa-not-a-secret",
    fetcher: async (_url, options) => {
      requests++
      expect(options?.method).toBe("POST")
      return new Response(JSON.stringify({ message: "OK", data: [{ code: "EM_104" }], request_id: "qa_accepted" }), { status: 200,
        headers: { "Content-Type": "application/json" } })
    } })
  expect(requests).toBe(1)
  expect(result).toMatchObject({ accepted: true, providerId: "qa_accepted", status: 200 })
})

test("ZeptoMail QA: recipient is validated and upstream retries remain distinguishable", async () => {
  const invalid = await sendWithZeptoMail({ ...message, to: "bad recipient" },
    { enabled: true, apiKey: "qa-not-a-secret", fetcher: async () => { throw Error("No provider calls") } })
  expect(invalid.reason).toBe("invalid_recipient")
  const retryable = await sendWithZeptoMail(message, { enabled: true, apiKey: "qa-not-a-secret",
    fetcher: async () => new Response("", { status: 429 }) })
  expect(retryable).toMatchObject({ accepted: false, status: 429, reason: "retryable_http" })
})

test("VERLO emails: no external links or script injection in tenant and owner templates", () => {
  for (const role of ["tenant", "owner"] as const) {
    const result = renderVerloEmail({
      area: "tradicionales", role, type: "match_created",
      title: "<script>alert(1)</script>",
      url: "https://evil.example/malicious",
    })
    expect(result.url).toBe("https://verlo.lat/mi-verlo")
    expect(result.html).toContain("&lt;script&gt;")
    expect(result.html).not.toContain("<script>")
    expect(result.html).toContain("logo-verlo.png")
    expect(result.text).toContain("https://verlo.lat/mi-verlo")
  }
  expect(safeVerloEmailUrl("javascript:alert(1)")).toBe("https://verlo.lat/mi-verlo")
})

test("VERLO emails: caucion payment always points tenant to PowerMarket and not VERLO checkout", () => {
  const email = renderVerloEmail({ area: "powermarket", role: "tenant", type: "policy_payment_pending" })
  expect(email.text).toContain("PowerMarket")
  const ownerEmail = renderVerloEmail({ area: "powermarket", role: "owner", type: "policy_payment_pending" })
  expect(ownerEmail.text).toContain("inquilino")
  expect(ownerEmail.text).not.toContain("Confirmamos tu pago")
})

test("ZeptoMail QA: uses VERLO sender and Reply-To while accepting provider response", async () => {
  const oldFrom = process.env.VERLO_ZEPTO_FROM_EMAIL
  delete process.env.VERLO_ZEPTO_FROM_EMAIL
  try {
    const result = await sendWithZeptoMail(message, {
      enabled: true, apiKey: "qa-mock-token",
      fetcher: async (_url, options) => {
        const payload = JSON.parse(String(options?.body))
        expect(payload.from).toEqual({ address: "notificaciones@verlo.lat", name: "VERLO" })
        expect(payload.reply_to).toEqual([{ address: "hola@verlo.lat", name: "VERLO" }])
        return new Response(JSON.stringify({ message: "OK", data: [{ code: "EM_104" }], request_id: "qa-reply-to-test" }), { status: 200 })
      },
    })
    expect(result).toMatchObject({ accepted: true, providerId: "qa-reply-to-test" })
  } finally {
    if (oldFrom === undefined) delete process.env.VERLO_ZEPTO_FROM_EMAIL
    else process.env.VERLO_ZEPTO_FROM_EMAIL = oldFrom
  }
})

test("ZeptoMail QA: real outgoing requests are blocked even if enabled", async () => {
  const old = process.env.VERCEL_GIT_COMMIT_REF
  process.env.VERCEL_GIT_COMMIT_REF = "qa/verlo-e2e"
  try {
    const result = await sendWithZeptoMail(message, { enabled: true, apiKey: "qa-mock-token" })
    expect(result).toMatchObject({ accepted: false, reason: "qa_external_delivery_blocked" })
  } finally {
    if (old === undefined) delete process.env.VERCEL_GIT_COMMIT_REF
    else process.env.VERCEL_GIT_COMMIT_REF = old
  }
})

test("ZeptoMail QA: a successful HTTP code with an invalid body is not accepted", async () => {
  const result = await sendWithZeptoMail(message, {
    enabled: true, apiKey: "qa-mock-token",
    fetcher: async () => new Response(JSON.stringify({
      message: "error", data: [{ code: "TM_3004" }], request_id: "failed",
    }), { status: 200 }),
  })
  expect(result).toMatchObject({ accepted: false, reason: "unconfirmed_provider_acceptance" })
})

test("ZeptoMail readiness: does not expose secrets, never claims inbox delivery", () => {
  const status = getZeptoMailReadiness({
    VERCEL_GIT_COMMIT_REF: "qa/verlo-e2e",
    ZOHO_CPAAS_EMAIL_API_KEY: "secret-value-never-exposed",
    VERLO_ZEPTO_EMAIL_LIVE: "true",
    VERLO_EMAIL_DISPATCH_ENABLED: "true",
    VERLO_EMAIL_QUEUE_CAPTURE_ENABLED: "true",
    VERLO_EMAIL_CUTOVER_APPROVED: "true",
  })
  expect(status).toMatchObject({
    qa_isolated: true,
    sender: "notificaciones@verlo.lat",
    reply_to: "hola@verlo.lat",
    api_key_configured: true,
    can_dispatch: false,
    provider_delivery_verified: false,
  })
  expect(JSON.stringify(status)).not.toContain("secret-value-never-exposed")
})

test("ZeptoMail readiness: missing API key or cutover flags keep live dispatch locked", () => {
  const missingKey = getZeptoMailReadiness({
    VERLO_ZEPTO_EMAIL_LIVE: "true",
    VERLO_EMAIL_DISPATCH_ENABLED: "true",
    VERLO_EMAIL_CUTOVER_APPROVED: "true",
  })
  expect(missingKey.api_key_configured).toBe(false)
  expect(missingKey.can_dispatch).toBe(false)
  const noCutover = getZeptoMailReadiness({ ZOHO_CPAAS_EMAIL_API_KEY: "present" })
  expect(noCutover.can_dispatch).toBe(false)
  expect(noCutover.dispatch_approved).toBe(false)
})
