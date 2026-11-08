import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"
import { assertIdentikPdfDownload } from "../../lib/identik/signed-pdf-integrity"

function pdf(extra = ""): Uint8Array {
  return Buffer.from("%PDF-1.7\n" + "0".repeat(300) + "\n%%EOF\n" + extra, "latin1")
}

test("Identik: signed PDF transport accepts complete PDFs, including incremental revisions", () => {
  expect(() => assertIdentikPdfDownload(pdf())).not.toThrow()
  expect(() => assertIdentikPdfDownload(Buffer.from(
    "%PDF-1.7\n" + "0".repeat(300) + "\n%%EOF\n" +
    "1".repeat(300) + "\n%%EOF\n",
    "latin1",
  ))).not.toThrow()
})

test("Identik: signed document download rejects JSON, truncated or missing EOF responses", () => {
  for (const bytes of [
    Buffer.from('{"error":"not signed"}'),
    Buffer.alloc(500),
    Buffer.from("%PDF-1.7\n" + "0".repeat(300)),
    Buffer.from("html".repeat(100)),
  ]) {
    expect(() => assertIdentikPdfDownload(bytes)).toThrow()
  }
})

test("Identik: webhook retries reconciliation even for a duplicate event", () => {
  const code = readFileSync("app/api/webhooks/identik-electronic/route.ts", "utf8")
  expect(code).toContain('eventError?.code === "23505"')
  expect(code).toContain("if (eventError && !duplicate)")
  expect(code).toContain("makeIdentikElectronicClient().getDocument(documentId)")
  expect(code).not.toContain('if (eventError.code === "23505") return')
  expect(code).toContain("retryable: true")
  expect(code).toContain("status: 503")
})

test("Identik: download handler validates PDF bytes from provider", () => {
  const code = readFileSync("lib/identik/electronic-v2.ts", "utf8")
  expect(code).toContain("assertIdentikPdfDownload(bytes)")
  expect(code).toContain("/download?version=signed")
  expect(code).toContain("/certificate")
  expect(code).toContain("payload.recipients.length !== 2")
})
