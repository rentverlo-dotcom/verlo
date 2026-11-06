import { test, expect } from '@playwright/test'

test('Mi VERLO QA-only audit rejects calls without authorization', async ({ request }) => {
  const res = await request.post('/api/qa/mi-verlo/isolation', { data: {} })
  expect(res.status()).toBe(403)
  expect(await res.json()).toMatchObject({ ok: false, error: 'QA_ONLY' })
})
