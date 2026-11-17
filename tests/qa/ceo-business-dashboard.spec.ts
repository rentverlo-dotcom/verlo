import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"

const source = (path: string) => readFileSync(path, "utf8")

test("CEO dashboard: single authenticated operations endpoint includes Meta and all existing product funnels", () => {
  const route = source("app/api/admin/dashboard/route.ts")
  const ui = source("app/admin/verlo/page.tsx")
  const metrics = source("lib/admin/business-metrics.ts")
  expect(route).toContain("ADMIN_EMAILS.has(")
  expect(route).toContain(".getUser(")
  expect(route).toContain("getBusinessMetrics(supabase")
  expect(route).toContain("getMetaMetrics(process.env)")
  expect(route).toContain("business,")
  expect(route).toContain("meta,")
  expect(ui).toContain("Negocio · visión CEO")
  expect(ui).toContain("Temporarios · operación completa")
  expect(ui).toContain("Comunicaciones y operación")
  for (const table of [
    "temporary_properties", "temporary_demands", "temporary_matches",
    "temporary_reservations", "temporary_payment_attempts", "temporary_contracts",
    "caucion_applications", "caucion_policies",
    "identik_electronic_documents", "verlo_email_outbox", "payments",
  ]) expect(metrics).toContain(`table: "${table}"`)
})

test("CEO dashboard: never fabricate payments, expose personal data, or silently call QA real sales", () => {
  const code = source("lib/admin/business-metrics.ts")
  const ui = source("app/admin/verlo/page.tsx")
  expect(code).toContain("value === null")
  expect(code).toContain('"qa"')
  expect(code).toContain('"production"')
  expect(code).toContain('metrics[key] = { value, source }')
  expect(code).toContain("Los pagos aprobados en el sistema no certifican")
  expect(ui).toContain("Son registros de pruebas, no ventas reales")
  expect(ui).toContain("Pago aprobado")
  expect(code).not.toContain("SUPABASE_SERVICE_ROLE_KEY")
})

test("Legacy investor and control pages must fail closed if secrets are missing", () => {
  for (const path of ["app/control/page.tsx", "app/investor/page.tsx"]) {
    const page = source(path)
    expect(page).toContain("if (!requiredToken || params.token !== requiredToken)")
  }
})

test("Temporarios: the contract fee is paid before dates are finally blocked", () => {
  const card = source("app/temporarios/mi-verlo/LodgingMatchCard.tsx")
  const payment = source("app/api/temporarios/payments/prepare/route.ts")
  const confirm = source("app/api/temporarios/reservations/confirm/route.ts")
  expect(card).toContain('status==="terms_accepted"')
  expect(card).toContain("money(49999)")
  expect(payment).toContain("const FEE=49999")
  expect(confirm).toContain("temporary_confirm_reservation")
  expect(confirm).toContain("payment_required")
})
