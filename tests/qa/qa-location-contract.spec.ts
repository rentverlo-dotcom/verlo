import { test, expect } from '@playwright/test'
import { QA_PALERMO_LOCATION, assertQaLocation } from '../../lib/qa/lead-fixtures'

test('QA geography: canonical selector fields are complete and consistent', () => {
  expect(() => assertQaLocation(QA_PALERMO_LOCATION)).not.toThrow()
  const geo = QA_PALERMO_LOCATION.metadata.georef[0]
  expect(geo).toMatchObject({
    provinceId: '02', municipalityId: 'caba', localityId: 'Palermo',
    key: 'ar:02:caba:palermo', label: 'Palermo, CABA',
  })
})

test('QA geography: missing administrative IDs or mismatched keys fail before intake', () => {
  const withoutMunicipality = structuredClone(QA_PALERMO_LOCATION)
  withoutMunicipality.metadata.georef[0].municipalityId = ''
  expect(() => assertQaLocation(withoutMunicipality)).toThrow('QA_LOCATION_CONTRACT_INVALID')
  const wrongKey = structuredClone(QA_PALERMO_LOCATION)
  wrongKey.neighborhood_slugs[0] = 'ar:02:caba:recoleta'
  expect(() => assertQaLocation(wrongKey)).toThrow('QA_LOCATION_CONTRACT_INVALID')
})
