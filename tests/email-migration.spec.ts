import { test, expect } from "@playwright/test"
import { renderVerloEmail, VERLO_EMAIL_EVENT_TYPES } from "../lib/notifications/verlo-email-templates"
import { sendWithZeptoMail } from "../lib/notifications/zeptomail"
import { readFileSync } from "node:fs"

test.describe("VERLO email migration - no external deliveries", () => {
  for (const [area, types] of Object.entries(VERLO_EMAIL_EVENT_TYPES)) {
    for (const type of types) {
      test(`${area}/${type}: branded template`, () => {
        const email = renderVerloEmail({
          area: area as "tradicionales" | "temporarios" | "powermarket",
          role: "tenant", type,
        })
        expect(email.subject.length).toBeGreaterThan(4)
        expect(email.html).toContain("logo-verlo.png")
        expect(email.url).toBe("https://verlo.lat/mi-verlo")
        expect(email.text).toContain(email.url)
        expect(email.html).not.toContain("leadconnector")
      })
    }
  }


  test("integration remains disabled unless both cutover flags are set", () => {
    const source = readFileSync("lib/notifications/verlo-email-outbox.ts", "utf8")
    expect(source).toContain('VERLO_EMAIL_QUEUE_CAPTURE_ENABLED !== "true"')
    expect(source).toContain('VERLO_EMAIL_CUTOVER_APPROVED !== "true"')
    expect(source).toContain('error?.code === "23505"')
    const dispatcher = readFileSync("app/api/admin/email-dispatch/route.ts", "utf8")
    expect(dispatcher).toContain('VERLO_EMAIL_DISPATCH_ENABLED === "true"')
    expect(dispatcher).toContain('VERLO_ZEPTO_EMAIL_LIVE === "true"')
    expect(dispatcher).toContain('VERLO_EMAIL_CUTOVER_APPROVED === "true"')
  })

  test("powerMarket email capture is independent of Push and still unscheduled", () => {
    const push = readFileSync("app/api/cron/powermarket-push/route.ts", "utf8")
    expect(push).not.toContain("enqueueVerloEmailSafely")
    const capture = readFileSync("app/api/admin/powermarket-email-capture/route.ts", "utf8")
    expect(capture).toContain("enqueueVerloEmailSafely")
    expect(capture).toContain('VERLO_EMAIL_CUTOVER_APPROVED === "true"')
    expect(capture).toContain('VERLO_EMAIL_QUEUE_CAPTURE_ENABLED === "true"')
    expect(capture).toContain('2026-11-03T12:00:00Z')
    const cron = readFileSync("vercel.json", "utf8")
    expect(cron).not.toContain("/api/admin/email-dispatch")
    expect(cron).not.toContain("/api/admin/powermarket-email-capture")
  })

  test("traditional and temporary capture remain gated", () => {
    for (const filename of [
      "lib/lead-notifications.ts",
      "app/api/temporarios/notifications/dispatch/route.ts",
    ]) expect(readFileSync(filename, "utf8")).toContain("enqueueVerloEmailSafely")
  })

  test("dynamic content is HTML escaped", () => {
    const email = renderVerloEmail({
      area: "tradicionales", role: "owner", type: "match_created",
      title: "<script>alert('x')</script>", body: "<img src=x onerror=alert(1)>",
    })
    expect(email.html).not.toContain("<script>")
    expect(email.html).not.toContain("<img src=x")
    expect(email.html).toContain("&lt;script&gt;")
  })

  test("unknown event fails closed", () => {
    expect(() => renderVerloEmail({
      area: "temporarios", role: "tenant", type: "unknown",
    })).toThrow("Unsupported VERLO email event")
  })

  test("disabled transport does not call fetch", async () => {
    let requests = 0
    const mockFetch = (async () => { requests++; throw new Error("must not send") }) as typeof fetch
    const result = await sendWithZeptoMail({
      to: "example@example.invalid", subject: "VERLO", html: "<p>Test</p>",
      text: "Test", eventKey: "test:dry-run",
    }, { enabled: false, fetcher: mockFetch })
    expect(result.reason).toBe("disabled")
    expect(requests).toBe(0)
  })

  test("provider acceptance with mock; no actual email sent", async () => {
    let called = false
    const mockFetch = (async (url: string | URL | Request, init?: RequestInit) => {
      called = true
      expect(String(url)).toBe("https://cpaas.zoho.com/v1.1/email")
      expect(init?.method).toBe("POST")
      const body = JSON.parse(String(init?.body))
      expect(body.to[0].email_address.address).toBe("test@example.invalid")
      expect((init?.headers as Record<string,string>).Authorization).toBe("Zoho-enczapikey test-key")
      return { ok: true, status: 200, json: async () => ({ request_id: "mock-001" }) } as Response
    }) as typeof fetch
    const result = await sendWithZeptoMail({
      to: "test@example.invalid", subject: "Test", html: "<p>Test</p>",
      text: "Test", eventKey: "test:mock",
    }, { enabled: true, apiKey: "test-key", fetcher: mockFetch })
    expect(called).toBe(true)
    expect(result.accepted).toBe(true)
    expect(result.providerId).toBe("mock-001")
  })
})
