import fs from 'fs'
import path from 'path'

const PROVINCES = [
  { id: '06', name: 'Buenos Aires' },
  { id: '10', name: 'Catamarca' },
  { id: '14', name: 'Córdoba' },
  { id: '18', name: 'Corrientes' },
  { id: '22', name: 'Chaco' },
  { id: '26', name: 'Chubut' },
  { id: '30', name: 'Entre Ríos' },
  { id: '34', name: 'Formosa' },
  { id: '38', name: 'Jujuy' },
  { id: '42', name: 'La Pampa' },
  { id: '46', name: 'La Rioja' },
  { id: '50', name: 'Mendoza' },
  { id: '54', name: 'Misiones' },
  { id: '58', name: 'Neuquén' },
  { id: '62', name: 'Río Negro' },
  { id: '66', name: 'Salta' },
  { id: '70', name: 'San Juan' },
  { id: '74', name: 'San Luis' },
  { id: '78', name: 'Santa Cruz' },
  { id: '82', name: 'Santa Fe' },
  { id: '86', name: 'Santiago del Estero' },
  { id: '90', name: 'Tucumán' },
  { id: '94', name: 'Tierra del Fuego, Antártida e Islas del Atlántico Sur' },
]

async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} for ${url}`)
  return res.json()
}

async function main() {
  // CABA (province 02) is hardcoded in the app, skip it

  // 1. Download municipios grouped by province_id
  const municipiosByProvince = {}
  console.log('=== Downloading municipios ===')

  for (const prov of PROVINCES) {
    const url = `https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(prov.name)}&max=500`
    try {
      const data = await fetchJSON(url)
      const municipios = (data.municipios || [])
        .map(m => ({ id: String(m.id), nombre: m.nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
      municipiosByProvince[prov.id] = municipios
      console.log(`  ${prov.name}: ${municipios.length} municipios`)
    } catch (err) {
      console.error(`  ERROR ${prov.name}: ${err.message}`)
      municipiosByProvince[prov.id] = []
    }
    await new Promise(r => setTimeout(r, 300))
  }

  // 2. Download localidades grouped by municipio_id
  const localidadesByMunicipio = {}
  console.log('\n=== Downloading localidades ===')

  for (const provId of Object.keys(municipiosByProvince)) {
    const municipios = municipiosByProvince[provId]
    for (const mun of municipios) {
      const url = `https://apis.datos.gob.ar/georef/api/localidades?municipio=${encodeURIComponent(mun.id)}&max=500`
      try {
        const data = await fetchJSON(url)
        const localidades = (data.localidades || [])
          .map(l => ({ id: String(l.id), nombre: l.nombre }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
        if (localidades.length > 0) {
          localidadesByMunicipio[mun.id] = localidades
        }
      } catch (err) {
        console.error(`  ERROR municipio ${mun.nombre} (${mun.id}): ${err.message}`)
      }
      await new Promise(r => setTimeout(r, 100))
    }
    const provName = PROVINCES.find(p => p.id === provId)?.name
    console.log(`  ${provName}: done`)
  }

  // 3. Write files to public/data/
  const dataDir = path.join(process.cwd(), 'public', 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  fs.writeFileSync(
    path.join(dataDir, 'municipios.json'),
    JSON.stringify(municipiosByProvince)
  )
  fs.writeFileSync(
    path.join(dataDir, 'localidades.json'),
    JSON.stringify(localidadesByMunicipio)
  )

  const totalMun = Object.values(municipiosByProvince).reduce((s, a) => s + a.length, 0)
  const totalLoc = Object.values(localidadesByMunicipio).reduce((s, a) => s + a.length, 0)
  console.log(`\nDone! ${totalMun} municipios, ${totalLoc} localidades`)
  console.log('Files: public/data/municipios.json, public/data/localidades.json')
}

main().catch(console.error)
