import { test, expect } from '@playwright/test'
import {
  identikSignatureField,
  validateIdentikSignatureField,
} from '../../lib/identik/signature-geometry'

// These are the actual PDF renderer's fixed A4 signature slots. Identik v2
// coordinates are page-relative percentages, never raw PDF points.
test('owner and tenant signature fields stay inside the actual A4 page', () => {
  const owner = identikSignatureField('owner', 2)
  const tenant = identikSignatureField('tenant', 2)
  expect(owner.type).toBe('SIGNATURE')
  expect(owner.pageNumber).toBe(2)
  expect(tenant.pageNumber).toBe(2)
  for (const f of [owner, tenant]) {
    expect(f.pageX).toBeGreaterThanOrEqual(0)
    expect(f.width).toBeGreaterThan(1)
    expect(f.height).toBeGreaterThan(1)
    expect(f.pageX + f.width).toBeLessThanOrEqual(100)
    expect(f.pageY + f.height).toBeLessThanOrEqual(100)
  }
  expect(owner.pageY + owner.height).toBeLessThan(tenant.pageY)
  expect(owner.pageX).toBe(tenant.pageX)
  expect(owner.width).toBe(tenant.width)
})

test('Identik geometry rejects the points-based values that broke document 32', () => {
  const owner = identikSignatureField('owner', 2)
  expect(() => validateIdentikSignatureField({
    ...owner, pageX: 52, pageY: 240, width: 260, height: 64,
  })).toThrow('IDENTIK_SIGNATURE_OUTSIDE_PAGE')
  expect(() => validateIdentikSignatureField({ ...owner, pageX: 99 }))
    .toThrow('IDENTIK_SIGNATURE_OUTSIDE_PAGE')
  expect(() => identikSignatureField('owner', 0)).toThrow('INVALID_SIGNING_PAGE')
})

test('Identik positional fields align with printed signature lines in A4 PDF', () => {
  const a4 = { width: 595, height: 842 }
  const owner = identikSignatureField('owner', 2)
  const tenant = identikSignatureField('tenant', 2)
  const fromTop = (f: typeof owner) => a4.height * f.pageY / 100
  const fromBottom = (f: typeof owner) => a4.height - fromTop(f) - a4.height * f.height / 100
  expect(fromBottom(owner)).toBeGreaterThan(548)
  expect(fromBottom(owner)).toBeLessThan(610)
  expect(fromBottom(tenant)).toBeGreaterThan(393)
  expect(fromBottom(tenant)).toBeLessThan(455)
})
