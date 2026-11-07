import { test, expect } from '@playwright/test'

test('Inquilino: CTA enters active permanent rental matching funnel', async ({ page }) => {
  // Wait for Next.js hydration before clicking a client-side CTA.
  await page.goto('/inquilino', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Buscar propiedades/i }).click()
  await expect(page).toHaveURL(/\/permanentes(?:[?#]|$)/, { timeout: 20_000 })
  await expect(page.locator('body')).toContainText(/alquiler|verlo/i)
})

test('Publicar antiguo: redirige al formulario de propietarios vigente', async ({ page }) => {
  await page.goto('/propietario/publicar-v2', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/propietarios(?:[?#]|$)/)
  await expect(page.locator('form.owner-form')).toBeVisible()
})
