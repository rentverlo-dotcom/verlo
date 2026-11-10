import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { QA_PALERMO_LOCATION, assertQaLocation } from '../../lib/qa/lead-fixtures'

// Contract grounded in the real Georef keys stored in production, not manually
// derived from neighborhood names. This deliberately uses distinct Geo keys.
const locations = {
  flores: {
    zone: 'Flores, CABA',
    neighborhood_labels: ['Flores, CABA'],
    neighborhood_slugs: ['ar:02:caba:flores'],
    neighborhood_slug: 'ar:02:caba:flores',
    metadata: { georef: [{
      provinceId: '02', provinceName: 'Ciudad Autónoma de Buenos Aires',
      municipalityId: 'caba', municipalityName: 'Ciudad Autónoma de Buenos Aires',
      localityId: 'Flores', localityName: 'Flores',
      key: 'ar:02:caba:flores', label: 'Flores, CABA',
      // The real historic CABA coordinate sentinel must NEVER imply 0 km.
      latitude: 0, longitude: 0,
    }] },
  },
  caballito: {
    zone: 'Caballito, CABA',
    neighborhood_labels: ['Caballito, CABA'],
    neighborhood_slugs: ['ar:02:caba:caballito'],
    neighborhood_slug: 'ar:02:caba:caballito',
    metadata: { georef: [{
      provinceId: '02', provinceName: 'Ciudad Autónoma de Buenos Aires',
      municipalityId: 'caba', municipalityName: 'Ciudad Autónoma de Buenos Aires',
      localityId: 'Caballito', localityName: 'Caballito',
      key: 'ar:02:caba:caballito', label: 'Caballito, CABA',
      latitude: 0, longitude: 0,
    }] },
  },
  olivos: {
    zone: 'Olivos, Vicente López, Buenos Aires',
    neighborhood_labels: ['Olivos, Vicente López, Buenos Aires'],
    neighborhood_slugs: ['ar:06:060756:06075610'],
    neighborhood_slug: 'ar:06:060756:06075610',
    metadata: { georef: [{
      provinceId: '06', provinceName: 'Buenos Aires',
      municipalityId: '060756', municipalityName: 'Vicente López',
      localityId: '06075610', localityName: 'Olivos',
      key: 'ar:06:060756:06075610',
      label: 'Olivos, Vicente López, Buenos Aires',
      latitude: -34.51, longitude: -58.49,
    }] },
  },
  lucila: {
    zone: 'La Lucila, Vicente López, Buenos Aires',
    neighborhood_labels: ['La Lucila, Vicente López, Buenos Aires'],
    neighborhood_slugs: ['ar:06:060861:0686101004'],
    neighborhood_slug: 'ar:06:060861:0686101004',
    metadata: { georef: [{
      provinceId: '06', provinceName: 'Buenos Aires',
      municipalityId: '060861', municipalityName: 'Vicente López',
      localityId: '0686101004', localityName: 'La Lucila',
      key: 'ar:06:060861:0686101004',
      label: 'La Lucila, Vicente López, Buenos Aires',
      latitude: -34.49870, longitude: -58.48860,
    }] },
  },
}

type Location = {
  zone: string
  neighborhood_labels: readonly string[]
  neighborhood_slugs: readonly string[]
  neighborhood_slug: string
  metadata: { georef: Array<{
    provinceId: string; provinceName: string
    municipalityId: string; municipalityName: string
    localityId: string; localityName: string
    key: string; label: string
    latitude?: number; longitude?: number
  }> }
}
const palermoZero = {
  ...QA_PALERMO_LOCATION,
  metadata: { georef: [{ ...QA_PALERMO_LOCATION.metadata.georef[0], latitude: 0, longitude: 0 }] },
}
test.describe('Real QA geography: cross-neighborhood matching', () => {
  test.setTimeout(120_000)

  async function checkPair(request: any, ownerLocation: Location, tenantLocation: Location, expected: 'nearby' | 'none') {
    assertQaLocation(QA_PALERMO_LOCATION)
    const run = randomUUID().slice(0, 10)
    const ownerResponse = await request.post('/api/lead-intake', { data: {
      full_name: 'QA Geografia Propietario', email: `qa-geo-owner-${run}@example.com`,
      phone: '1155550011', role: 'owner', intent: 'owner_new_listing',
      source: 'qa_e2e_geography_neighbors', ...ownerLocation,
      property_type: 'Departamento', property_rooms: '2 ambientes',
      approx_price: '700001-900000', approx_price_number: 800000,
      availability_status: 'En 1 a 3 meses',
      accepted_income_proof_types: ['salary_receipt'], min_income_ratio: 2,
      accepted_guarantee_types: ['surety_insurance'],
    }})
    const owner = await ownerResponse.json()
    expect(ownerResponse.status(), JSON.stringify(owner)).toBe(200)
    expect(owner.lead_id).toMatch(/^[0-9a-f-]{36}$/i)

    const tenantResponse = await request.post('/api/lead-intake', { data: {
      full_name: 'QA Geografia Inquilino', email: `qa-geo-tenant-${run}@example.com`,
      phone: '1155550012', role: 'tenant', intent: 'tenant_search',
      source: 'qa_e2e_geography_neighbors', ...tenantLocation,
      desired_property_type: 'Departamento', desired_rooms: '2 ambientes',
      budget_range: '700001-900000', budget_max: 900000,
      move_timing: 'En 1 a 3 meses',
      income_proof_type: 'salary_receipt', income_range: '2000001-3000000',
      income_max: 3000000, guarantee_types: ['surety_insurance'],
    }})
    const tenant = await tenantResponse.json()
    expect(tenantResponse.status(), JSON.stringify(tenant)).toBe(200)
    expect(tenant.lead_id).toMatch(/^[0-9a-f-]{36}$/i)

    const response = await request.get(`/api/qa/tradicionales/result?owner=${owner.lead_id}&tenant=${tenant.lead_id}`)
    const data = await response.json()
    expect(response.status(), JSON.stringify(data)).toBe(200)
    expect(data.qaLeadsPersisted).toBe(true)
    expect(data.notificationEvents).toBe(0)
    if (expected === 'nearby') {
      expect(data.matches, JSON.stringify(data)).toHaveLength(1)
      expect(data.matches[0].score).toBeGreaterThanOrEqual(80)
      expect(data.matches[0].neighborhoodMatchType).toBe('nearby')
      return data.matches[0]
    }
    expect(data.matches, JSON.stringify(data)).toEqual([])
  }

  test('Flores ↔ Caballito: canonical Georef keys match through real adjacency, NOT (0,0)', async ({ request }) => {
    const match = await checkPair(request, locations.caballito, locations.flores, 'nearby')
    expect(match.neighborhoodDistanceKm).toBeNull()
  })

  test('Olivos ↔ La Lucila: different Georef keys match through true distance', async ({ request }) => {
    const match = await checkPair(request, locations.olivos, locations.lucila, 'nearby')
    expect(match.neighborhoodDistanceKm).toBeGreaterThan(0)
    expect(match.neighborhoodDistanceKm).toBeLessThan(8)
  })

  test('Flores ↔ Palermo: zero coordinates cannot create false match', async ({ request }) => {
    await checkPair(request, locations.flores, palermoZero, 'none')
  })
})
