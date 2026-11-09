import { createHash } from "node:crypto"
import { test, expect } from "@playwright/test"
import type { SupabaseClient } from "@supabase/supabase-js"
import { checkTraditionalSigningReadiness } from "../../lib/identik/traditional-signing-preflight"

type Row = Record<string, unknown>
const content = "VERLO QA contract: exact version agreed by both parties"
const hash = createHash("sha256").update(content, "utf8").digest("hex")
const contract: Row = {
  id: "contract-A", lead_match_id: "match-A", tenant_lead_id: "tenant-A",
  owner_lead_id: "owner-A", status: "agreed", content,
  tenant_agreed_at: "2026-11-09T10:00:00Z", owner_agreed_at: "2026-11-09T10:01:00Z",
}
const match: Row = {
  id: "match-A", tenant_lead_id: "tenant-A", owner_lead_id: "owner-A",
  ready_to_connect_at: "2026-11-09T09:00:00Z",
  tenant_paid_at: "2026-11-09T09:30:00Z",
  tenant_post_visit_decision: "yes", owner_post_visit_decision: "yes",
}
const app: Row = {
  id: "caucion-A", tenant_lead_id: "tenant-A", status: "prequalified",
  created_at: "2026-11-09T10:00:00Z",
  decision_expires_at: "2099-01-01T00:00:00Z",
}
const review: Row = {
  id: "review-A", application_id: "caucion-A", lead_contract_id: "contract-A",
  status: "approved", contract_content_sha256: hash, pdf_sha256: "pdf-hash",
}
function fakeDb(rows: Record<string, Row[]>, failing?: string): SupabaseClient {
  return {
    from(table: string) {
      let selected = (rows[table] || []).slice()
      const query = {
        select(_fields: string) { return query },
        eq(field: string, value: unknown) {
          selected = selected.filter(row => row[field] === value)
          return query
        },
        neq(field: string, value: unknown) {
          selected = selected.filter(row => row[field] !== value)
          return query
        },
        order(field: string, opts: { ascending: boolean }) {
          selected.sort((a, b) => opts.ascending
            ? String(a[field]).localeCompare(String(b[field]))
            : String(b[field]).localeCompare(String(a[field])))
          return query
        },
        maybeSingle() {
          return Promise.resolve({
            data: selected[0] || null,
            error: failing === table ? { code: "QA_DB_UNAVAILABLE" } : null,
          })
        },
        limit(n: number) {
          return Promise.resolve({
            data: selected.slice(0, n),
            error: failing === table ? { code: "QA_DB_UNAVAILABLE" } : null,
          })
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}
const verify = (c: Row | null = contract, m: Row | null = match,
  applications: Row[] = [], reviews: Row[] = [], fail?: string) =>
  checkTraditionalSigningReadiness(fakeDb({
    lead_contracts: c ? [c] : [],
    lead_matches: m ? [m] : [],
    caucion_applications: applications,
    caucion_contract_reviews: reviews,
  }, fail), "contract-A")

test("Identik gate: ordinary paid and mutually accepted contract can proceed without caucion", async () => {
  expect(await verify()).toMatchObject({ allowed: true, reason: "no_caucion" })
})

test("Identik gate: never initiate signing for unsigned agreement or unpaid tenant", async () => {
  for (const change of [
    { status: "generated" },
    { tenant_agreed_at: null },
    { owner_agreed_at: null },
    { content: "" },
  ]) {
    expect(await verify({ ...contract, ...change })).toMatchObject({
      allowed: false, reason: "both_parties_not_agreed",
    })
  }
  for (const change of [
    { tenant_paid_at: null },
    { owner_post_visit_decision: "no" },
    { tenant_post_visit_decision: "pending" },
    { owner_lead_id: "other" },
  ]) {
    expect(await verify(contract, { ...match, ...change })).toMatchObject({
      allowed: false, reason: "match_not_eligible",
    })
  }
})

test("Identik gate: approved PowerMarket quote cannot replace exact contract review", async () => {
  expect(await verify(contract, match, [app], [])).toMatchObject({
    allowed: false, reason: "contract_review_pending",
  })
  expect(await verify(contract, match, [app], [{ ...review, status: "rejected" }]))
    .toMatchObject({ allowed: false, reason: "contract_review_pending" })
  expect(await verify(contract, match, [app], [review])).toMatchObject({
    allowed: true, reason: "approved", reviewId: "review-A",
  })
  expect(await verify({ ...contract, content: content + " changed" }, match, [app], [review]))
    .toMatchObject({ allowed: false, reason: "contract_changed" })
})

test("Identik gate: expired caucion, ambiguous application and DB failures deny signing", async () => {
  expect(await verify(contract, match, [{ ...app, decision_expires_at: "2020-01-01" }], [review]))
    .toMatchObject({ allowed: false, reason: "caucion_expired" })
  expect(await verify(contract, match, [app, { ...app, id: "other" }], [review]))
    .toMatchObject({ allowed: false, reason: "ambiguous_caucion" })
  for (const table of ["lead_contracts", "lead_matches", "caucion_applications", "caucion_contract_reviews"]) {
    const result = await verify(contract, match, [app], [review], table)
    expect(result.allowed, table).toBe(false)
  }
})
