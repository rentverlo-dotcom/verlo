import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  getVerloContractPricing,
  CONTRACT_FEE_ARS,
  CAUCION_BONIFIED_FEE_ARS,
} from "../lib/payments/caucion-contract-discount"

// No network, no DB credentials, no real payments or customer rows.
type RecordRow = Record<string, unknown>
function mockDb(
  policies: RecordRow[],
  applications: RecordRow[],
  failTable?: string
): SupabaseClient {
  return {
    from(table: string) {
      let rows = (table === "caucion_policies" ? policies : applications).slice()
      const query = {
        select(_fields: string) { return query },
        eq(field: string, value: unknown) {
          rows = rows.filter((row) => row[field] === value)
          return query
        },
        in(field: string, values: unknown[]) {
          rows = rows.filter((row) => values.includes(row[field]))
          return query
        },
        not(field: string, _operator: string, _value: unknown) {
          rows = rows.filter((row) => row[field] !== null)
          return query
        },
        limit(limit: number) {
          return Promise.resolve({
            data: rows.slice(0, limit),
            error: failTable === table ? { message: "Simulated database failure" } : null,
          })
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}

const policy = (
  id: string,
  applicationId: string,
  contract = "contract-A",
  status = "payment_confirmed",
  confirmedAt: string | null = "2026-11-05T10:00:00Z"
) => ({
  id,
  application_id: applicationId,
  lead_contract_id: contract,
  status,
  payment_confirmed_at: confirmedAt,
})

const app = (id: string, leadId = "tenant-A") => ({
  id, tenant_lead_id: leadId,
})

test("regular contract is ARS 119000; confirmed matching policy is ARS 59500", async () => {
  const regular = await getVerloContractPricing(mockDb([], []), "contract-A", "tenant-A")
  expect(regular).toMatchObject({
    amount: CONTRACT_FEE_ARS, discount_ars: 0, caucion_policy_id: null,
  })
  const discounted = await getVerloContractPricing(
    mockDb([policy("policy-A", "application-A")], [app("application-A")]),
    "contract-A", "tenant-A"
  )
  expect(discounted).toMatchObject({
    amount: CAUCION_BONIFIED_FEE_ARS, original_amount: CONTRACT_FEE_ARS,
    discount_ars: 59500, discount_percent: 50, caucion_policy_id: "policy-A",
  })
})

const blockedCases: Array<{
  label: string; policies: RecordRow[]; applications: RecordRow[];
}> = [
  { label: "no policy", policies: [], applications: [] },
  { label: "pending premium", policies: [policy("p", "a", "contract-A", "payment_pending")], applications: [app("a")] },
  { label: "accepted application only", policies: [policy("p", "a", "contract-A", "pending")], applications: [app("a")] },
  { label: "missing payment confirmation timestamp", policies: [policy("p", "a", "contract-A", "payment_confirmed", null)], applications: [app("a")] },
  { label: "caucion belongs to another contract", policies: [policy("p", "a", "contract-B")], applications: [app("a")] },
  { label: "caucion belongs to another tenant", policies: [policy("p", "a")], applications: [app("a", "tenant-B")] },
]

for (const { label, policies, applications } of blockedCases) {
  test(`no discount: ${label}`, async () => {
    const result = await getVerloContractPricing(
      mockDb(policies, applications), "contract-A", "tenant-A"
    )
    expect(result.amount).toBe(119000)
    expect(result.discount_percent).toBe(0)
    expect(result.caucion_policy_id).toBeNull()
  })
}

test("issued policy with confirmed premium remains eligible", async () => {
  const result = await getVerloContractPricing(
    mockDb([policy("p", "a", "contract-A", "issued")], [app("a")]),
    "contract-A", "tenant-A"
  )
  expect(result.amount).toBe(59500)
})

test("multiple policies never apply another tenant's discount", async () => {
  const result = await getVerloContractPricing(
    mockDb(
      [policy("p-foreign", "a-foreign"), policy("p-own", "a-own")],
      [app("a-foreign", "tenant-B"), app("a-own", "tenant-A")]
    ), "contract-A", "tenant-A"
  )
  expect(result.caucion_policy_id).toBe("p-own")
})

for (const table of ["caucion_policies", "caucion_applications"]) {
  test(`fail closed when ${table} lookup fails`, async () => {
    await expect(getVerloContractPricing(
      mockDb([policy("p", "a")], [app("a")], table),
      "contract-A", "tenant-A"
    )).rejects.toBeTruthy()
  })
}

test("Mercado Pago checkout and callback use recorded server-side amount", () => {
  const checkout = readFileSync("app/api/payments/create/route.ts", "utf8")
  const callback = readFileSync("app/api/webhooks/mercadopago/route.ts", "utf8")
  const view = readFileSync("app/api/closing-view/route.ts", "utf8")
  const page = readFileSync("app/cierre/[token]/page.tsx", "utf8")

  expect(checkout).toContain("getVerloContractPricing(supabaseAdmin, contract.id, contract.tenant_lead_id)")
  expect(checkout).toContain("unit_price:\n                    pricing.amount")
  expect(checkout).toContain("amount:\n            pricing.amount")
  expect(checkout).toContain("caucion_policy_id: pricing.caucion_policy_id")
  const decision = readFileSync("lib/payments/mercadopago-contract-state.ts", "utf8")
  expect(callback).toContain("decideMpContractPayment({")
  expect(callback).toContain("storedAmount: Number(storedPayment.amount)")
  expect(decision).toContain("args.paymentAmount !== args.storedAmount")
  expect(decision).toContain("args.paymentCurrency !== args.storedCurrency")
  expect(view).toContain("contract_pricing: contractPricing")
  expect(page).toContain("data.contract_pricing?.discount_percent === 50")
})

test("existing payments and approved credits retain no-double-charge checks", () => {
  const checkout = readFileSync("app/api/payments/create/route.ts", "utf8")
  expect(checkout).toContain("match\n        .tenant_paid_at")
  expect(checkout).toContain("availableCredit")
  expect(checkout).toContain('"approved"')
  expect(checkout).toContain('"consumed_at"')
})
