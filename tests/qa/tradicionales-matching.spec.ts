import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const geo = {
  provinceId: '06',
  provinceName: 'Buenos Aires',
  municipalityId: '060756',
  municipalityName: 'Vicente López',
  localityId: '06075610',
  localityName: 'Olivos',
  key: 'ar:06:060756:06075610',
  label: 'Olivos, Vicente López, Buenos Aires',
  latitude: -34.51,
  longitude: -58.49,
}
const location = {
  zone: 'Olivos',
  neighborhood_labels: ['Olivos'],
  neighborhood_slugs: ['ar:06:060756:06075610'],
  neighborhood_slug: 'ar:06:060756:06075610',
  metadata: { georef: [geo] },
}

test('Tradicionales: propietario + inquilino crean un match persistido en Supabase QA', async ({ request, page }) => {
  test.setTimeout(90_000)
  const run = randomUUID().slice(0, 8)
  const source = 'qa_e2e_tradicionales'
  const ownerEmail = `qa-owner-${run}@example.com`
  const tenantEmail = `qa-tenant-${run}@example.com`

  const ownerResponse = await request.post('/api/lead-intake', {
    data: {
      full_name: 'Propietario QA Automatizado',
      email: ownerEmail,
      phone: '1155550001',
      role: 'owner',
      intent: 'owner_new_listing',
      source,
      ...location,
      property_type: 'Departamento',
      property_rooms: '2 ambientes',
      approx_price: '800000',
      approx_price_number: 800000,
      availability_status: 'En 1 a 3 meses',
      accepted_income_proof_types: ['salary_receipt'],
      min_income_ratio: 2,
      accepted_guarantee_types: ['surety_insurance'],
    },
  })
  const owner = await ownerResponse.json()
  expect(ownerResponse.status(), JSON.stringify(owner)).toBe(200)
  expect(owner.ok).toBe(true)
  expect(owner.lead_id).toMatch(/^[0-9a-f-]{36}$/i)
  expect(owner.meta?.skipped).toBe(true)
  expect(owner.push_events?.intake).toBeNull()

  const tenantResponse = await request.post('/api/lead-intake', {
    data: {
      full_name: 'Inquilino QA Automatizado',
      email: tenantEmail,
      phone: '1155550002',
      role: 'tenant',
      intent: 'tenant_search',
      source,
      ...location,
      desired_property_type: 'Departamento',
      desired_rooms: '2 ambientes',
      budget_max: 900000,
      budget_range: '700001-900000',
      move_timing: 'En 1 a 3 meses',
      income_proof_type: 'salary_receipt',
      income_range: '2000001-3000000',
      income_max: 3000000,
      guarantee_types: ['surety_insurance'],
    },
  })
  const tenant = await tenantResponse.json()
  expect(tenantResponse.status(), JSON.stringify(tenant)).toBe(200)
  expect(tenant.ok).toBe(true)
  expect(tenant.lead_id).toMatch(/^[0-9a-f-]{36}$/i)
  expect(tenant.meta?.skipped).toBe(true)
  expect(tenant.push_events?.intake).toBeNull()
  expect(tenant.push_events?.matches).toEqual([])

  const check = await request.get(
    `/api/qa/tradicionales/result?owner=${owner.lead_id}&tenant=${tenant.lead_id}`,
  )
  const persisted = await check.json()
  expect(check.status(), JSON.stringify(persisted)).toBe(200)
  expect(persisted.qaLeadsPersisted).toBe(true)
  expect(persisted.notificationEvents).toBe(0)
  expect(persisted.matches.length, JSON.stringify({ persisted, ownerMatch: owner.match_result, tenantMatch: tenant.match_result })).toBeGreaterThan(0)
  expect(persisted.matches[0].score).toBeGreaterThanOrEqual(80)

  await page.goto(`/success?role=tenant&lead=${tenant.lead_id}`)
  await expect(page.locator('body')).toContainText(/verlo|notificaciones|búsqueda/i)
})
