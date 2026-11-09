import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { QA_PALERMO_LOCATION, assertQaLocation } from '../../lib/qa/lead-fixtures'

// End-to-end negative case: the pair must never be matched despite same locality.
// Uses real QA intake and persistent pair lookup, never sends external notifications.
test('Tradicionales: inquilino y propietario incompatibles no generan match', async ({ request }) => {
  test.setTimeout(90_000)
  const run = randomUUID().slice(0, 12)
  const loc = QA_PALERMO_LOCATION
  assertQaLocation(loc)

  const ownerResponse = await request.post('/api/lead-intake', {
    data: {
      full_name: 'Owner QA Negative Match',
      email: `qa-negative-owner-${run}@example.com`,
      phone: '1155550001',
      role: 'owner',
      intent: 'owner_new_listing',
      source: 'qa_e2e_negative_match',
      ...loc,
      property_type: 'Casa',
      property_rooms: '4 ambientes',
      approx_price: '1200001-1500000',
      approx_price_number: 1500000,
      availability_status: 'En 6 meses o más',
      accepted_income_proof_types: ['salary_receipt'],
      min_income_ratio: 3,
      accepted_guarantee_types: ['property_guarantee'],
    },
  })
  const owner = await ownerResponse.json()
  expect(ownerResponse.status(), JSON.stringify(owner)).toBe(200)
  expect(owner.lead_id).toMatch(/^[0-9a-f-]{36}$/i)

  const tenantResponse = await request.post('/api/lead-intake', {
    data: {
      full_name: 'Tenant QA Negative Match',
      email: `qa-negative-tenant-${run}@example.com`,
      phone: '1155550002',
      role: 'tenant',
      intent: 'tenant_search',
      source: 'qa_e2e_negative_match',
      ...loc,
      desired_property_type: 'Departamento',
      desired_rooms: '2 ambientes',
      budget_range: 'hasta-500000',
      budget_max: 500000,
      move_timing: 'En 1 a 3 meses',
      income_proof_type: 'monotributo',
      income_range: '500001-1000000',
      income_max: 1000000,
      guarantee_types: ['surety_insurance'],
    },
  })
  const tenant = await tenantResponse.json()
  expect(tenantResponse.status(), JSON.stringify(tenant)).toBe(200)
  expect(tenant.lead_id).toMatch(/^[0-9a-f-]{36}$/i)

  const auditResponse = await request.get(
    `/api/qa/tradicionales/result?owner=${owner.lead_id}&tenant=${tenant.lead_id}`,
  )
  const audit = await auditResponse.json()
  expect(auditResponse.status(), JSON.stringify(audit)).toBe(200)
  expect(audit.qaLeadsPersisted).toBe(true)
  expect(audit.matches).toEqual([])
  expect(audit.notificationEvents).toBe(0)
})
