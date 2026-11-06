import { test, expect } from '@playwright/test'

test('Mi VERLO QA preflight has synthetic owner and tenant paired matches', async ({request}) => {
  const res = await request.get('/api/qa/mi-verlo/preflight')
  const body = await res.json()
  expect(res.status(), JSON.stringify(body)).toBe(200)
  expect(body).toMatchObject({
    ok: true,
    isolated: true,
    matchingFixturesAvailable: true,
    realAuthRunStatus: 'NOT_EXECUTED_BY_PREFLIGHT',
  })
})

test('Mi VERLO private two-user probe rejects callers without its server credential', async ({request}) => {
  const res = await request.post('/api/qa/mi-verlo/isolation', {data: {}})
  expect(res.status()).toBe(403)
  expect(await res.json()).toMatchObject({ok:false,error:'QA_ONLY'})
})
