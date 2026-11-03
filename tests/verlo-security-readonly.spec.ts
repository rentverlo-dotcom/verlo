import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"

/** No test user, no writes, no real customer tokens. */
const origin = process.env.VERLO_QA_ORIGIN || "https://verlo.lat"
const privateEndpoints: Array<{path:string;expected:number[]}> = [
  {path:"/api/mi-verlo",expected:[401]},
  {path:"/api/temporarios/mine",expected:[401,404]},
  {path:"/api/powermarket/my-status",expected:[401]},
  {path:"/api/powermarket/applications",expected:[403]},
  {path:"/api/powermarket/owner-status",expected:[401]},
  {path:"/api/tenant-matches-view",expected:[400]},
  {path:"/api/candidates-view",expected:[400]},
  {path:"/api/closing-view",expected:[400]},
  {path:"/api/admin/email-dispatch",expected:[401]},
]

for (const {path,expected} of privateEndpoints) {
  test(`anonymous user cannot read private endpoint ${path}`,async({request})=>{
    const result=await request.get(origin+path,{maxRedirects:0})
    expect(expected, `Unexpected HTTP ${result.status()} for ${path}`).toContain(result.status())
    const contentType=result.headers()["content-type"]||""
    if(contentType.includes("application/json")){
      const response=await result.json()
      expect(response.ok).not.toBe(true)
    }
  })
}

test("temporary dashboard enforces user ownership even with service-role database",()=>{
 const code=readFileSync("app/api/temporarios/mine/route.ts","utf8")
 expect(code).toContain('eq("owner_user_id",user.id)')
 expect(code).toContain('eq("tenant_user_id",user.id)')
 expect(code).toContain('eq("temporary_properties.owner_user_id",user.id)')
 expect(code).toContain('eq("temporary_demands.tenant_user_id",user.id)')
})

test("caucion and partner portal independently validate user and partner association",()=>{
 const applicant=readFileSync("app/api/powermarket/my-status/route.ts","utf8")
 expect(applicant).toContain("auth.auth.getUser(token)")
 expect(applicant).toContain('ilike("email",email)')
 const partner=readFileSync("app/api/powermarket/applications/route.ts","utf8")
 expect(partner).toContain('from("caucion_partner_users")')
 expect(partner).toContain('eq("user_id", data.user.id)')
})
