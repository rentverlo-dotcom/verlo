import { createHash } from "node:crypto"
import { createCaucionContractPdf } from "@/lib/powermarket/contract-pdf"

// Temporarios stays a separate contractual flow and data model. Only the
// visual PDF renderer is shared with Tradicionales to enforce VerloBrand.
export function createTemporaryContractPdf(args: {
  documentText: string
  version: number
  sha256: string
  contractId: string
}): Buffer {
  return createCaucionContractPdf({
    ...args,
    headingOverride: "CONTRATO DE ESTADÍA TEMPORARIA",
  })
}

export function verifyTemporaryContractText(text: string, expectedHash: string): boolean {
  return createHash("sha256").update(text, "utf8").digest("hex") === expectedHash
}
