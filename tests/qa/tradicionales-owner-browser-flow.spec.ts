import { test, expect } from '@playwright/test'

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zx7sAAAAASUVORK5CYII=',
  'base64',
)
const ID = '22222222-2222-4222-8222-222222222222'

// Browser contract test: real page / real controls / real form submission code.
// All write endpoints are intercepted at the browser, so this test never
// uploads to real R2 or inserts fake leads. Persistence is tested separately.
test('Propietario: formulario completo -> geografía -> foto -> solicitud -> pantalla éxito', async ({ page }) => {
  test.setTimeout(80_000)
  let leadPayload: Record<string, any> | undefined
  let mediaPayload: Record<string, any> | undefined
  let presignPayload: Record<string, any> | undefined
  let uploadedBytes = 0

  // Deny any unanticipated API request. Register first; specific routes override.
  await page.route('**/api/**', route => route.abort('blockedbyclient'))
  await page.route('**/api/lead-intake', async route => {
    leadPayload = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, lead_id: ID }) })
  })
  await page.route('**/api/r2/presign', async route => {
    presignPayload = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, key: 'qa/mock-owner-photo.png',
        uploadUrl: '/api/qa/e2e-owner-upload', publicUrl: null }) })
  })
  await page.route('**/api/qa/e2e-owner-upload', async route => {
    expect(route.request().method()).toBe('PUT')
    uploadedBytes = route.request().postDataBuffer()?.byteLength ?? 0
    await route.fulfill({ status: 200, body: '' })
  })
  await page.route('**/api/owner-initial-media', async route => {
    mediaPayload = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) })
  })

  await page.goto('/propietarios', { waitUntil: 'load' })
  const form = page.locator('form.owner-form')
  await expect(form).toBeVisible()
  await form.locator('[name="full_name"]').fill('Propietario UI QA')
  await form.locator('[name="phone"]').fill('1155550001')
  await form.locator('[name="email"]').fill('qa-browser-owner@example.com')

  const selectors = form.locator('select.select')
  await selectors.nth(0).selectOption('02')
  await expect(selectors.nth(1)).toHaveValue('caba')
  await selectors.nth(2).selectOption({ label: 'Palermo' })
  await expect(form.locator('[name="neighborhood_slug"]')).toHaveValue('ar:02:caba:palermo')

  await form.locator('[name="property_type"]').selectOption({ index: 1 })
  await form.locator('[name="property_rooms"]').selectOption({ index: 1 })
  await form.locator('[name="approx_price"]').selectOption({ index: 1 })
  await form.locator('[name="availability_status"]').selectOption({ index: 1 })
  await form.locator('input[type=file]').setInputFiles({
    name: 'qa-owner-photo.png', mimeType: 'image/png', buffer: PNG,
  })

  // Ensure all required inputs survived initial Next.js hydration before submitting.
  await expect(form.locator('[name="full_name"]')).toHaveValue('Propietario UI QA')
  await expect(form.locator('[name="email"]')).toHaveValue('qa-browser-owner@example.com')
  await form.getByRole('button', { name: /Ver si mi propiedad matchea/i }).click()
  await expect(page).toHaveURL(new RegExp('/success\\?role=owner&lead=' + ID), { timeout: 25_000 })

  expect(leadPayload).toMatchObject({
    full_name: 'Propietario UI QA',
    email: 'qa-browser-owner@example.com',
    role: 'owner', intent: 'owner_new_listing',
    zone: 'Palermo, CABA',
    neighborhood_slug: 'ar:02:caba:palermo',
    source: 'verlo_propietarios',
  })
  expect(presignPayload).toMatchObject({ folder: 'owner-media', id: ID })
  expect(uploadedBytes).toBeGreaterThan(0)
  expect(mediaPayload).toMatchObject({
    owner_lead_id: ID, dispatch_matches: false,
    media: [{ key: 'qa/mock-owner-photo.png', mediaType: 'photo' }],
  })
})

test('Propietario: fallo en multimedia no debe mostrar éxito ni navegar', async ({ page }) => {
  test.setTimeout(70_000)
  let leadCalled = 0
  let presignCalled = 0
  let mediaCalled = 0

  await page.route('**/api/**', route => route.abort('blockedbyclient'))
  await page.route('**/api/lead-intake', async route => {
    leadCalled += 1
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, lead_id: ID }) })
  })
  await page.route('**/api/r2/presign', async route => {
    presignCalled += 1
    await route.fulfill({ status: 500, contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'QA_UPLOAD_UNAVAILABLE' }) })
  })
  await page.route('**/api/owner-initial-media', async route => {
    mediaCalled += 1
    await route.fulfill({ status: 500, body: '{}' })
  })

  await page.goto('/propietarios', { waitUntil: 'load' })
  const form = page.locator('form.owner-form')
  await form.locator('[name="full_name"]').fill('Propietario QA Fallo Media')
  await form.locator('[name="phone"]').fill('1155550001')
  await form.locator('[name="email"]').fill('qa-owner-failure@example.com')
  const selectors = form.locator('select.select')
  await selectors.nth(0).selectOption('02')
  await expect(selectors.nth(1)).toHaveValue('caba')
  await selectors.nth(2).selectOption({ label: 'Palermo' })
  await expect(form.locator('[name="neighborhood_slug"]')).toHaveValue('ar:02:caba:palermo')
  await form.locator('[name="property_type"]').selectOption({ index: 1 })
  await form.locator('[name="property_rooms"]').selectOption({ index: 1 })
  await form.locator('[name="approx_price"]').selectOption({ index: 1 })
  await form.locator('[name="availability_status"]').selectOption({ index: 1 })
  await form.locator('input[type=file]').setInputFiles({
    name: 'qa-owner-photo.png', mimeType: 'image/png', buffer: PNG,
  })

  // An earlier run showed the name cleared by hydration despite fill() returning.
  // Fail explicitly on an empty required field rather than timing out on a missing API error.
  await expect(form.locator('[name="full_name"]')).toHaveValue('Propietario QA Fallo Media')
  await expect(form.locator('[name="email"]')).toHaveValue('qa-owner-failure@example.com')
  await form.getByRole('button', { name: /Ver si mi propiedad matchea/i }).click()
  // Image optimization may take longer under two parallel browser workers.
  // Still require the actual visible error, never accept a silent failure.
  const error = page.locator('form.owner-form .form-message.error')
  await expect(error).toBeVisible({ timeout: 30_000 })
  await expect(error).toContainText('QA_UPLOAD_UNAVAILABLE')
  expect(leadCalled).toBe(1)
  expect(presignCalled).toBe(1)
  expect(mediaCalled).toBe(0)
  expect(new URL(page.url()).pathname).toBe('/propietarios')
})
