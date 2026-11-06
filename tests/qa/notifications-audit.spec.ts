import { test, expect } from '@playwright/test'

test('QA Email and Push outbox is idempotent and never dispatched externally', async ({ request }) => {
  const res = await request.get('/api/qa/notifications/preflight')
  const body = await res.json()
  expect(res.status(), JSON.stringify(body)).toBe(200)
  expect(body).toMatchObject({ ok: true, qaOnly: true, noExternalDelivery: true, sentPushEvents: 0, nonPendingEmailIntents: 0 })
  expect(body.matchedNotificationEvents).toBeGreaterThan(0)
  expect(body.matchedEmailIntents).toBe(body.matchedNotificationEvents)
})
