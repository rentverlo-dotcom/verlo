import { test, expect } from "@playwright/test"
import { renderVerloEmail, VERLO_EMAIL_EVENT_TYPES, safeVerloEmailUrl } from "../lib/notifications/verlo-email-templates"
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


  test("PowerMarket emails refer to tenant-paid premium for owners", () => {
    const tenant = renderVerloEmail({
      area: "powermarket", role: "tenant", type: "policy_payment_confirmed",
    })
    const owner = renderVerloEmail({
      area: "powermarket", role: "owner", type: "policy_payment_confirmed",
    })
    expect(tenant.subject).toBe("Pago de caución confirmado")
    expect(tenant.text).not.toContain("PowerMarket")
    expect(owner.text).not.toContain("PowerMarket")
    expect(owner.subject).toBe("Pago de caución del inquilino confirmado")
    expect(owner.text).toContain("caución del inquilino")
    expect(owner.text).not.toContain("tu pago")
    const push = readFileSync("app/api/cron/powermarket-push/route.ts", "utf8")
    expect(push).toContain('d.recipient_role==="owner"?ownerCopy')
    expect(push).toContain("Pago del inquilino confirmado")
  })

  test("Temporarios queues details for stays and pending actions and validates receiver", () => {
    const temporary = readFileSync("app/api/temporarios/notifications/dispatch/route.ts", "utf8")
    expect(temporary).toContain("formatDate(checkIn)")
    expect(temporary).toContain("formatDate(checkOut)")
    expect(temporary).toContain("actionText")
    expect(temporary).toContain("Recipient does not belong to this temporary match")
    expect(temporary).toContain('owner ? "owner_user_id" : "tenant_user_id"')
  })

  test("public caucion push messages do not disclose the internal partner", () => {
    const push = readFileSync("app/api/cron/powermarket-push/route.ts", "utf8")
    expect(push).not.toContain('"PowerMarket, broker asociado a VERLO')
    expect(push).not.toContain('"PowerMarket confirmó')
    expect(push).not.toContain('"PowerMarket está')
    expect(push).not.toContain('"PowerMarket aprobó')
    expect(push).not.toContain('"PowerMarket solicitó')
  })

  test("all QA previews are prohibited from dispatching ZeptoMail even if switches are enabled", () => {
    const transport = readFileSync("lib/notifications/zeptomail.ts", "utf8")
    expect(transport).toContain('process.env.VERCEL_ENV !== "production"')
    const dispatch = readFileSync("app/api/admin/email-dispatch/route.ts", "utf8")
    expect(dispatch).toContain('&& process.env.VERCEL_ENV === "production"')
    const outbox = readFileSync("lib/notifications/verlo-email-outbox.ts", "utf8")
    expect(outbox).toContain('feature/signatura-qa-integration')
    expect(outbox).toContain('endsWith("@example.com")')
  })

  test("support bubble opens an in-app form and submits to VERLO support", () => {
    const component = readFileSync("components/SupportEmailBubble.tsx", "utf8")
    const endpoint = readFileSync("app/api/support/contact/route.ts", "utf8")
    const layout = readFileSync("app/layout.tsx", "utf8")
    expect(component).toContain('setOpen(!open)')
    expect(component).toContain('"/api/support/contact"')
    expect(component).toContain("Enviar consulta")
    expect(component).not.toContain("mailto:")
    expect(endpoint).toContain('const SUPPORT_ADDRESS = "soporte@verlo.lat"')
    expect(endpoint).toContain("sendZohoEmail(")
    expect(layout).toContain("<SupportEmailBubble />")
  })

  test("legacy 50-recipient cap must not be carried over to native email queue", () => {
    const legacy = readFileSync("app/api/cron/match-digest/route.ts", "utf8")
    const nativeQueue = readFileSync("lib/notifications/verlo-email-outbox.ts", "utf8")
    expect(legacy).toContain("MAX_DIGEST_PER_DAY = 50")
    expect(nativeQueue).not.toContain("MAX_DIGEST_PER_DAY")
    expect(nativeQueue).toContain('error?.code === "23505"')
  })

  test("all three business lines are included in native email rendering", () => {
    expect(Object.keys(VERLO_EMAIL_EVENT_TYPES).sort()).toEqual(
      ["powermarket", "temporarios", "tradicionales"].sort()
    )
  })

  test("event-specific links survive renderer and unsafe external links are rejected", () => {
    const path = "https://verlo.lat/cierre/example-token"
    const rendered = renderVerloEmail({
      area: "tradicionales", role: "tenant", type: "double_ok_2", url: path,
    })
    expect(rendered.url).toBe(path)
    expect(rendered.html).toContain(path)
    expect(safeVerloEmailUrl("javascript:alert(1)")).toBe("https://verlo.lat/mi-verlo")
    expect(safeVerloEmailUrl("https://other.example/")).toBe("https://verlo.lat/mi-verlo")
    expect(safeVerloEmailUrl("//other.example/")).toBe("https://verlo.lat/mi-verlo")
    expect(safeVerloEmailUrl("/matches/my-token")).toBe("https://verlo.lat/matches/my-token")
  })

  test("native queue carries event URL and copy without changing current provider", () => {
    const queue = readFileSync("lib/notifications/verlo-email-outbox.ts", "utf8")
    const dispatcher = readFileSync("app/api/admin/email-dispatch/route.ts", "utf8")
    const sql = readFileSync("supabase/migrations/20261103_verlo_email_event_destinations.sql", "utf8")
    expect(queue).toContain("destination_url:")
    expect(queue).toContain("notification_title:")
    expect(queue).toContain("notification_body:")
    expect(dispatcher).toContain("item.destination_url")
    expect(sql).toContain("add column if not exists destination_url")
    expect(readFileSync("lib/lead-notifications.ts", "utf8")).toContain("url, title, body,")
    expect(readFileSync("app/api/temporarios/notifications/dispatch/route.ts", "utf8"))
      .toContain('url: "https://verlo.lat/temporarios/mi-verlo"')
  })

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

  test("partner payment confirmation captures one email per contract participant without external send", () => {
    const confirm = readFileSync("app/api/powermarket/confirm-operation/route.ts", "utf8")
    expect(confirm).toContain('eventType: "policy_payment_confirmed"')
    expect(confirm).toContain('recipientRole: p.role')
    expect(confirm).toContain('policy.id + ":" + p.role')
    expect(confirm).toContain('url: "/mi-verlo"')
    expect(confirm).toContain('contract.tenant_lead_id === application.tenant_lead_id')
    expect(confirm).toContain('status", "payment_confirmed"')
    expect(confirm).toContain('enqueueVerloEmailSafely')
    expect(confirm).not.toContain('sendWithZeptoMail(')
    expect(confirm).not.toContain('sendZohoEmail(')
    expect(confirm).not.toContain('sendPushToLead(')
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
      expect(body.reply_to[0].address).toBe("hola@verlo.lat")
      expect((init?.headers as Record<string,string>).Authorization).toBe("Zoho-enczapikey test-key")
      return { ok: true, status: 200, json: async () => ({ message: "OK", data: [{ code: "EM_104" }], request_id: "mock-001" }) } as Response
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
