import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import type { SupabaseClient } from "@supabase/supabase-js"
import { checkPowerMarketCaucionEligibility, checkPowerMarketSigningApproval } from "../../lib/powermarket/signing-approval"

// Pure, offline in-memory tests. No production/QA writes, no external providers.
const tenant = "tenant-qa-example"
const params = { contractId: "contract-example", tenantLeadId: tenant, contractContent: "changed text" }
const application = (status: string, expires: string | null = null) =>
  ({ id: "app-qa-example", tenant_lead_id: tenant, status, decision_expires_at: expires })
const policy = (status: string, confirmed: string | null = "2026-11-17T15:00:00Z") =>
  ({ id: "policy-example", status, payment_confirmed_at: confirmed,
     application_id: "app-qa-example", lead_contract_id: params.contractId })

function fixture(apps: Record<string, unknown>[],
  policies: Record<string, unknown>[] = [], failure?: string): SupabaseClient {
  return {
    from(table: string) {
      if (!["caucion_applications", "caucion_policies"].includes(table))
        throw Error("Unexpected table: " + table)
      let result = (table === "caucion_applications" ? apps : policies).slice()
      const chain = {
        select() { return chain },
        eq(field: string, value: unknown) {
          result = result.filter(row => row[field] === value); return chain
        },
        neq(field: string, value: unknown) {
          result = result.filter(row => row[field] !== value); return chain
        },
        in(field: string, values: unknown[]) {
          result = result.filter(row => values.includes(row[field])); return chain
        },
        order() { return chain },
        limit(amount: number) {
          return Promise.resolve({ data: result.slice(0, amount),
            error: failure === table ? { message: "simulated database error" } : null })
        },
      }
      return chain
    },
  } as unknown as SupabaseClient
}

test("no caucion: signing follows existing bilateral and VERLO payment gate", async () => {
  expect(await checkPowerMarketSigningApproval(fixture([]), params))
    .toMatchObject({ allowed: true, reason: "no_caucion" })
})
for (const status of ["prequalified", "alternative_offered"]) {
  test(`stage 1: approved caucion ${status} lets PowerMarket prepare policy`, async () => {
    expect(await checkPowerMarketCaucionEligibility(fixture([application(status)]), tenant))
      .toMatchObject({ allowed: true, reason: "caucion_approved" })
  })
  test(`stage 2: approved caucion ${status} without confirmed payment BLOCKS signature`, async () => {
    expect(await checkPowerMarketSigningApproval(fixture([application(status)]), params))
      .toMatchObject({ allowed: false, reason: "caucion_payment_not_confirmed" })
  })
  test(`stage 2: approved caucion ${status} with confirmed payment permits signature`, async () => {
    expect(await checkPowerMarketSigningApproval(
      fixture([application(status)], [policy("payment_confirmed")]), params))
      .toMatchObject({ allowed: true, reason: "caucion_payment_confirmed" })
  })
  test(`stage 2: issued policy ${status} with confirmed payment permits signature`, async () => {
    expect(await checkPowerMarketSigningApproval(
      fixture([application(status)], [policy("issued")]), params))
      .toMatchObject({ allowed: true, reason: "caucion_payment_confirmed" })
  })
}
for (const status of ["submitted", "under_review", "more_info_required", "not_eligible", "expired", "withdrawn"]) {
  test(`stage 1 and 2: ${status} must NOT allow signing`, async () => {
    const result = await checkPowerMarketSigningApproval(
      fixture([application(status)], [policy("payment_confirmed")]), params)
    expect(result.allowed).toBe(false)
  })
}
for (const state of ["pending", "final_review", "payment_pending", "cancelled", "rejected"]) {
  test(`no signing on unpaid policy status ${state}`, async () => {
    expect((await checkPowerMarketSigningApproval(
      fixture([application("prequalified")], [policy(state)]), params)).allowed).toBe(false)
  })
}
test("missing confirmed timestamp blocks signature", async () => {
  expect((await checkPowerMarketSigningApproval(
    fixture([application("prequalified")], [policy("payment_confirmed", null)]), params)).allowed).toBe(false)
})
test("policy for another contract cannot enable this signature", async () => {
  expect((await checkPowerMarketSigningApproval(
    fixture([application("prequalified")], [{ ...policy("payment_confirmed"), lead_contract_id: "other" }]), params)).allowed).toBe(false)
})
test("policy for another application cannot enable this signature", async () => {
  expect((await checkPowerMarketSigningApproval(
    fixture([application("prequalified")], [{ ...policy("payment_confirmed"), application_id: "other" }]), params)).allowed).toBe(false)
})
test("duplicate confirmation records fail closed", async () => {
  expect((await checkPowerMarketSigningApproval(
    fixture([application("prequalified")], [policy("payment_confirmed"), {...policy("issued"), id: "second"}]), params)).allowed).toBe(false)
})
test("expired caucion remains blocked even when payment confirmed", async () => {
  expect((await checkPowerMarketSigningApproval(
    fixture([application("prequalified", "2020-01-01T00:00:00Z")], [policy("payment_confirmed")]), params)).allowed).toBe(false)
})
test("malformed expiration blocks", async () => {
  expect((await checkPowerMarketSigningApproval(
    fixture([application("prequalified", "broken")], [policy("payment_confirmed")]), params)).allowed).toBe(false)
})
test("ambiguous applications fail closed", async () => {
  expect((await checkPowerMarketSigningApproval(fixture([
    application("prequalified"), { ...application("prequalified"), id: "other" },
  ]), params)).allowed).toBe(false)
})
for (const failure of ["caucion_applications", "caucion_policies"]) {
  test(`lookup failure in ${failure} blocks signature`, async () => {
    expect((await checkPowerMarketSigningApproval(
      fixture([application("prequalified")], [policy("payment_confirmed")], failure), params)).allowed).toBe(false)
  })
}
test("PowerMarket has no contractual content approval or changes API", () => {
  const route = readFileSync("app/api/powermarket/contract-reviews/route.ts", "utf8")
  const ui = readFileSync("app/powermarket/page.tsx", "utf8")
  expect(route).toContain("CONTRACT_REVIEW_DECISIONS_DISABLED")
  expect(route).not.toContain("caucion_decide_contract_review")
  expect(ui).not.toContain("Aprobar esta versión")
  expect(ui).not.toContain("Solicitar correcciones")
  expect(ui).toContain("Abrir PDF privado")
})
test("policy preparation uses precalification, signed contracts use payment confirmation", () => {
  const policyApi = readFileSync("app/api/powermarket/policies/route.ts", "utf8")
  const certificate = readFileSync("app/api/powermarket/policy-certificate/route.ts", "utf8")
  const signing = readFileSync("lib/identik/traditional-signing-preflight.ts", "utf8")
  expect(policyApi).toContain("checkPowerMarketCaucionEligibility")
  expect(policyApi).not.toContain("checkPowerMarketSigningApproval")
  expect(certificate).toContain("checkPowerMarketSigningApproval")
  expect(signing).toContain("checkPowerMarketSigningApproval")
})
