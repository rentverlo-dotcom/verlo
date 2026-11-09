import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"
import { getTemporaryStorageConfig } from "../../lib/temporarios/storage-config"

const qa = {
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: "qa/verlo-e2e",
  NEXT_PUBLIC_SUPABASE_URL: "https://anptswspguyotnasoacq.supabase.co",
  TEMPORARY_QA_R2_UPLOADS_ENABLED: "true",
  TEMPORARY_QA_R2_BUCKET: "verlo-temporary-qa",
  TEMPORARY_QA_R2_ACCOUNT_ID: "qa-account",
  TEMPORARY_QA_R2_ACCESS_KEY_ID: "qa-key",
  TEMPORARY_QA_R2_SECRET_ACCESS_KEY: "qa-secret",
  // Shared Preview credentials MUST NOT be a fallback for QA.
  TEMPORARY_R2_UPLOADS_ENABLED: "true",
  TEMPORARY_R2_BUCKET: "verlo-preview-existing",
  TEMPORARY_R2_ACCOUNT_ID: "preview-account",
  TEMPORARY_R2_ACCESS_KEY_ID: "preview-key",
  TEMPORARY_R2_SECRET_ACCESS_KEY: "preview-secret",
  R2_BUCKET: "verlo",
  R2_ACCESS_KEY_ID: "prod-key",
  R2_SECRET_ACCESS_KEY: "prod-secret",

}

test("Temporarios media: QA bucket requires correct branch, DB, explicit enablement and independent credentials", () => {
  expect(getTemporaryStorageConfig(qa)?.bucket).toBe("verlo-temporary-qa")
  expect(getTemporaryStorageConfig({ ...qa, TEMPORARY_QA_R2_UPLOADS_ENABLED: "false" })).toBeNull()
  expect(getTemporaryStorageConfig({ ...qa, VERCEL_GIT_COMMIT_REF: "main" })).toBeNull()
  expect(getTemporaryStorageConfig({ ...qa, NEXT_PUBLIC_SUPABASE_URL: "https://different.supabase.co" })).toBeNull()
  expect(getTemporaryStorageConfig({ ...qa, TEMPORARY_QA_R2_BUCKET: "verlo" })).toBeNull()
  expect(getTemporaryStorageConfig({ ...qa, TEMPORARY_QA_R2_SECRET_ACCESS_KEY: "prod-secret" })).toBeNull()
  expect(getTemporaryStorageConfig({ ...qa, TEMPORARY_QA_R2_ACCESS_KEY_ID: "prod-key" })).toBeNull()
  expect(getTemporaryStorageConfig({ ...qa, TEMPORARY_QA_R2_BUCKET: undefined })).toBeNull()
  expect(getTemporaryStorageConfig({ ...qa, TEMPORARY_QA_R2_SECRET_ACCESS_KEY: undefined })).toBeNull()
  expect(getTemporaryStorageConfig({ ...qa, TEMPORARY_QA_R2_UPLOADS_ENABLED: undefined })).toBeNull()

})

test("Temporarios media: production requires independent credentials and two explicit product flags", () => {
  const prod = { ...qa, VERCEL_ENV: "production", VERCEL_GIT_COMMIT_REF: "main" }
  expect(getTemporaryStorageConfig(prod)).toBeNull()
  expect(getTemporaryStorageConfig({ ...prod, TEMPORARY_PUBLIC_ENABLED: "true" })).toBeNull()
  expect(getTemporaryStorageConfig({ ...prod, TEMPORARY_PUBLIC_ENABLED: "true",
    TEMPORARY_DB_WRITES_ENABLED: "true" })?.bucket).toBe("verlo-preview-existing")
})

test("Temporarios media: routes preserve owner verification and HEAD before saving objects", () => {
  const presign = readFileSync("app/api/temporarios/media/presign/route.ts", "utf8")
  const complete = readFileSync("app/api/temporarios/media/complete/route.ts", "utf8")
  expect(presign).toContain('getTemporaryStorageConfig(process.env)')
  expect(presign).toContain('.eq("owner_user_id",auth.userId)')
  expect(complete).toContain('getTemporaryStorageConfig(process.env)')
  expect(complete).toContain('.eq("owner_user_id",auth.userId)')
  expect(complete).toContain('signTemporaryObject(config,"HEAD",input.objectKey)')
  expect(complete).toContain("size!==input.bytes")
  expect(complete).toContain("mime!==input.mimeType")
  expect(presign).not.toContain('process.env.VERCEL_GIT_COMMIT_REF!=="feature/temporarios"')
  expect(complete).not.toContain('process.env.VERCEL_GIT_COMMIT_REF!=="feature/temporarios"')
})

test("Temporarios media: authorized owner and matched tenant can view only with isolated storage", () => {
  const view = readFileSync("app/api/temporarios/media/view/[id]/route.ts", "utf8")
  expect(view).toContain("getTemporaryStorageConfig(process.env)")
  expect(view).toContain("if(!config)return new Response(null,{status:404})")
  expect(view).toContain("property.data.owner_user_id===user.id")
  expect(view).toContain('.eq("temporary_demands.tenant_user_id",user.id)')
  expect(view).toContain("if(!authorized)return new Response(null,{status:403})")
  expect(view).not.toContain('process.env.VERCEL_GIT_COMMIT_REF!=="feature/temporarios"')
})
