import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"
import { canonicalEmail, isSyntheticGuarantorEmail } from "../../lib/guarantors/auth"
import { renderVerloEmail } from "../../lib/notifications/verlo-email-templates"
const source=(path:string)=>readFileSync(path,"utf8")

test("guarantor lives in contract participant table with no public direct access",()=>{
  const sql=source("supabase/migrations/20261126_contract_guarantor_participants.sql")
  expect(sql).toContain("create table if not exists public.contract_guarantors")
  expect(sql).toContain("references public.lead_contracts(id)")
  expect(sql).not.toContain("insert into public.lead_intake")
  expect(sql).toContain("enable row level security")
  expect(sql).toContain("revoke all on table public.contract_guarantors from anon, authenticated")
  expect(sql).toContain("grant all on table public.contract_guarantors to service_role")
  expect(sql).toContain("'guarantor'")
})

test("verified email, contract owner and isolation are required before invitation",()=>{
  const auth=source("lib/guarantors/auth.ts")
  const route=source("app/api/guarantors/route.ts")
  expect(auth).toContain("auth.auth.getUser(bearer)")
  expect(auth).toContain("email_confirmed_at")
  expect(auth).toContain('process.env.VERCEL_GIT_COMMIT_REF !== "feature/signatura-qa-integration"')
  expect(route).toContain('eq("id",contract.tenant_lead_id)')
  expect(route).toContain("canonicalEmail(tenant.email || \"\")!==email")
  expect(route).toContain("Tenant cannot guarantee themself")
  expect(route).toContain("Owner cannot be their own guarantor")
  expect(route).toContain("isSyntheticGuarantorEmail(email)")
  expect(route).toContain('contract.tenant_agreed_at || contract.owner_agreed_at')
})

test("only verified invitation recipient can consent; acceptance is not a signature",()=>{
  const mine=source("app/api/guarantors/mine/route.ts")
  expect(mine).toContain('.eq("email",actor.email)')
  expect(mine).toContain("guarantor.auth_user_id!==actor.user.id")
  expect(mine).toContain("body?.acknowledged!==true")
  expect(mine).not.toContain("createSignaturaDocument(")
  expect(mine).not.toContain("signed_at:new Date")
})

test("guarantor forces the former two-signer signing route to fail closed",()=>{
  const preflight=source("lib/identik/traditional-signing-preflight.ts")
  expect(preflight).toContain('from("contract_guarantors")')
  expect(preflight).toContain("guarantor_signature_flow_pending")
  expect(preflight).toContain("guarantor_lookup_unavailable")
})

test("no real invitation delivery is attempted in QA",()=>{
  const route=source("app/api/guarantors/route.ts")
  expect(route).toContain("enqueueVerloEmailSafely")
  expect(route).not.toContain("sendWithZeptoMail(")
  expect(route).not.toContain("sendZohoEmail(")
  expect(route).not.toContain("sendPushToLead(")
  expect(isSyntheticGuarantorEmail("demo-1@example.com")).toBe(true)
  expect(isSyntheticGuarantorEmail("person@gmail.com")).toBe(false)
  expect(canonicalEmail("  Test@Example.com ")).toBe("test@example.com")
  const template=renderVerloEmail({area:"tradicionales",role:"guarantor",type:"guarantor_invited",url:"/login?next=%2Fmi-verlo"})
  expect(template.subject).toContain("garante")
  expect(template.html).toContain("verlo.lat/login")
  expect(template.html).not.toContain("leadconnectorhq")
})

test("generated contract identifies the accepted guarantor but cannot imply signing",()=>{
  const route=source("app/api/closing-generate/route.ts")
  expect(route).toContain("guarantorText")
  expect(route).toContain("signer.status !== \"accepted\"")
  expect(route).toContain("firma individual mediante validación de identidad")
  expect(route).toContain("no constituye una fianza firmada")
})

test("Mi VERLO separates guarantor from matching while preserving account access",()=>{
  const portal=source("components/guarantors/MyGuarantorPortal.tsx")
  const dashboard=source("app/mi-verlo/page.tsx")
  expect(dashboard).toContain('fetch("/api/guarantors/mine"')
  expect(dashboard).toContain("<MyGuarantorPortal")
  expect(dashboard).toContain("<MyGuarantorInvite")
  expect(portal).toContain("no firma el contrato")
  expect(portal).not.toContain("Firmar ahora")
})
