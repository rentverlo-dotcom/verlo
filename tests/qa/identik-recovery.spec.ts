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
  expect(code).toContain("identikCanAdvance(local.status, status)")
  expect(code).toContain('identikProviderStatus(provider.status)')
  expect(code).toContain('.eq("updated_at", local.updated_at)')
  expect(code).toContain('.eq("status", local.status)')
  expect(code).toContain('.select("id")')
  expect(code).not.toContain("mappedStatus(")
})

test("Identik: download handler validates PDF bytes from provider", () => {
  const code = readFileSync("lib/identik/electronic-v2.ts", "utf8")
  expect(code).toContain("assertIdentikPdfDownload(bytes)")
  expect(code).toContain("/download?version=signed")
  expect(code).toContain("/certificate")
  expect(code).toContain("payload.recipients.length !== 2")
})

test("Identik: signed artifact route rejects invalid and unknown access without provider calls", async ({ request }) => {
  const invalid = await request.post("/api/qa/identik/signed-artifact", {
    data: { token: "", kind: "signed_pdf" },
  })
  expect(invalid.status()).toBe(400)

  const unknown = await request.post("/api/qa/identik/signed-artifact", {
    data: { token: "qa-invalid-token-no-document", kind: "signed_pdf" },
  })
  expect(unknown.status()).toBe(404)
})

test("Identik: signed artifact requires linked owner or tenant and completed provider record", () => {
  const source = readFileSync("app/api/qa/identik/signed-artifact/route.ts", "utf8")
  expect(source).toContain('access.role === "owner"')
  expect(source).toContain('contract.status !== "agreed"')
  expect(source).toContain('.eq("lead_contract_id", contract.id).eq("status", "completed")')
  expect(source).toContain("downloadSignedPdf(id)")
  expect(source).toContain("downloadCertificate(id)")
  expect(source).toContain(".from(IDENTIK_ARTIFACT_BUCKET).download(storedKey)")
  expect(source).toContain("if (storedKey)")
  expect(source).toContain("assertIdentikPdfDownload(bytes)")
  expect(source).toContain('"Cache-Control": "private, no-store, max-age=0"')
})

test("Identik: private completed-document archive uses immutable keys and provider confirmation", () => {
  const source = readFileSync("lib/identik/archive-artifacts.ts", "utf8")
  expect(source).toContain('IDENTIK_ARTIFACT_BUCKET = "identik-contracts"')
  expect(source).toContain('if (row.status !== "completed")')
  expect(source).toContain('String(provider.status).toUpperCase() !== "COMPLETED"')
  expect(source).toContain('assertIdentikPdfDownload(bytes)')
  expect(source).toContain('upsert: false')
  expect(source).toContain('createHash("sha256")')
  expect(source).toContain('.eq("status", "completed").is(column, null)')
  expect(source).toContain('ARTIFACT_CONFLICT_DIFFERENT_BYTES')
})

test("Identik: only authenticated QA workflow can archive, never a public request", () => {
  const source = readFileSync("app/api/qa/identik/archive-completed/route.ts", "utf8")
  expect(source).toContain('validQaWorkflowToken(auth.slice(7), sha)')
  expect(source).toContain('x-qa-intent')
  expect(source).toContain('archive-signed-documents')
  expect(source).toContain('if (bucketError || !bucket || bucket.public)')
  expect(source).toContain('.eq("status", "completed")')
  expect(source).toContain('archiveIdentikArtifacts(db, document, SANDBOX)')
  expect(source).toContain("failureCodes")
  expect(source).toContain("PRIVATE_ARCHIVE_BUCKET_UNAVAILABLE")
  expect(source).not.toContain('createDocument(')
  expect(source).not.toContain('distributeDocument(')
})
