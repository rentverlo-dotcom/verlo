import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { decideMpContractPayment } from "../lib/payments/mercadopago-contract-state"

const base = {
  storedProvider: "mercadopago",
  storedStatus: "pending",
  storedProviderPaymentId: null as string | null,
  storedAmount: 119000,
  storedCurrency: "ARS",
  notificationId: "987654321",
  paymentId: "987654321",
  paymentAmount: 119000,
  paymentCurrency: "ARS",
  paymentStatus: "approved",
}

test("MP: valid approved payment is applied", () => {
  expect(decideMpContractPayment(base)).toBe("apply")
})

test("MP: rejection does not approve the contract", () => {
  expect(decideMpContractPayment({ ...base, paymentStatus: "rejected" })).toBe("apply")
  expect(decideMpContractPayment({ ...base, paymentStatus: "cancelled" })).toBe("apply")
})

test("MP: duplicate and late rejected events never downgrade approved fee", () => {
  for (const status of ["approved", "rejected", "pending", "in_process", "cancelled"]) {
    expect(decideMpContractPayment({
      ...base, storedStatus: "approved", storedProviderPaymentId: base.notificationId,
      paymentStatus: status,
    })).toBe("duplicate")
  }
})

test("MP: amount and currency mismatches never unlock contract", () => {
  expect(decideMpContractPayment({ ...base, paymentAmount: 59500 })).toBe("reject_amount")
  expect(decideMpContractPayment({ ...base, paymentCurrency: "USD" })).toBe("reject_amount")
  expect(decideMpContractPayment({ ...base, paymentAmount: Number.NaN })).toBe("reject_amount")
})

test("MP: wrong provider and different payment id cannot mutate payment", () => {
  expect(decideMpContractPayment({ ...base, storedProvider: "qa-synthetic" })).toBe("reject_reference")
  expect(decideMpContractPayment({ ...base, paymentId: "123456789" })).toBe("reject_reference")
  expect(decideMpContractPayment({ ...base, storedProviderPaymentId: "123456789" })).toBe("reject_reference")
})

test("MP: unsupported statuses are ignored and cannot unlock payment", () => {
  expect(decideMpContractPayment({ ...base, paymentStatus: "refunded" })).toBe("ignore_status")
  expect(decideMpContractPayment({ ...base, paymentStatus: "" })).toBe("ignore_status")
})

test("MP: webhook replay recovery is conditional and approved state cannot be overwritten", () => {
  const source = readFileSync(join(process.cwd(), "app/api/webhooks/mercadopago/route.ts"), "utf8")
  expect(source).toContain('.neq("status", "approved")')
  expect(source).toContain('.is("tenant_paid_at", null)')
  expect(source).toContain('syncApprovedMatch(storedPayment.approved_at')
  expect(source).toContain('decision === "duplicate"')
  expect(source).toContain('status === "approved"')
})
