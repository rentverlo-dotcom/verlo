import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"

const read = (path: string) => readFileSync(path, "utf8")

for (const endpoint of [
  "app/api/matches/approve/route.ts",
  "app/api/matches/[id]/approve-guarantee/route.ts",
]) {
  test(`legacy guarantee approval is hard-disabled: ${endpoint}`, () => {
    const code = read(endpoint)
    expect(code).toContain("export async function POST()")
    expect(code).toContain('LEGACY_ENDPOINT_DISABLED')
    expect(code).toContain("status: 410")
    expect(code).not.toContain("SUPABASE_SERVICE_ROLE_KEY")
    expect(code).not.toContain('from("match_guarantee_reviews")')
    expect(code).not.toContain(".upsert(")
    expect(code).not.toContain(".insert(")
    expect(code).not.toContain(".update(")
  })
}

test("PowerMarket authorization and atomic decision paths remain unchanged", () => {
  const current = read("app/api/powermarket/applications/route.ts")
  expect(current).toContain('auth.getUser(')
  expect(current).toContain('caucion_partner_users')
  expect(current).toContain('caucion_record_partner_decision')
  const policy = read("app/api/powermarket/confirm-operation/route.ts")
  expect(policy).toContain('caucion_partner_users')
})
