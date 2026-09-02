import { test, expect } from "@playwright/test"

test("abre Verlo", async ({ page }) => {
  await page.goto("https://verlo.lat")

  await expect(page).toHaveURL(/verlo\.lat/)
})
