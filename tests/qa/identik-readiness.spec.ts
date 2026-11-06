import { test, expect } from '@playwright/test'

test('Identik readiness verifies QA isolation and sandbox-only configuration without spending credits', async ({ request }) => {
  const response = await request.get('/api/qa/identik/readiness')
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body).toMatchObject({
    ok: true,
    isolated: true,
    sandboxOnly: true,
  })
  expect(typeof body.apiTokenConfigured).toBe('boolean')
  expect(typeof body.webhookSecretConfigured).toBe('boolean')
  expect(typeof body.readyForSandboxE2E).toBe('boolean')
  expect(body.readyForSandboxE2E).toBe(
    body.apiTokenConfigured && body.webhookSecretConfigured,
  )
  // Readiness reports presence only: never expose token, signing URLs or secrets.
  expect(Object.keys(body).sort()).toEqual([
    'apiTokenConfigured',
    'isolated',
    'ok',
    'readyForSandboxE2E',
    'sandboxOnly',
    'webhookSecretConfigured',
  ])
})

test('QA rejects unsigned or unauthenticated Identik webhook', async ({ request }) => {
  const response = await request.post('/api/webhooks/identik-electronic', {
    data: { type: 'DOCUMENT_COMPLETED', documentId: 1 },
  })
  expect(response.status()).toBe(401)
  expect(await response.json()).toMatchObject({ ok: false })
})

test('Identik Sandbox accepts QA credentials without creating or signing a document', async ({ request }) => {
  const response = await request.get('/api/qa/identik/connectivity', { timeout: 40_000 })
  const body = await response.json()
  expect(response.status(), JSON.stringify(body)).toBe(200)
  expect(body).toMatchObject({
    ok: true,
    providerStatus: 404,
    credentialLikelyAccepted: true,
  })
})
