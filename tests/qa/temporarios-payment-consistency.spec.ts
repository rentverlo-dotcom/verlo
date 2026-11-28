import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"

const read = (path: string) => readFileSync(path, "utf8")

test("Temporarios: fee is consistent in prepare webhook reconciliation and QA migration", () => {
  const prepare = read("app/api/temporarios/payments/prepare/route.ts")
  const webhook = read("app/api/temporarios/payments/webhook/route.ts")
  const reconcile = read("app/api/temporarios/payments/reconcile/route.ts")
  const migration = read("docs/temporarios/qa-align-contract-fee-49999.sql")
  expect(prepare).toContain("const FEE=49999")
  expect(webhook).toContain("Number(payment?.transaction_amount)!==49999")
  expect(reconcile).toContain("Number(payment?.transaction_amount)!==49999")
  expect(migration).toContain("CHECK (amount_ars = 49999)")
  expect(migration).toContain("SET DEFAULT 49999")
})

test("Temporarios: payment confirmation never trusts the caller's reported status", () => {
  const webhook = read("app/api/temporarios/payments/webhook/route.ts")
  const reconcile = read("app/api/temporarios/payments/reconcile/route.ts")
  expect(webhook).toContain("validSignature(request,id,secret)")
  expect(webhook).toContain("https://api.mercadopago.com/v1/payments/")
  expect(reconcile).toContain("https://api.mercadopago.com/v1/payments/")
  expect(reconcile).toContain('payment?.status!=="approved"')
  expect(webhook).toContain('"temporary_register_verified_payment"')
  expect(reconcile).toContain('"temporary_register_verified_payment"')
})

test("Temporarios: provider mismatch is rejected and payment is not for rent or deposit", () => {
  const prepare = read("app/api/temporarios/payments/prepare/route.ts")
  const webhook = read("app/api/temporarios/payments/webhook/route.ts")
  const reconcile = read("app/api/temporarios/payments/reconcile/route.ts")
  expect(prepare).toContain('title:"VERLO Temporarios · Contrato y validación"')
  expect(prepare).toContain("external_reference:attempt.id")
  expect(webhook).toContain('return reply(409,{ok:false,error:"Pago no coincide"})')
  expect(reconcile).toContain('return reply(409,{ok:false,error:"La operación no corresponde a esta reserva"})')
})
