import { test, expect } from '@playwright/test'

test('Mi VERLO redirects a visitor without a session to login', async ({ page }) => {
  await page.goto('/mi-verlo', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/login\?next=%2Fmi-verlo/, { timeout: 20_000 })
})

test('QA currently rejects dashboard API requests without a synthetic authenticated session', async ({ request }) => {
  const response = await request.get('/api/mi-verlo')
  expect(response.status()).toBe(503)
  expect(await response.json()).toMatchObject({ error: 'QA_API_LOCKED' })
})

test('QA prevents supplying an arbitrary lead ID to the dashboard API', async ({ request }) => {
  const response = await request.get('/api/mi-verlo?lead_id=00000000-0000-4000-8000-000000000001', {
    headers: { Authorization: 'Bearer invalid-test-token' },
  })
  expect(response.status()).toBe(503)
  expect(await response.json()).toMatchObject({ error: 'QA_API_LOCKED' })
})
