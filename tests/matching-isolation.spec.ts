import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"

// Read-only guard against matching QA identities with production users.
// This test does not create leads or matches in the shared Supabase database.
test("QA identity isolation is enforced for both matching directions", () => {
  const source = readFileSync("app/api/lead-intake/route.ts", "utf8")
  const begin = source.indexOf("async function createLeadMatches({")
  const end = source.indexOf("export async function GET()", begin)
  expect(begin).toBeGreaterThan(-1)
  expect(end).toBeGreaterThan(begin)
  const matcher = source.slice(begin, end)

  // QA identities cannot initiate matching.
  const entry = matcher.slice(0, matcher.indexOf("const isTenant"))
  expect(entry).toContain("isAutomatedTestEmail(")
  expect(entry).toContain("created: 0")
  expect(entry).toContain("skipped: true")

  // QA identities already present in the database cannot be candidates
  // when a production tenant or owner initiates matching.
  const exclusions = matcher.match(/!isAutomatedTestEmail\(/g) || []
  expect(exclusions.length).toBeGreaterThanOrEqual(2)

  // Both directions must retain production lead-quality checks.
  const qualityChecks = matcher.match(/lead_quality\s*!==/g) || []
  expect(qualityChecks.length).toBeGreaterThanOrEqual(4)
})
