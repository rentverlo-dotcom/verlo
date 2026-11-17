import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import ts from "typescript"

// Runs the ACTUAL GET handler compiled in memory with controlled Auth/DB adapters.
// No network, external providers, Supabase credentials or database writes.
type SavedRow = {
  property_id: string
  properties: {
    id: string
    title: string
    short_description: string
    address: string
    price: number
    property_media: Array<{ url: string; position: number; type: string }>
  }
}
const ownerA = "a06d197b-36fd-4dca-8fad-bfe9705b5cc1"
const ownerB = "b06d197b-36fd-4dca-8fad-bfe9705b5cc2"
const row = (user: string, id: string): { user: string; data: SavedRow } => ({
  user,
  data: {
    property_id: id,
    properties: {
      id, title: id, short_description: "Prueba aislada",
      address: "Calle de prueba", price: 100,
      property_media: [{ url: "https://example.invalid/" + id, position: 1, type: "photo" }],
    },
  },
})

function setup() {
  const source = readFileSync("app/api/guardadas/route.ts", "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const queries: Array<{ table: string; column: string; identity: string }> = []
  const tokens = new Map([["token-A", ownerA], ["token-B", ownerB]])
  const saved = [row(ownerA, "only-A"), row(ownerB, "only-B")]
  const admin = {
    from: (table: string) => {
      if (table !== "property_likes") throw new Error("Unexpected table: " + table)
      return {
        select: (projection: string) => {
          if (!projection.includes("property_media")) throw new Error("Missing media projection")
          return {
            eq: (column: string, identity: string) => {
              queries.push({ table, column, identity })
              if (column !== "tenant_id") throw new Error("Missing tenant ownership filter")
              // The mock refuses any unfiltered DB read, rather than returning all rows.
              const matching = saved.filter(r => r.user === identity).map(r => r.data)
              return {
                order: () => ({
                  limit: async () => ({ data: matching, error: null }),
                }),
              }
            },
          }
        },
      }
    },
  }
  const module = { exports: {} as Record<string, unknown> }
  const fakeRequire = (name: string) => {
    if (name === "next/server") return {
      NextResponse: {
        json: (body: unknown, opts?: { status?: number; headers?: Record<string, string> }) => ({
          status: opts?.status ?? 200,
          body,
          headers: opts?.headers ?? {},
        }),
      },
    }
    if (name === "@supabase/supabase-js") return {
      createClient: () => ({
        auth: {
          getUser: async (token: string) => ({
            data: { user: tokens.has(token) ? { id: tokens.get(token) } : null },
            error: tokens.has(token) ? null : { message: "invalid" },
          }),
        },
      }),
    }
    if (name === "@/lib/supabase/server") return { supabaseAdmin: admin }
    throw new Error("Unexpected module in handler: " + name)
  }
  runInNewContext(compiled, {
    module, exports: module.exports, require: fakeRequire,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: "https://example.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "dummy" } },
  })
  const handler = (module.exports as { GET: (r: { headers: { get(name: string): string | null } }) => Promise<{
    status: number; body: unknown; headers: Record<string, string>
  }> }).GET
  if (typeof handler !== "function") throw new Error("GET handler not exported")
  const get = (token?: string) => handler({
    headers: {
      get: (header: string) => header.toLowerCase() === "authorization"
        ? token ? "Bearer " + token : null : null,
    },
  })
  return { get, queries }
}

test("the real guardadas handler rejects anonymous and invalid tokens without privileged reads", async () => {
  const { get, queries } = setup()
  const anonymous = await get()
  const invalid = await get("invalid-or-forged")
  expect(anonymous.status).toBe(401)
  expect(invalid.status).toBe(401)
  expect(anonymous.headers["Cache-Control"]).toBe("no-store")
  expect(queries).toHaveLength(0)
})

test("the real guardadas handler isolates owner A and owner B and never mixes data", async () => {
  const { get, queries } = setup()
  const a = await get("token-A")
  const b = await get("token-B")
  expect(a.status).toBe(200)
  expect(b.status).toBe(200)
  expect((a.body as Array<{id: string}>).map(x => x.id)).toEqual(["only-A"])
  expect((b.body as Array<{id: string}>).map(x => x.id)).toEqual(["only-B"])
  expect(JSON.stringify(a.body)).not.toContain("only-B")
  expect(JSON.stringify(b.body)).not.toContain("only-A")
  expect(queries).toEqual([
    { table: "property_likes", column: "tenant_id", identity: ownerA },
    { table: "property_likes", column: "tenant_id", identity: ownerB },
  ])
})
