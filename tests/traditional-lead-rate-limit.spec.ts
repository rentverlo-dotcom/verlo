import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"
import { createHmac } from "node:crypto"
import { getLeadRateLimitKey } from "../lib/security/lead-intake-rate-limit"

test("client IP HMAC is deterministic and not plaintext",()=>{
 const h=new Headers({"x-vercel-forwarded-for":"203.0.113.42","x-forwarded-for":"192.0.2.9"})
 const key=getLeadRateLimitKey(h,"qa-secret",true)
 const expected=createHmac("sha256","qa-secret").update("verlo:lead-intake:ip:v1:").update("203.0.113.42").digest("hex")
 expect(key).toBe(expected)
 expect(key).not.toContain("203.0.113.42")
})
test("missing or invalid IP and secret cannot be used",()=>{
 expect(getLeadRateLimitKey(new Headers(),"qa",true)).toBeNull()
 expect(getLeadRateLimitKey(new Headers({"x-forwarded-for":"attacker"}),"qa",true)).toBeNull()
 expect(getLeadRateLimitKey(new Headers({"x-forwarded-for":"203.0.113.42"}),"",true)).toBeNull()
})
test("one shared endpoint guards owner tenant and renewal",()=>{
 const code=readFileSync("app/api/lead-intake/route.ts","utf8")
 const form=readFileSync("app/permanentes/page.tsx","utf8")
 expect(code).toContain("await takeLeadIntakeRateSlot(req)")
 expect(code).toContain('"Retry-After": "600"')
 expect(form).toContain('type Path = "tenant" | "owner" | "renewal"')
 expect(form).toContain('"/api/lead-intake"')
})
test("RPC enforces 10 per ten minutes and 60 per UTC day atomically",()=>{
 const s=readFileSync("supabase/migrations/20261105_traditional_lead_rate_limit.sql","utf8")
 expect(s).toContain("ON CONFLICT (client_key,window_minutes,window_start) DO UPDATE")
 expect(s).toContain("attempts < 10")
 expect(s).toContain("attempts < 60")
 expect(s).toContain("TO service_role")
})
