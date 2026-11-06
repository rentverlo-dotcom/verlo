import { test, expect } from '@playwright/test'

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zx7sAAAAASUVORK5CYII=',
  'base64',
)

test('Propietarios: el formulario real pide los datos obligatorios', async ({ page }) => {
  await page.goto('/propietarios', { waitUntil: 'domcontentloaded' })
  const form = page.locator('form.owner-form')
  await expect(form).toBeVisible()
  await expect(form.locator('[name="full_name"]')).toBeVisible()
  await expect(form.locator('[name="phone"]')).toBeVisible()
  await expect(form.locator('[name="email"]')).toBeVisible()
  await expect(form.locator('[name="property_type"]')).toBeVisible()
  await expect(form.locator('[name="approx_price"]')).toBeVisible()
  await expect(form.getByRole('button', { name: /Ver si mi propiedad matchea/i })).toBeVisible()

  // A blank form must not call any business write API.
  let attemptedWrite = false
  page.on('request', request => {
    if (request.method() !== 'GET' &&
        /\/api\/(lead-intake|owner-initial-media|r2\/presign)/.test(request.url())) {
      attemptedWrite = true
    }
  })
  await form.getByRole('button', { name: /Ver si mi propiedad matchea/i }).click()
  await expect(form.locator('[name="full_name"]')).toBeFocused()
  expect(attemptedWrite).toBe(false)
})

test('Propietarios: selector real de fotos acumula archivos sin enviarlos', async ({ page }) => {
  await page.goto('/propietarios', { waitUntil: 'domcontentloaded' })
  const files = page.locator('form.owner-form input[type="file"][accept="image/*,video/*"]')
  await expect(files).toBeAttached()

  await files.setInputFiles({
    name: 'qa-owner-1.png', mimeType: 'image/png', buffer: png,
  })
  await expect(page.getByText('1 archivo seleccionado')).toBeVisible()

  await files.setInputFiles([
    { name: 'qa-owner-2.png', mimeType: 'image/png', buffer: png },
    { name: 'qa-owner-3.png', mimeType: 'image/png', buffer: png },
  ])
  await expect(page.getByText('3 archivos seleccionados')).toBeVisible()
})

test('Buscar: un visitante sin sesión debe pasar por login', async ({ page }) => {
  await page.goto('/buscar', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 })
})

test('Mi VERLO: un visitante sin sesión no puede abrir su panel privado', async ({ page }) => {
  await page.goto('/mi-verlo', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/login\?next=%2Fmi-verlo/, { timeout: 20_000 })
})
