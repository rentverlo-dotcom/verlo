import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const location = {
  zone: 'Olivos',
  neighborhood_labels: ['Olivos'],
  neighborhood_slugs: ['ar:06:060756:06075610'],
  neighborhood_slug: 'ar:06:060756:06075610',
  metadata: { georef: [{
    provinceId: '06', provinceName: 'Buenos Aires',
    municipalityId: '060756', municipalityName: 'Vicente López',
    localityId: '06075610', localityName: 'Olivos',
    key: 'ar:06:060756:06075610', label: 'Olivos, Vicente López, Buenos Aires',
    latitude: -34.51, longitude: -58.49,
  }] },
}

test('QA: owner media is persisted and repeat submissions are idempotent; no R2 writes', async ({ request }) => {
  const suffix = randomUUID().slice(0, 8)
  const ownerResult = await request.post('/api/lead-intake', { data: {
    full_name: 'Owner QA Media', email: `qa-owner-media-${suffix}@example.com`,
    phone: '1155550001', role: 'owner', intent: 'owner_new_listing',
    source: 'qa_e2e_owner_media', ...location,
    property_type: 'Departamento', property_rooms: '2 ambientes',
    approx_price: '800000', approx_price_number: 800000,
    availability_status: 'En 1 a 3 meses',
    accepted_income_proof_types: ['salary_receipt'],
    min_income_ratio: 2, accepted_guarantee_types: ['surety_insurance'],
  } })
  const owner = await ownerResult.json()
  expect(ownerResult.status(), JSON.stringify(owner)).toBe(200)
  expect(owner.lead_id).toMatch(/^[a-f0-9-]{36}$/i)

  const first = await request.post('/api/qa/tradicionales/media', { data: { owner_lead_id: owner.lead_id } })
  const one = await first.json()
  expect(first.status(), JSON.stringify(one)).toBe(200)
  expect(one).toMatchObject({
    ok: true, qaOnly: true, noExternalR2: true,
    inserted: true, rows: 1, ownerVerified: true, photoType: 'photo',
  })

  const second = await request.post('/api/qa/tradicionales/media', { data: { owner_lead_id: owner.lead_id } })
  const two = await second.json()
  expect(second.status(), JSON.stringify(two)).toBe(200)
  expect(two).toMatchObject({
    ok: true, qaOnly: true, noExternalR2: true,
    inserted: false, rows: 1, ownerVerified: true, photoType: 'photo',
  })

  const invalid = await request.post('/api/qa/tradicionales/media', { data: { owner_lead_id: 'not-a-uuid' } })
  expect(invalid.status()).toBe(400)
})

test('QA: owner media fixture rejects missing or unrelated IDs', async ({ request }) => {
  const response = await request.post('/api/qa/tradicionales/media', { data: {
    owner_lead_id: '00000000-0000-4000-8000-000000000001',
  } })
  expect(response.status()).toBe(403)
  expect(await response.json()).toMatchObject({ ok: false, error: 'NOT_SYNTHETIC_OWNER' })
})
