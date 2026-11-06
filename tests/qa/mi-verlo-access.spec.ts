import { test, expect } from '@playwright/test'

test('Mi VERLO redirects a visitor without a session to login', async ({ page }) => {
  await page.goto('/mi-verlo', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/login\?next=%2Fmi-verlo/, { timeout: 20_000 })
})

test('Mi VERLO rejects a request without Supabase session with HTTP 401', async ({ request }) => {
  const response = await request.get('/api/mi-verlo')
  expect(response.status()).toBe(401)
  expect(await response.json()).toMatchObject({ ok: false, error: 'Missing session' })
})

test('Mi VERLO rejects forged Bearer tokens with HTTP 401', async ({ request }) => {
  const response = await request.get('/api/mi-verlo', {
    headers: { Authorization: 'Bearer qa-forged-token' },
  })
  expect(response.status()).toBe(401)
  expect(await response.json()).toMatchObject({ ok: false, error: 'Invalid session' })
})

test('Mi VERLO does not allow unauthenticated users to query another lead ID', async ({ request }) => {
  const response = await request.get('/api/mi-verlo?lead_id=00000000-0000-4000-8000-000000000001', {
    headers: { Authorization: 'Bearer qa-forged-token' },
  })
  expect(response.status()).toBe(401)
  expect(await response.json()).toMatchObject({ ok: false, error: 'Invalid session' })
})
