import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import type { SupabaseClient } from "@supabase/supabase-js"
import { checkPowerMarketSigningApproval } from "../../lib/powermarket/signing-approval"

// No network calls, no real QA users, no payment or contract modifications.
// Calls the actual runtime guard with controlled in-memory Supabase results.
function fixture(rows: Record<string, unknown>[], failure = false): SupabaseClient {
  return {
    from(table: string) {
      if (table !== "caucion_applications") throw Error("Unexpected table: " + table)
      let result = rows.slice()
      const chain = {
        select(fields: string) {
          expect(fields).toContain("decision_expires_at")
          return chain
        },
        eq(field: string, value: unknown) {
          result = result.filter(row => row[field] === value)
          return chain
        },
        neq(field: string, value: unknown) {
          result = result.filter(row => row[field] !== value)
          return chain
        },
        order() { return chain },
        limit(amount: number) {
          return Promise.resolve({ data: result.slice(0, amount),
            error: failure ? { message: "database offline" } : null })
        },
      }
      return chain
    },
  } as unknown as SupabaseClient
}
const tenant = "tenant-qa-example"
const params = { contractId: "contract-example", tenantLeadId: tenant, contractContent: "changed text" }
const application = (status: string, expires: string | null = null) =>
  ({ id: "app-qa-example", tenant_lead_id: tenant, status, decision_expires_at: expires })

test("regular contract has no PowerMarket contractual approval gate", async () => {
  expect(await checkPowerMarketSigningApproval(fixture([]), params))
    .toMatchObject({ allowed: true, reason: "no_caucion" })
})

for (const status of ["prequalified", "alternative_offered"]) {
  test(`valid approved caucion ${status} does not require partner approval of contract text`, async () => {
    expect(await checkPowerMarketSigningApproval(fixture([application(status)]), params))
      .toMatchObject({ allowed: true, reason: "caucion_approved" })
  })
}

for (const status of ["submitted", "under_review", "more_info_required", "not_eligible", "expired", "withdrawn"]) {
  test(`nonapproved caucion ${status} blocks policy/signing gate`, async () => {
    expect((await checkPowerMarketSigningApproval(fixture([application(status)]), params)).allowed)
      .toBe(false)
  })
}
test("expired approval remains blocked", async () => {
  expect((await checkPowerMarketSigningApproval(
    fixture([application("prequalified", "2020-01-01T00:00:00Z")]), params)).allowed).toBe(false)
})
test("invalid expiration fails closed", async () => {
  expect((await checkPowerMarketSigningApproval(
    fixture([application("prequalified", "invalid-date")]), params)).allowed).toBe(false)
})
test("ambiguous caucion applications fail closed", async () => {
  const other = { ...application("prequalified"), id: "other" }
  expect((await checkPowerMarketSigningApproval(fixture([application("prequalified"), other]), params)).allowed)
    .toBe(false)
})
test("database errors fail closed", async () => {
  expect((await checkPowerMarketSigningApproval(fixture([application("prequalified")], true), params)).allowed)
    .toBe(false)
})
test("partner can no longer change or approve a contract, including direct PATCH", () => {
  const route = readFileSync("app/api/powermarket/contract-reviews/route.ts", "utf8")
  const ui = readFileSync("app/powermarket/page.tsx", "utf8")
  expect(route).toContain("CONTRACT_REVIEW_DECISIONS_DISABLED")
  expect(route).toContain("status: 410")
  expect(route).not.toContain("caucion_decide_contract_review")
  expect(ui).not.toContain("Aprobar esta versión")
  expect(ui).not.toContain("Solicitar correcciones")
  expect(ui).toContain("Abrir PDF privado")
})
test("policy and certificate APIs use approved caucion but no contract review approval", () => {
  const policy = readFileSync("app/api/powermarket/policies/route.ts", "utf8")
  const certificate = readFileSync("app/api/powermarket/policy-certificate/route.ts", "utf8")
  const gate = readFileSync("lib/powermarket/signing-approval.ts", "utf8")
  expect(policy).not.toContain("approval.reviewId")
  expect(policy).not.toContain("aprobación vigente del contrato de PowerMarket")
  expect(certificate).not.toContain("revisión vigente aprobada")
  expect(gate).not.toContain('from("caucion_contract_reviews")')
  expect(gate).toContain('"caucion_not_approved"')
  expect(gate).toContain('"caucion_expired"')
})
