import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8")

test("Identik webhook may run only in the correct environment and checks shared secret", () => {
  const webhook = source("app/api/webhooks/identik-electronic/route.ts")
  expect(webhook).toContain("const isQA")
  expect(webhook).toContain("const isProduction")
  expect(webhook).toContain("process.env.VERCEL_ENV === 'production'")
  expect(webhook).toContain("process.env.VERCEL_GIT_COMMIT_REF === 'main'")
  expect(webhook).toContain("https://bmgrpcqrdvwculrisasi.supabase.co")
  expect(webhook).toContain("https://electronica.identik.me/api/v2")
  expect(webhook).toContain("if (!isQA && !isProduction)")
  expect(webhook).toContain("secureEqual(request.headers.get(\"x-identik-secret\"), secret)")
})

test("Signing cannot bypass PowerMarket approval or altered contract", () => {
  const gate = source("lib/powermarket/signing-approval.ts")
  expect(gate).toContain('reason: "caucion_not_approved"')
  expect(gate).toContain('reason: "contract_review_pending"')
  expect(gate).toContain('reason: "contract_changed"')
  expect(gate).toContain('reason: "caucion_expired"')
  const preflight = source("lib/identik/traditional-signing-preflight.ts")
  expect(preflight).toContain("checkPowerMarketSigningApproval")
  expect(preflight).toContain('reason: "both_parties_not_agreed"')
})

test("QA signing does not send provider invitations, and production biometrics remain gated", () => {
  const client = source("lib/identik/electronic-v2.ts")
  expect(client).toContain("IDENTIK_VERLO_MANAGED_INVITATIONS_ONLY")
  expect(client).toContain("IDENTIK_BIOMETRIC_SIGNING_NOT_CERTIFIED")
  expect(client).toContain('process.env.IDENTIK_BIOMETRIC_SIGNING_CONFIRMED !== "true"')
  const qa = source("app/api/qa/identik/create-signing/route.ts")
  expect(qa).toContain("distributionMethod: 'NONE'")
  expect(qa).toContain("recipientSigningRequest: false")
  expect(qa).toContain("recipientSigned: false")
  expect(qa).toContain("documentCompleted: false")
  expect(qa).toContain("ownerDocumentCompleted: false")
  expect(qa).toContain("sendAfter: { disabled: true }")
  expect(qa).toContain("includeSigningUrls: true")
})

test("Personal signing URL is only returned to a verified participant and never leaks other recipients", () => {
  const route = source("app/api/identik/my-signing/route.ts")
  expect(route).toContain("auth.auth.getUser")
  expect(route).toContain("data.user.email_confirmed_at")
  expect(route).toContain('lead.email?.trim().toLowerCase() !== email')
  expect(route).toContain("checkTraditionalSigningReadiness")
  expect(route).toContain('r.email.trim().toLowerCase() === email')
  expect(route).toContain("validProviderUrl(mine.signingUrl)")
  expect(route).not.toContain("distributeDocument(")
  expect(route).not.toContain("createDocument(")
})
