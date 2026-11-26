import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"
import {safeAnalyticsPath} from "../lib/posthog-client"

const source=(path:string)=>readFileSync(path,"utf8")

test("analytics observer is installed globally and does not export raw route IDs",()=>{
 const layout=source("app/layout.tsx")
 const observer=source("components/VerloAnalyticsObserver.tsx")
 expect(layout).toContain("<VerloAnalyticsObserver />")
 expect(observer).toContain('trackPostHog("verlo_screen_viewed", context)')
 expect(observer).not.toContain("screen: path")
 expect(observer).toContain("verlo_action_clicked")
 expect(observer).not.toContain("window.posthog.capture")
})

test("traditional forms report outcomes, not names, addresses or prices",()=>{
 for(const p of ["app/buscar/page.tsx","app/propietario/publicar-v2/page.tsx"]){
  const text=source(p)
  expect(text).toContain("traditional_form_step_completed")
  expect(text).toContain("traditional_registration_completed")
  expect(text).toContain("traditional_form_validation_failed")
 }
})

test("temporary registration decisions already have dedicated events",()=>{
 expect(source("app/temporarios/mi-verlo/page.tsx")).toContain("temporary_match_decision_completed")
 expect(source("app/temporarios/buscar/TemporaryTenantDraft.tsx")).toContain("temporary_tenant_registration_completed")
 expect(source("app/temporarios/publicar/TemporaryOwnerDraft.tsx")).toContain("temporary_owner_registration_completed")
 const contract=source("app/temporarios/contrato/ContractScreen.tsx")
 expect(contract).toContain("temporary_contract_generated")
 expect(contract).toContain("temporary_contract_accepted")
})

test("PowerMarket tracks only successful state changes and a failed path",()=>{
 const partner=source("app/powermarket/page.tsx")
 for(const event of ["powermarket_quote_offered","powermarket_contract_review_completed",
  "powermarket_operation_confirmed","powermarket_application_decision_completed"])
  expect(partner).toContain(event)
 const tenant=source("app/caucion/solicitar/page.tsx")
 expect(tenant).toContain("caucion_application_completed")
 expect(tenant).toContain("caucion_document_upload_completed")
 expect(source("components/powermarket/MyCaucionStatus.tsx")).toContain("caucion_quote_accepted")
})

test("privacy protection excludes sensitive fields",()=>{
 const analytics=source("lib/posthog-client.ts")
 expect(analytics).toContain("sanitizeAnalyticsValue")
 expect(analytics).toContain("token|secret|password|dni|email|phone|document|signature|address|name|url")
})

test("private paths and query tokens are redacted before analytics",()=>{
  for(const [input,expected] of [
    ["/matches/my-private-token?access=secret","/matches/[private]"],
    ["/match/token123","/match/[private]"],
    ["/candidatos/private-token","/candidatos/[private]"],
    ["/candidato/private-token","/candidato/[private]"],
    ["/cierre/private-token","/cierre/[private]"],
    ["/propiedad/private-token","/propiedad/[private]"],
    ["/propiedades/uuid-123","/propiedades/[private]"],
    ["/guardadas/uuid-123","/guardadas/[private]"],
    ["/owner/completar/private-token","/owner/completar/[private]"],
    ["/propietario/preview/uuid-123","/propietario/preview/[private]"],
    ["/tenant/validacion/private-token","/tenant/validacion/[private]"],
    ["/contracts/uuid-123?signature=my-secret","/contracts/[private]"],
  ]) expect(safeAnalyticsPath(input)).toBe(expected)
})


test("all three VERLO business lines expose lifecycle events without calling clicks purchases",()=>{
 const traditional=source("app/buscar/page.tsx")+source("app/matches/[token]/page.tsx")
 expect(traditional).toContain("traditional_registration_completed")
 expect(traditional).toContain("tenant_interest_sent")
 const temporary=source("app/temporarios/mi-verlo/page.tsx")+source("app/temporarios/contrato/ContractScreen.tsx")
 expect(temporary).toContain("temporary_match_decision_completed")
 expect(temporary).toContain("temporary_contract_accepted")
 const caucion=source("app/powermarket/page.tsx")+source("app/caucion/solicitar/page.tsx")
 expect(caucion).toContain("powermarket_operation_confirmed")
 expect(caucion).toContain("caucion_application_completed")
 // Browser interactions are a funnel view, not authoritative financial events.
 expect(source("components/VerloAnalyticsObserver.tsx")).not.toContain('trackPostHog("purchase"')
})

test("Signatura tracking does not export identity documents or equate a page visit with a verified identity",()=>{
 const signatura=source("components/signatura/MySignaturaIdentityStatus.tsx")
 expect(signatura).toContain("identity_verification_initiated")
 expect(signatura).toContain("identity_verification_resumed")
 expect(signatura).toContain("identity_verification_state_observed")
 expect(signatura).toContain('confirmed.status === "verified"')
 expect(signatura).not.toContain("trackPostHog(\"Purchase\"")
 expect(signatura).not.toContain("signatura_document_id")
})

test("both QA branches exclude PostHog and Meta advertising pixels",()=>{
 const layout=source("app/layout.tsx")
 expect(layout).toContain("'qa/verlo-e2e', 'feature/signatura-qa-integration'")
 expect(layout).toContain("!QA_BRANCH &&")
 expect(layout).toContain("{!QA_BRANCH ? (<Script")
})


test("business revenue events come only from server-verified operations",()=>{
 const capture=source("lib/posthog-server.ts")
 expect(capture).toContain('process.env.VERCEL_ENV !== "production"')
 expect(capture).toContain('payment_verified: "true"')
 expect(capture).toContain('createHash("sha256")')
 const traditional=source("app/api/webhooks/mercadopago/route.ts")
 expect(traditional).toContain('event: "verlo_traditional_payment_approved"')
 expect(traditional.indexOf("await syncApprovedMatch(approvedAt || now)"))
  .toBeLessThan(traditional.indexOf('event: "verlo_traditional_payment_approved"'))
 const temporary=source("app/api/temporarios/payments/webhook/route.ts")
 expect(temporary).toContain('event:"verlo_temporary_fee_approved"')
 expect(temporary.indexOf('if(result.error)return reply'))
  .toBeLessThan(temporary.indexOf('event:"verlo_temporary_fee_approved"'))
 const partner=source("app/api/powermarket/confirm-operation/route.ts")
 expect(partner).toContain('event: "verlo_caucion_partner_payment_confirmed"')
 expect(partner).toContain('paymentReceiver: "powermarket"')
 // The commission is not earned or paid to VERLO just because PowerMarket confirms.
 expect(partner).not.toContain('paymentReceiver: "verlo"')
})
