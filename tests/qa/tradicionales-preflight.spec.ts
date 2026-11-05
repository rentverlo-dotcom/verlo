import { test, expect } from '@playwright/test'

test('Tradicionales: QA schema queries succeed', async ({ request }) => {
  const response = await request.get('/api/qa/tradicionales/preflight')
  expect(response.status()).toBe(200)
  const result = await response.json()
  expect(result.ok).toBe(true)
  expect(result.environment).toBe('qa')
  expect(result.checks).toEqual([
    { table: 'lead_intake', ok: true, errorCode: null },
    { table: 'lead_matches', ok: true, errorCode: null },
  ])
})

test('Tradicionales: QA preflight is read-only', async ({ request }) => {
  const response = await request.post('/api/qa/tradicionales/preflight', { data: { qa: true } })
  expect(response.status()).toBe(503)
  expect(await response.json()).toMatchObject({ error: 'QA_API_LOCKED' })
})
