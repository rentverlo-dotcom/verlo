import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

// This is NOT a mocked intake: the browser submits to the real QA handler.
// Rewriting only the source marks the synthetic request for QA middleware;
// the actual form fields, API, matching RPC and database writes remain real.
test('Inquilino: formulario real -> intake QA -> match persistido con propietario QA', async ({ page, request }) => {
  test.setTimeout(120_000)
  const run = randomUUID().slice(0, 12)
  const owner = await request.post('/api/lead-intake', {
    data: {
      full_name: 'Propietario E2E Browser QA',
      email: `qa-browser-owner-${run}@example.com`,
      phone: '1155550001',
      role: 'owner',
      intent: 'owner_new_listing',
      source: 'qa_e2e_browser_owner',
      zone: 'Palermo, CABA',
      neighborhood_labels: ['Palermo, CABA'],
      neighborhood_slugs: ['ar:02:caba:palermo'],
      neighborhood_slug: 'ar:02:caba:palermo',
      metadata: { georef: [{
        provinceId: '02', provinceName: 'Ciudad Autónoma de Buenos Aires',
        municipalityId: 'caba', municipalityName: 'Ciudad Autónoma de Buenos Aires',
        localityId: 'Palermo', localityName: 'Palermo',
        key: 'ar:02:caba:palermo', label: 'Palermo, CABA',
      }] },
      property_type: 'Departamento',
      property_rooms: '2 ambientes',
      approx_price: '700001-900000',
      approx_price_number: 900000,
      availability_status: 'En 1 a 3 meses',
      accepted_income_proof_types: ['salary_receipt'],
      min_income_ratio: 2,
      accepted_guarantee_types: ['surety_insurance'],
    },
  })
  const ownerData = await owner.json()
  expect(owner.status(), JSON.stringify(ownerData)).toBe(200)
  expect(ownerData.lead_id).toMatch(/^[0-9a-f-]{36}$/i)

  let actualTenantPayload: Record<string, unknown> | null = null
  let tenantApiResult: { status: number; body: Record<string, any> } | null = null
  await page.route('**/api/lead-intake', async route => {
    const payload = route.request().postDataJSON()
    expect(payload.role).toBe('tenant')
    expect(payload.intent).toBe('tenant_search')
    expect(payload.email).toBe(`qa-browser-tenant-${run}@example.com`)
    actualTenantPayload = payload

    // Call the REAL QA API, read its response before the success redirect,
    // then forward that very response to the page. No fabricated success.
    const upstream = await route.fetch({
      postData: JSON.stringify({ ...payload, source: 'qa_e2e_browser_tenant' }),
    })
    const body = await upstream.json()
    tenantApiResult = { status: upstream.status(), body }
    await route.fulfill({ response: upstream })
  })

  await page.goto('/permanentes', { waitUntil: 'networkidle' })
  const form = page.locator('form.form')
  await expect(form).toBeVisible()
  await form.locator('[name="full_name"]').fill('Inquilino E2E Browser QA')
  await form.locator('[name="phone"]').fill('1155550002')
  await form.locator('[name="email"]').fill(`qa-browser-tenant-${run}@example.com`)

  const location = form.locator('.neighborhood-box').first()
  await location.locator('select').nth(0).selectOption('02')
  await expect(location.locator('select').nth(1)).toHaveValue('caba')
  await location.locator('select').nth(2).selectOption({ label: 'Palermo' })
  await location.getByRole('button', { name: 'Agregar zona' }).click()
  await expect(form.locator('input[name="tenant_neighborhood_slugs"]')).toHaveValue('ar:02:caba:palermo')

  await form.locator('[name="desired_property_type"]').selectOption('Departamento')
  await form.locator('[name="desired_rooms"]').selectOption({ label: '2 ambientes' })
  await form.locator('[name="budget_range"]').selectOption('700001-900000')
  await form.locator('[name="move_timing"]').selectOption('En 1 a 3 meses')
  await form.locator('[name="income_proof_type"]').selectOption('salary_receipt')
  await form.locator('[name="income_range"]').selectOption('2000001-3000000')
  await form.locator('input[name="guarantee_types"][value="surety_insurance"]').check()

  await form.getByRole('button', { name: /Cargar mi búsqueda/i }).click()
  await expect(page).toHaveURL(/\/success\?role=tenant&lead=/, { timeout: 30_000 })
  expect(tenantApiResult, 'QA API response must be captured before navigation').not.toBeNull()
  const tenantData = tenantApiResult!.body
  expect(tenantApiResult!.status, JSON.stringify(tenantData)).toBe(200)
  expect(tenantData.ok).toBe(true)
  expect(tenantData.lead_id).toMatch(/^[0-9a-f-]{36}$/i)
  expect(actualTenantPayload).toMatchObject({
    role: 'tenant', intent: 'tenant_search',
    neighborhood_slugs: ['ar:02:caba:palermo'],
    desired_property_type: 'Departamento',
    desired_rooms: '2 ambientes',
    budget_max: 900000,
  })
  await expect(page).toHaveURL(new RegExp('/success\\?role=tenant&lead=' + tenantData.lead_id), { timeout: 30_000 })

  const audit = await request.get(
    `/api/qa/tradicionales/result?owner=${ownerData.lead_id}&tenant=${tenantData.lead_id}`,
  )
  const persisted = await audit.json()
  expect(audit.status(), JSON.stringify(persisted)).toBe(200)
  expect(persisted.qaLeadsPersisted).toBe(true)
  expect(persisted.matches.length, JSON.stringify(persisted)).toBeGreaterThan(0)
  expect(persisted.matches[0].score).toBeGreaterThanOrEqual(80)
  expect(persisted.notificationEvents).toBe(0)
})
