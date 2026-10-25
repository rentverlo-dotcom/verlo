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


test("Lead intake honeypot rejects both roles without creating data", async ({ request }) => {
  for (const role of ["tenant", "owner"]) {
    const response = await request.post("/api/lead-intake", {
      data: {
        website: "automated-check-no-write",
        role,
        intent: role === "tenant" ? "tenant_search" : "owner_new_listing",
        metadata: { georef: JSON.stringify([georefOlivos.location]) },
      },
    })
    expect(response.status(), role).toBe(200)
    const result = await response.json()
    expect(result.bot_filtered, role).toBe(true)
    expect(result.lead_id, role).toBeUndefined()
  }
})

test("Department-backed selector renders and keeps canonical location", async ({ page }) => {
  const location = {
    ...georefOlivos.location,
    provinceId: "78", provinceName: "Santa Cruz",
    municipalityId: "dept:78021", municipalityName: "Güer Aike",
    localityId: "78021040", localityName: "Río Gallegos",
    key: "ar:78:dept:78021:78021040",
    label: "Río Gallegos, Güer Aike, Santa Cruz",
  }
  await page.route("**/api/georef/seo-location?*", async route => route.fulfill({ json: {ok:true, location} }))
  await page.route("**/api/georef/municipios?*", async route => route.fulfill({ json: {municipios:[{id:location.municipalityId,nombre:location.municipalityName}]} }))
  await page.route("**/api/georef/localidades?*", async route => route.fulfill({ json: {localidades:[{id:location.localityId,nombre:location.localityName}]} }))
  await page.goto("/?zona=rio-gallegos#sumate", {waitUntil:"domcontentloaded"})
  const form = page.locator("form").filter({has:page.locator('input[name="tenant_georef"]')}).first()
  const input = form.locator('input[name="tenant_georef"]')
  await expect.poll(async () => JSON.parse(await input.inputValue())[0]?.key, {timeout:20000}).toBe(location.key)
  const select = form.locator("select.select")
  await expect(select.nth(0)).toHaveValue("78")
  await expect(select.nth(1)).toHaveValue(location.municipalityId, {timeout:20000})
  await expect(select.nth(2)).toHaveValue(location.localityId, {timeout:20000})
})


test("Regression: failed neighborhood persistence must abort before matching and notifications", async () => {
  // Source-level invariant: deliberately avoids POSTing to shared Supabase.
  const { readFileSync } = await import("node:fs")
  const source = readFileSync("app/api/lead-intake/route.ts", "utf8")
  const guardStart = source.indexOf("if (\n      !neighborhoodResult.ok\n    )")
  const matchStart = source.indexOf("const matchResult =", guardStart)
  expect(guardStart).toBeGreaterThan(-1)
  expect(matchStart).toBeGreaterThan(guardStart)
  const guard = source.slice(guardStart, matchStart)
  expect(guard).toContain('.from("lead_intake")')
  expect(guard).toContain('.delete()')
  expect(guard).toContain('.eq("id", leadRecord.id)')
  expect(guard).toMatch(/return NextResponse\\.json\\([\\s\\S]*?status: 500/)
  expect(guard).not.toContain("createLeadMatches(")
  expect(guard).not.toContain("postInternal(")
})
