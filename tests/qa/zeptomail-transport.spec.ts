import { test, expect } from "@playwright/test"
import { sendWithZeptoMail } from "../../lib/notifications/zeptomail"
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
      return new Response(JSON.stringify({ request_id: "qa_accepted" }), { status: 200,
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
