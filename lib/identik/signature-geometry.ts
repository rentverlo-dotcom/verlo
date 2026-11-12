/** Percent-based fields for Identik Electronic v2.
 * PDF A4 media box: 595 x 842 points, bottom-left PDF origin.
 * Identik uses page-relative percentage positions, top-left screen origin.
 * Do not pass point coordinates directly to Identik.
 */
export type IdentikSignatureField = {
  type: 'SIGNATURE'
  pageNumber: number
  pageX: number
  pageY: number
  width: number
  height: number
}
const PDF_WIDTH = 595
const PDF_HEIGHT = 842
const SLOT_LEFT = 52
const SLOT_WIDTH = 258
const SLOT_HEIGHT = 44
// Slot is ABOVE the printed signature line and BELOW the role label.
const SLOTS = {
  owner: { bottom: 554 },
  tenant: { bottom: 399 },
} as const
const percent = (point: number, dimension: number) =>
  Math.round((point / dimension) * 10_000) / 100

export function identikSignatureField(
  signer: keyof typeof SLOTS,
  signingPage: number,
): IdentikSignatureField {
  if (!Number.isSafeInteger(signingPage) || signingPage < 1) {
    throw new Error('INVALID_SIGNING_PAGE')
  }
  const { bottom } = SLOTS[signer]
  const field: IdentikSignatureField = {
    type: 'SIGNATURE',
    pageNumber: signingPage,
    pageX: percent(SLOT_LEFT, PDF_WIDTH),
    pageY: percent(PDF_HEIGHT - bottom - SLOT_HEIGHT, PDF_HEIGHT),
    width: percent(SLOT_WIDTH, PDF_WIDTH),
    height: percent(SLOT_HEIGHT, PDF_HEIGHT),
  }
  validateIdentikSignatureField(field)
  return field
}

export function validateIdentikSignatureField(f: IdentikSignatureField): void {
  if (!Number.isSafeInteger(f.pageNumber) || f.pageNumber < 1 ||
      ![f.pageX, f.pageY, f.width, f.height].every(Number.isFinite) ||
      f.pageX < 0 || f.pageY < 0 || f.width < 1 || f.height < 1 ||
      f.pageX + f.width > 100 || f.pageY + f.height > 100) {
    throw new Error('IDENTIK_SIGNATURE_OUTSIDE_PAGE')
  }
}
