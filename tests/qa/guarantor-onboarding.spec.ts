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
  expect(route).toContain("firma individual sobre el texto definitivo")
  expect(route).toContain("La aceptación digital de participar no sustituye esa firma")
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


test("Signatura creates 2 or 3 signers only after commercial and biometric preflight",()=>{
  const migration=source("supabase/migrations/20261126_signatura_contract_signings.sql")
  const route=source("app/api/signatura/contract-signing/route.ts")
  const preflight=source("lib/identik/traditional-signing-preflight.ts")
  expect(migration).toContain("lead_contract_id uuid not null unique")
  expect(migration).toContain("revoke all on table public.signatura_contract_signings from anon, authenticated")
  expect(route).toContain('SIGNATURA_CONTRACT_QA_ENABLED')
  expect(route).toContain('SIGNATURA_GUARANTOR_CLAUSE_APPROVED')
  expect(route).toContain('checkTraditionalSigningReadiness(actor.db,id,"signatura")')
  expect(route).toContain("Unique DB reservation precedes all external requests")
  expect(route.indexOf('.from("signatura_contract_signings")')).toBeLessThan(route.indexOf("createSignaturaDocument({"))
  expect(route).toContain('...(guarantor?[{validations:{BI:null},order:3}]:[])')
  expect(route).not.toContain("sendZohoEmail(")
  expect(route).not.toContain("invite_channel")
  expect(preflight).toContain('signerFlow !== "signatura"')
})

test("contract completion requires all independent webhooks and biometric checks",()=>{
  const reconcile=source("app/api/signatura/contract-reconcile/route.ts")
  expect(reconcile).toContain('notification_action","DS"')
  expect(reconcile).toContain("signerIds.every")
  expect(reconcile).toContain('document.status!=="CO"')
  expect(reconcile).toContain("validated===true")
  expect(reconcile).toContain('downloadSignaturaEvidence(record.document_id,"document")')
  expect(reconcile).toContain('storage.from("private-documents")')
  expect(reconcile).toContain('upsert:false')
})

test("only authenticated contract participants can download archived PDF",()=>{
  const access=source("lib/signatura/contract-access.ts")
  const download=source("app/api/signatura/contract-signed/route.ts")
  expect(access).toContain("guarantor?.auth_user_id===userId")
  expect(access).toContain("canonicalEmail(guarantor.email)===email")
  expect(download).toContain("loadSignaturaContractParticipants(actor.db,id,actor.email,actor.user.id)")
  expect(download).toContain('createSignedUrl(record.archived_pdf_key,60)')
  expect(download).toContain('record.status!=="completed"')
})

test("Mi VERLO uses Signatura for agreements and never displays old Identik signer",()=>{
  const dashboard=source("app/mi-verlo/page.tsx")
  const signer=source("components/signatura/MySignaturaContractSigning.tsx")
  expect(dashboard).toContain("<MySignaturaContractSigning")
  expect(dashboard).not.toContain("<MyIdentikSigning")
  expect(signer).toContain("contract-reconcile")
  expect(signer).toContain("contract-signed")
  expect(signer).toContain("Validar identidad y firmar")
})

test("Push for guarantor is opt-in and never piggybacks a tenant lead",()=>{
  const sql=source("supabase/migrations/20261126_guarantor_push_subscriptions.sql")
  const api=source("app/api/guarantors/push/route.ts")
  const push=source("lib/guarantors/send-push.ts")
  const form=source("components/guarantors/GuarantorPushSubscribe.tsx")
  expect(sql).toContain("auth_user_id uuid not null")
  expect(sql).toContain("revoke all on table public.guarantor_push_subscriptions from anon, authenticated")
  expect(api).toContain("getGuarantorActor")
  expect(api).toContain("body?.acknowledged!==true")
  expect(api).toContain("Subscription belongs")
  expect(form).toContain("Notification.requestPermission()")
  expect(form).toContain("onClick={()=>void activate()}")
  expect(push).toContain('process.env.VERCEL_ENV!=="production"')
  expect(push).toContain('VERLO_GUARANTOR_PUSH_LIVE')
  expect(push).toContain('SIGNATURA_CONTRACT_PRODUCTION_APPROVED')
  expect(push).not.toContain("sendPushToLead(")
})
