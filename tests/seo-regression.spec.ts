import { test, expect } from "@playwright/test"

const georefOlivos = {
  ok: true,
  location: {
    provinceId: "06", provinceName: "Buenos Aires",
    municipalityId: "060756", municipalityName: "Vicente López",
    localityId: "06075610", localityName: "Olivos",
    latitude: -34.51, longitude: -58.49,
    key: "ar:06:060756:06075610", label: "Olivos, Vicente López, Buenos Aires",
  },
}
const municipalityList = { municipios: [{ id: "060756", nombre: "Vicente López" }] }
const localityList = { localidades: [{ id: "06075610", nombre: "Olivos", centroide: { lat: -34.51, lon: -58.49 } }] }

for (const route of ["/?zona=olivos#sumate", "/propietarios?zona=olivos#cargar"]) {
  test(`SEO preselect, manual change and hidden fields: ${route}`, async ({ page }) => {
    await page.route("**/api/georef/seo-location?*", async r => r.fulfill({ json: georefOlivos }))
    await page.route("**/api/georef/municipios?*", async r => r.fulfill({ json: municipalityList }))
    await page.route("**/api/georef/localidades?*", async r => r.fulfill({ json: localityList }))
    await page.goto(route, { waitUntil: "domcontentloaded" })
    const form = route.startsWith("/propietarios") ? page.locator("form.owner-form") : page.locator("form").filter({has: page.locator('input[name="tenant_georef"]')}).first()
    await expect(form).toBeVisible()
    const georef = form.locator(route.startsWith("/propietarios") ? 'input[name="owner_georef"]' : 'input[name="tenant_georef"]')
    await expect.poll(async () => {
      const raw = await georef.inputValue()
      try { return JSON.parse(raw)[0]?.key || null } catch { return null }
    }, { timeout: 20000 }).toBe(georefOlivos.location.key)
    const selects = form.locator("select.select")
    await expect(selects.nth(0)).toHaveValue("06")
    await expect(selects.nth(1)).toHaveValue("060756", { timeout: 20000 })
    await expect(selects.nth(2)).toHaveValue("06075610", { timeout: 20000 })
    await selects.nth(2).selectOption("")
    await expect(georef).toHaveValue("[]")
    await expect(selects.nth(2)).toHaveValue("")
  })
}

test("SEO pages and registration routes load without 5xx", async ({ request }) => {
  for(const path of ["/", "/propietarios", "/alquileres", "/alquileres/olivos", "/robots.txt", "/sitemap.xml"]) {
    const response=await request.get(path)
    expect(response.status(), `${path} returned ${response.status()}`).toBeLessThan(500)
  }
})

test("Georef official SEO endpoint resolves known cities", async ({ request }) => {
  for(const slug of ["olivos","cordoba","bariloche","mar-del-plata","rio-gallegos"]) {
    const response=await request.get(`/api/georef/seo-location?zona=${slug}`)
    expect(response.ok(), `${slug}: HTTP ${response.status()}`).toBeTruthy()
    const data=await response.json()
    expect(data.ok, slug).toBe(true)
    expect(data.location?.key, slug).toMatch(/^ar:/)
  }
})
