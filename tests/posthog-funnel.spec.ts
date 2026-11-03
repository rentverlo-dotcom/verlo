import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"

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
