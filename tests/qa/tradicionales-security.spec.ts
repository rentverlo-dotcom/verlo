import { test, expect } from '@playwright/test'

test('QA rechaza lead real aunque el formulario use la ruta de captación', async ({ request }) => {
  const res = await request.post('/api/lead-intake', {
    data: {
      full_name: 'Usuario no autorizado',
      email: 'persona@ejemplo.com',
      phone: '1155559000',
      role: 'tenant',
      intent: 'tenant_search',
      source: 'verlo_prod_like',
    },
  })
  expect(res.status()).toBe(503)
  expect(await res.json()).toMatchObject({ error: 'QA_API_LOCKED' })
})

test('QA no acepta email ficticio sin procedencia de E2E', async ({ request }) => {
  const res = await request.post('/api/lead-intake', {
    data: {
      full_name: 'No autorizado',
      email: 'no-autorizado@example.com',
      phone: '1155559000',
      role: 'owner',
      intent: 'owner_new_listing',
      source: 'verlo_propietarios',
    },
  })
  expect(res.status()).toBe(503)
  expect(await res.json()).toMatchObject({ error: 'QA_API_LOCKED' })
})

test('Simulador QA no acepta identificadores inválidos', async ({ request }) => {
  const res = await request.post('/api/qa/tradicionales/notify', {
    data: { match_id: 'invalid' },
  })
  expect(res.status()).toBe(400)
  expect(await res.json()).toMatchObject({ ok: false, error: 'INVALID_MATCH' })
})

test('QA bloquea APIs de pagos y autenticación interna no habilitadas', async ({ request }) => {
  for (const path of ['/api/webhooks/mercadopago', '/api/auth/activate-lead']) {
    const res = await request.post(path, { data: { qa: true } })
    expect(res.status(), path).toBe(503)
    expect(await res.json()).toMatchObject({ error: 'QA_API_LOCKED' })
  }
})
