import { test, expect, devices } from '@playwright/test'

// Real mobile viewport + touch emulation on Chromium; no external deliveries.
// This suite runs only against the pinned isolated QA deployment.
test.use({ ...devices['Pixel 7'] })

test('Mobile: tenant entry leads to the current permanent-rental form', async ({ page }) => {
  await page.goto('/inquilino', { waitUntil: 'domcontentloaded' })
  const cta = page.getByRole('button', { name: 'Buscar propiedades' })
  await expect(cta).toBeVisible()
  await cta.click()
  await expect(page).toHaveURL(/\/permanentes(?:[?#]|$)/, { timeout: 20_000 })
  await expect(page.locator('body')).toContainText(/busco alquilar|alquiler|verlo/i)
})

test('Mobile: owner form remains usable and cannot submit empty data', async ({ page }) => {
  let writes = 0
  page.on('request', request => {
    if (request.method() !== 'GET' && /\/api\/(lead-intake|owner-initial-media|r2\/presign)/.test(request.url())) {
      writes++
    }
  })
  await page.goto('/propietarios', { waitUntil: 'domcontentloaded' })
  const form = page.locator('form.owner-form')
  await expect(form).toBeVisible()
  await expect(form.locator('[name="full_name"]')).toBeVisible()
  await expect(form.locator('[name="phone"]')).toBeVisible()
  await expect(form.locator('[name="email"]')).toBeVisible()
  await form.getByRole('button', { name: /Ver si mi propiedad matchea/i }).click()
  await expect(form.locator('[name="full_name"]')).toBeFocused()
  expect(writes).toBe(0)
})
