import { createHash } from "node:crypto"
import { test, expect } from "@playwright/test"
import type { SupabaseClient } from "@supabase/supabase-js"
import { checkPowerMarketSigningApproval } from "../../lib/powermarket/signing-approval"

// Pure mock: zero traffic to Supabase, Identik, or PowerMarket.
type Row = Record<string, unknown>
const contractId = "contract-A"
const tenantLeadId = "tenant-A"
const text = "Contrato VERLO QA - versión íntegra acordada por ambas partes"
const hash = createHash("sha256").update(text, "utf8").digest("hex")
const application = (overrides: Row = {}) => ({
  id: "application-A", tenant_lead_id: tenantLeadId, status: "prequalified",
  decision_expires_at: "2099-01-01T00:00:00Z", created_at: "2026-11-01", ...overrides,
})
const review = (overrides: Row = {}) => ({
  id: "review-A", application_id: "application-A", lead_contract_id: contractId,
  status: "approved", contract_content_sha256: hash, pdf_sha256: "qa-pdf-hash",
  ...overrides,
})

function db(applications: Row[], reviews: Row[], failTable?: string): SupabaseClient {
  return {
    from(table: string) {
      let rows = (table === "caucion_applications" ? applications : reviews).slice()
      const query = {
        select(_cols: string) { return query },
        eq(field: string, value: unknown) { rows = rows.filter(row => row[field] === value); return query },
        neq(field: string, value: unknown) { rows = rows.filter(row => row[field] !== value); return query },
        order(field: string, options: { ascending: boolean }) {
          rows.sort((a, b) => options.ascending
            ? String(a[field]).localeCompare(String(b[field]))
            : String(b[field]).localeCompare(String(a[field])))
          return query
        },
        limit(n: number) {
          return Promise.resolve({ data: rows.slice(0, n),
            error: table === failTable ? { message: "QA simulated unavailable" } : null })
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}
const check = (apps: Row[], reviews: Row[], content = text, fail?: string) =>
  checkPowerMarketSigningApproval(db(apps, reviews, fail), {
    contractId, tenantLeadId, contractContent: content,
  })

test("PowerMarket signing: no caucion never blocks unrelated traditional signing", async () => {
  expect(await check([], [])).toMatchObject({ allowed: true, reason: "no_caucion" })
})
test("PowerMarket signing: approved review for exact contract and content unlocks", async () => {
  expect(await check([application()], [review()])).toMatchObject({
    allowed: true, reason: "approved", reviewId: "review-A", pdfSha256: "qa-pdf-hash",
  })
})
for (const [label, apps, reviews, reason] of [
  ["pending application", [application({ status: "submitted" })], [review()], "caucion_not_approved"],
  ["rejected application", [application({ status: "rejected" })], [review()], "caucion_not_approved"],
  ["expired decision", [application({ decision_expires_at: "2020-01-01" })], [review()], "caucion_expired"],
  ["missing review", [application()], [], "contract_review_pending"],
  ["pending review", [application()], [review({ status: "under_review" })], "contract_review_pending"],
  ["rejected review", [application()], [review({ status: "rejected" })], "contract_review_pending"],
  ["review belongs to another contract", [application()], [review({ lead_contract_id: "contract-B" })], "contract_review_pending"],
  ["multiple active reviews", [application()], [review(), review({ id: "review-B" })], "contract_review_pending"],
  ["ambiguous applications", [application(), application({ id: "application-B" })], [review()], "ambiguous_caucion"],
] as const) {
  test("PowerMarket signing blocks " + label, async () => {
    expect(await check([...apps], [...reviews])).toMatchObject({ allowed: false, reason })
  })
}
test("PowerMarket signing: content changed after approval invalidates prior review", async () => {
  expect(await check([application()], [review()], text + " edited")).toMatchObject({
    allowed: false, reason: "contract_changed",
  })
})
test("PowerMarket signing: lookup failures fail closed", async () => {
  expect(await check([application()], [review()], text, "caucion_applications")).toMatchObject({
    allowed: false, reason: "caucion_lookup_unavailable",
  })
  expect(await check([application()], [review()], text, "caucion_contract_reviews")).toMatchObject({
    allowed: false, reason: "review_lookup_unavailable",
  })
})
