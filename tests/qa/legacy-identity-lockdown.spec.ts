import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"

const paths = [
  "app/api/identity-webhook/route.ts",
  "app/api/identity-start/route.ts",
  "app/api/identity-status/route.ts",
  "app/api/identity/start/route.ts",
  "app/api/identity/status/route.ts",
]

test("Legacy identity routes: cannot change or disclose a verification through service role", () => {
  for (const path of paths) {
    const source = readFileSync(path, "utf8")
    expect(source).toContain("legacyIdentityDisabled")
    expect(source).not.toContain("supabaseAdmin")
    expect(source).not.toContain("identity_verifications")
  }
  const disabled = readFileSync("lib/identity/legacy-disabled.ts", "utf8")
  expect(disabled).toContain("IDENTITY_PROVIDER_NOT_CONFIGURED")
  expect(disabled).toContain("verified: false")
  expect(disabled).toContain("status: 503")
})

test("Legacy identity routes: QA rejects unauthenticated attempts without touching records", async ({ request }) => {
  for (const endpoint of [
    "/api/identity-webhook", "/api/identity-start", "/api/identity-status",
    "/api/identity/start", "/api/identity/status",
  ]) {
    const response = await request.post(endpoint, {
      data: { user_id: "arbitrary", subject_id: "arbitrary", verification_id: "arbitrary", status: "approved" },
    })
    expect(response.status()).toBe(503)
  }
})

test("Saved property detail never exposes synthetic identity or WhatsApp contacts", () => {
  const source = readFileSync("app/guardadas/[id]/page.tsx", "utf8")
  expect(source).toContain('redirect("/guardadas")')
  expect(source).not.toContain("FAKE_TENANT_ID")
  expect(source).not.toContain("wa.me")
  expect(source).not.toContain("MOCK_PROPERTY")
})
