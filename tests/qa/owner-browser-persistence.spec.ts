import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zx7sAAAAASUVORK5CYII=',
  'base64',
)

// Actual browser owner intake + Supabase QA persistence + QA-only media metadata.
// R2 is deliberately simulated because a separate QA bucket is not certified.
// No external uploads, real email/Push or production database modifications.
test('Propietario: navegador -> intake real -> multimedia QA -> éxito y persistencia', async ({ page, request }) => {
  test.setTimeout(120_000)
  const run = randomUUID().slice(0, 12)
  const email = `qa-owner-browser-${run}@example.com`
  let leadResult: { status: number; data: any } | null = null
  let ownerLeadId = ''
  let actualOwnerPayload: any = null
  let photoBytes = 0
  let mediaSubmitted = false

  await page.route('**/api/lead-intake', async route => {
    const payload = route.request().postDataJSON()
    actualOwnerPayload = payload
    expect(payload).toMatchObject({
      role: 'owner', intent: 'owner_new_listing', email,
      neighborhood_slug: 'ar:02:caba:palermo',
      property_type: 'Departamento', property_rooms: '2 ambientes',
      approx_price_number: 900000,
    })
    // Actual QA intake endpoint: only source is tagged synthetic for middleware.
    const upstream = await route.fetch({ postData: JSON.stringify({
      ...payload, source: 'qa_e2e_owner_browser',
    }) })
    const data = await upstream.json()
    leadResult = { status: upstream.status(), data }
    ownerLeadId = String(data.lead_id || '')
    await route.fulfill({ response: upstream })
  })

  await page.route('**/api/r2/presign', async route => {
    const input = route.request().postDataJSON()
    expect(input).toMatchObject({ folder: 'owner-media' })
    expect(input.id).toBe(ownerLeadId)
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        ok: true, key: `qa-browser-fixture/${ownerLeadId}/photo.png`,
        uploadUrl: '/api/qa/owner-browser-upload', publicUrl: null,
      }),
    })
  })

  await page.route('**/api/qa/owner-browser-upload', async route => {
    expect(route.request().method()).toBe('PUT')
    photoBytes = route.request().postDataBuffer()?.length || 0
    await route.fulfill({ status: 200, body: '' })
  })

  await page.route('**/api/owner-initial-media', async route => {
    const input = route.request().postDataJSON()
    expect(input.owner_lead_id).toBe(ownerLeadId)
    expect(input.media).toHaveLength(1)
    expect(input.dispatch_matches).toBe(false)

    // QA endpoint actually persists metadata to the QA database, but no R2 object.
    const response = await request.post('/api/qa/tradicionales/media', {
      data: { owner_lead_id: ownerLeadId },
    })
    const data = await response.json()
    expect(response.status(), JSON.stringify(data)).toBe(200)
    expect(data).toMatchObject({
      ok: true, qaOnly: true, noExternalR2: true,
      inserted: true, rows: 1, ownerVerified: true,
    })
    mediaSubmitted = true
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
  })

  await page.goto('/propietarios', { waitUntil: 'networkidle' })
  const form = page.locator('form.owner-form')
  await expect(form).toBeVisible()
  await form.locator('[name="full_name"]').fill('Propietario QA Browser')
  await form.locator('[name="phone"]').fill('1155550001')
  await form.locator('[name="email"]').fill(email)

  const selects = form.locator('select.select')
  await selects.nth(0).selectOption('02')
  await expect(selects.nth(1)).toHaveValue('caba')
  await selects.nth(2).selectOption({ label: 'Palermo' })
  await expect(form.locator('input[name="neighborhood_slug"]')).toHaveValue('ar:02:caba:palermo')
  await form.locator('[name="property_type"]').selectOption('Departamento')
  await form.locator('[name="property_rooms"]').selectOption({ label: '2 ambientes' })
  await form.locator('[name="approx_price"]').selectOption('700001-900000')
  await form.locator('[name="availability_status"]').selectOption('En 1 a 3 meses')
  await form.locator('input[type="file"]').setInputFiles({
    name: 'qa-owner-photo.png', mimeType: 'image/png', buffer: png,
  })

  await form.getByRole('button', { name: /Ver si mi propiedad matchea/i }).click()
  await expect(page).toHaveURL(/\/success\?role=owner&lead=/, { timeout: 35_000 })
  expect(leadResult).not.toBeNull()
  expect(leadResult!.status, JSON.stringify(leadResult!.data)).toBe(200)
  expect(ownerLeadId).toMatch(/^[0-9a-f-]{36}$/i)
  expect(actualOwnerPayload.source).toBe('verlo_propietarios')
  expect(photoBytes).toBeGreaterThan(0)
  expect(mediaSubmitted).toBe(true)
  await expect(page).toHaveURL(new RegExp('/success\\?role=owner&lead=' + ownerLeadId), { timeout: 10_000 })

  // Repeat the QA metadata operation: idempotent, one owner -> one media record.
  const repeat = await request.post('/api/qa/tradicionales/media', {
    data: { owner_lead_id: ownerLeadId },
  })
  const repeated = await repeat.json()
  expect(repeat.status(), JSON.stringify(repeated)).toBe(200)
  expect(repeated).toMatchObject({
    ok: true, qaOnly: true, noExternalR2: true,
    inserted: false, rows: 1, ownerVerified: true,
  })
})
