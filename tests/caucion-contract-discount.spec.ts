import {test,expect} from "@playwright/test"
import {readFileSync} from "node:fs"

test("only a partner-confirmed, tenant-linked policy gives 50% fee",()=>{
  const pricing=readFileSync("lib/payments/caucion-contract-discount.ts","utf8")
  expect(pricing).toContain("CONTRACT_FEE_ARS = 119000")
  expect(pricing).toContain("CAUCION_BONIFIED_FEE_ARS = 59500")
  expect(pricing).toContain('.eq("lead_contract_id", contractId)')
  expect(pricing).toContain('.eq("tenant_lead_id", tenantLeadId)')
  expect(pricing).toContain('["payment_confirmed", "issued"]')
  expect(pricing).toContain('.not("payment_confirmed_at", "is", null)')
  expect(pricing).not.toContain("status === \"accepted\"")
})

test("checkout and screen use the same server-side price and MercadoPago checks amount",()=>{
  const checkout=readFileSync("app/api/payments/create/route.ts","utf8")
  const screen=readFileSync("app/api/closing-view/route.ts","utf8")
  const page=readFileSync("app/cierre/[token]/page.tsx","utf8")
  const callback=readFileSync("app/api/webhooks/mercadopago/route.ts","utf8")
  expect(checkout).toContain("getVerloContractPricing(supabaseAdmin, contract.id, contract.tenant_lead_id)")
  expect(checkout).toContain("unit_price:\n                    pricing.amount")
  expect(checkout).toContain("amount:\n            pricing.amount")
  expect(checkout).toContain("caucion_policy_id: pricing.caucion_policy_id")
  expect(screen).toContain("contract_pricing: contractPricing")
  expect(page).toContain("data.contract_pricing?.discount_percent === 50")
  expect(callback).toContain("paymentAmount !==\n        storedAmount")
})
