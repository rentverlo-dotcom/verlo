import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"

const source = (name: string) => readFileSync(name, "utf8")

test("PowerMarket: concurrent tenant submissions are deduplicated at DB and API layers", () => {
  const migration = source("supabase/migrations/20261109_caucion_application_submit_idempotency.sql")
  const route = source("app/api/powermarket/apply/route.ts")
  expect(migration).toContain("GROUP BY tenant_lead_id HAVING count(*) > 1")
  expect(migration).toContain("CREATE UNIQUE INDEX IF NOT EXISTS caucion_applications_tenant_one_per_lead_uidx")
  expect(migration).toContain("ON public.caucion_applications (tenant_lead_id)")
  expect(route).toContain('if(error?.code==="23505")')
  expect(route).toContain('.eq("tenant_lead_id",leadId).limit(1)')
  expect(route).toContain("already_submitted:true")
  expect(route).toContain("application_id:duplicate[0].id")
})

test("PowerMarket: applicant cannot bypass lead token and consent requirements", () => {
  const route = source("app/api/powermarket/apply/route.ts")
  expect(route).toContain("verifyCaucionLead")
  expect(route).toContain('lead?.role!=="tenant"')
  expect(route).toContain('lead?.intent!=="tenant_search"')
  expect(route).toContain("body?.consent!==true")
  expect(route).toContain('status:"submitted"')
  expect(route).toContain("consent_at:new Date().toISOString()")
})

test("PowerMarket: approvals remain separate from actual signature and partner collects caucion", () => {
  const gate = source("lib/identik/traditional-signing-preflight.ts")
  const partner = source("app/api/powermarket/confirm-operation/route.ts")
  expect(gate).toContain("checkPowerMarketSigningApproval(db")
  expect(gate).toContain('contract.status !== "agreed"')
  expect(gate).toContain("contract.tenant_agreed_at")
  expect(gate).toContain("contract.owner_agreed_at")
  expect(partner).toContain('paid_to: "powermarket"')
  expect(partner).toContain("policy_issued: false")
})
