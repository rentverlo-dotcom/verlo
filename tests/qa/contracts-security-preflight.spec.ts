import { test, expect } from '@playwright/test'

test('Tradicionales: matching and contracts cannot be accessed with forged party tokens', async ({ request }) => {
  const response = await request.get('/api/qa/contracts/preflight', { timeout: 40_000 })
  const data = await response.json()
  expect(response.status(), JSON.stringify(data)).toBe(200)
  expect(data).toMatchObject({
    ok: true, qaOnly: true, readOnly: true, noProviderCalls: true,
    invalidTenantTokenRejected: true,
    invalidOwnerTokenRejected: true,
    invalidContractTokenRejected: true,
  })
  expect(data.compatibleMatches).toBeGreaterThan(0)
  expect(data.contractRecords).toBeGreaterThanOrEqual(0)
})

test('QA continues preventing direct writes to match and contract operations', async ({ request }) => {
  for (const endpoint of ['/api/match-interest', '/api/owner-interest', '/api/post-visit-decision']) {
    const response = await request.post(endpoint, { data: { token: 'not-valid', match_id: 'not-valid' } })
    expect(response.status(), endpoint).toBe(503)
    expect(await response.json()).toMatchObject({ error: 'QA_API_LOCKED' })
  }
})
