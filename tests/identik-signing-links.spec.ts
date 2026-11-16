import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const read = (name: string) => readFileSync(join(process.cwd(), name), "utf8")

test("Identik signing URLs are stored only in the private bucket after validating both signers", () => {
  const links = read("lib/identik/signing-links.ts")
  const route = read("app/api/identik/my-signing/route.ts")
  expect(links).toContain('const BUCKET = "identik-contracts"')
  expect(links).toContain("upsert: false")
  expect(links).toContain("get = (email: string)")
  expect(links).toContain("matches.length === 1")
  expect(links).toContain("owner === tenant")
  expect(links).toContain('url.protocol === "https:"')
  expect(route).toContain("extractSigningLinks(distribution, owner.email, tenant.email)")
  expect(route).toContain("await saveSigningLinks(db, reservation.id, links)")
  expect(route).toContain("await readOwnSigningLink(db, doc.id, role)")
  expect(route.indexOf("await saveSigningLinks")).toBeLessThan(route.indexOf('status: "sent"'))
  expect(route.indexOf("await saveSigningLinks")).toBeLessThan(route.indexOf("sendEmailToLeadOnce"))
})

test("Existing sessions remain restricted to the authenticated contract participant", () => {
  const route = read("app/api/identik/my-signing/route.ts")
  expect(route).toContain("auth.auth.getUser")
  expect(route).toContain("email_confirmed_at")
  expect(route).toContain("lead.email?.trim().toLowerCase() !== email")
  expect(route).toContain("checkTraditionalSigningReadiness(db, contract.id)")
  expect(route).toContain("mine.signingStatus !== \"SIGNED\"")
})
