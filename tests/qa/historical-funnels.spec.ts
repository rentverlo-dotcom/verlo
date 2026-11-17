import { test, expect } from '@playwright/test'

test('La portada dirige alquiler permanente al circuito vigente', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('link', { name: /ALQUILER PERMANENTE/i }).click()
  await expect(page).toHaveURL(/\/permanentes(?:[?#]|$)/)
  await expect(page.locator('body')).toContainText(/verlo|alquiler/i)
})

test('Enlaces históricos de campañas preservan parámetros al llegar a permanentes', async ({ page }) => {
  await page.goto('/?utm_source=meta&utm_campaign=qa_historica#sumate', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/permanentes\?utm_source=meta&utm_campaign=qa_historica#sumate/, { timeout: 20000 })
})

test('Los formularios viejos no permiten llegar a las tablas de la primera etapa', async ({ page }) => {
  await page.goto('/buscar', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/permanentes(?:[?#]|$)/)
  await page.goto('/propietario/publicar-v2', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/propietarios(?:[?#]|$)/)
})
