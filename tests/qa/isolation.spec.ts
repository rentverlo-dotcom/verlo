import { test, expect } from '@playwright/test'

test('QA deployment uses only the QA database', async ({ request }) => {
  const response = await request.get('/api/qa/status')
  expect(response.status()).toBe(200)
  expect(await response.json()).toEqual({
    ok: true,
    branch: true,
    database: true,
  })
})

test('QA blocks API writes before E2E is unlocked', async ({ request }) => {
  const response = await request.post('/api/lead-intake', {
    data: {
      email: 'qa-blocked@example.com',
      role: 'tenant',
    },
  })
  expect(response.status()).toBe(503)
  expect(await response.json()).toMatchObject({ error: 'QA_API_LOCKED' })
})

test('QA blocks production payment endpoint', async ({ request }) => {
  const response = await request.post('/api/payments/create', {
    data: { qa: true },
  })
  expect(response.status()).toBe(503)
  expect(await response.json()).toMatchObject({ error: 'QA_API_LOCKED' })
})

test('QA blocks webhook entrypoints', async ({ request }) => {
  const response = await request.post('/api/webhooks/mercadopago', {
    data: { qa: true },
  })
  expect(response.status()).toBe(503)
  expect(await response.json()).toMatchObject({ error: 'QA_API_LOCKED' })
})
