import { test, expect } from '@playwright/test'

test('QA contract lifecycle cannot be triggered without a signed workflow identity', async ({ request }) => {
  const a = await request.post('/api/qa/contracts/lifecycle', { data: {} })
  expect(a.status()).toBe(403)
  expect(await a.json()).toMatchObject({ ok: false, error: 'QA_ONLY' })

  const b = await request.post('/api/qa/contracts/lifecycle', {
    headers: { Authorization: 'Bearer forged-test-token' }, data: {},
  })
  expect(b.status()).toBe(403)
  expect(await b.json()).toMatchObject({ ok: false, error: 'QA_ONLY' })
})
