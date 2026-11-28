/**
 * Canonical QA-only lead geography. Values reflect the same selectors and
 * hidden georef payload used by the real permanent-rental browser form.
 *
 * Keep the canonical key, label and all administrative IDs together: the
 * atomic intake RPC rejects incomplete or inconsistent georef rows.
 */
export const QA_PALERMO_LOCATION = Object.freeze({
  zone: 'Palermo, CABA',
  neighborhood_labels: ['Palermo, CABA'],
  neighborhood_slugs: ['ar:02:caba:palermo'],
  neighborhood_slug: 'ar:02:caba:palermo',
  metadata: {
    georef: [{
      provinceId: '02',
      provinceName: 'Ciudad Autónoma de Buenos Aires',
      municipalityId: 'caba',
      municipalityName: 'Ciudad Autónoma de Buenos Aires',
      localityId: 'Palermo',
      localityName: 'Palermo',
      key: 'ar:02:caba:palermo',
      label: 'Palermo, CABA',
    }],
  },
})

export function assertQaLocation(location: typeof QA_PALERMO_LOCATION): void {
  const geo = location.metadata.georef[0]
  if (!geo ||
      !geo.provinceId || !geo.provinceName ||
      !geo.municipalityId || !geo.municipalityName ||
      !geo.localityId || !geo.localityName ||
      geo.key !== location.neighborhood_slug ||
      location.neighborhood_slugs.length !== 1 ||
      location.neighborhood_slugs[0] !== geo.key ||
      location.neighborhood_labels.length !== 1 ||
      location.neighborhood_labels[0] !== geo.label ||
      location.zone !== geo.label) {
    throw new Error('QA_LOCATION_CONTRACT_INVALID')
  }
}
