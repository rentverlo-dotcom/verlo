import { test, expect } from "@playwright/test"
import { renderVerloEmail, VERLO_EMAIL_EVENT_TYPES } from "../lib/notifications/verlo-email-templates"
import { sendWithZeptoMail } from "../lib/notifications/zeptomail"

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
