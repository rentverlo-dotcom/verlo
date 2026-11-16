import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"

const read = (path: string) => readFileSync(path, "utf8")

for (const endpoint of [
  "app/api/likes/create/route.ts",
  "app/api/property-like/route.ts",
]) {
  test(`legacy unauthenticated write endpoint is hard-disabled: ${endpoint}`, () => {
    const code = read(endpoint)
    expect(code).toContain('export async function POST()')
    expect(code).toContain('LEGACY_ENDPOINT_DISABLED')
    expect(code).toContain('status: 410')
    expect(code).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
    expect(code).not.toContain('supabaseAdmin')
    expect(code).not.toContain('.insert(')
    expect(code).not.toContain('.update(')
    expect(code).not.toContain('.delete(')
  })
}

test("current matching and property-action endpoints remain unchanged and require auth", () => {
  const current = read("app/api/property-action/route.ts")
  expect(current).toContain("supabase.auth.getUser(token)")
  expect(current).toContain("if (authError || !user)")
  const links = read("app/api/mi-verlo/route.ts")
  expect(links).toContain("lead_matches")
})
