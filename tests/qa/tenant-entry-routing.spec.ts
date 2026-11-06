import { test, expect } from '@playwright/test'

test('Inquilino: CTA enters active permanent rental matching funnel', async ({ page }) => {
  await page.goto('/inquilino', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /Buscar propiedades/i }).click()
  await expect(page).toHaveURL(/\/permanentes(?:[?#]|$)/)
  await expect(page.locator('body')).toContainText(/alquiler|verlo/i)
})
