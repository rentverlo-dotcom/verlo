import { test, expect } from '@playwright/test'
import {
  IDENTIK_PENDING, identikCanAdvance, identikProviderStatus,
} from '../../lib/identik/reconciliation-status'

test('maps Identik provider status without trusting unknown data', () => {
  expect(identikProviderStatus('COMPLETED')).toBe('completed')
  expect(identikProviderStatus('in_progress')).toBe('pending')
  expect(identikProviderStatus('DECLINED')).toBe('rejected')
  expect(identikProviderStatus('CANCELED')).toBe('cancelled')
  expect(identikProviderStatus('EXPIRED')).toBe('expired')
  expect(identikProviderStatus('unexpected')).toBeNull()
  expect(identikProviderStatus({ status: 'completed' })).toBeNull()
})
test('never regresses terminal states, including duplicate callbacks', () => {
  for (const terminal of ['completed','rejected','cancelled','expired']) {
    expect(identikCanAdvance(terminal, 'completed')).toBe(false)
    expect(identikCanAdvance(terminal, 'pending')).toBe(false)
  }
  expect(identikCanAdvance('sent', 'completed')).toBe(true)
  expect(identikCanAdvance('sent', 'pending')).toBe(true)
  expect(identikCanAdvance('pending', 'sent')).toBe(false)
  expect(identikCanAdvance('pending', 'created')).toBe(false)
  expect(identikCanAdvance('pending', 'completed')).toBe(true)
  expect(identikCanAdvance('sent', 'sent')).toBe(false)
  expect([...IDENTIK_PENDING]).toEqual(['created','sent','pending'])
})
