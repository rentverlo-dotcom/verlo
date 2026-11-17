/** A transport sanity check, NOT a cryptographic signature validation.
 * Signed documents can legitimately contain incremental PDF revisions.
 */
export function assertIdentikPdfDownload(bytes: Uint8Array): void {
  if (bytes.byteLength < 256 || bytes.byteLength > 50 * 1024 * 1024)
    throw new Error("Identik signed PDF has an invalid size")
  const prefix = Buffer.from(bytes.subarray(0, 12)).toString("latin1")
  const tail = Buffer.from(bytes.subarray(Math.max(0, bytes.length - 2048))).toString("latin1")
  if (!/^%PDF-(?:1\.[0-7]|2\.0)/.test(prefix) || !tail.includes("%%EOF"))
    throw new Error("Identik signed PDF is not a complete PDF document")
}
