const fs = require('fs')
const path = require('path')

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

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function main() {
  const dataDir = path.join(process.cwd(), 'public', 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  // 1. Download municipios by province
  const municipiosByProvince = {}
  console.log('=== Downloading municipios ===')

  for (const prov of PROVINCES) {
    try {
      const url = `https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(prov.name)}&max=500`
      const res = await fetch(url)
      const data = await res.json()
      const municipios = (data.municipios || [])
        .map(m => ({ id: String(m.id), nombre: m.nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
      municipiosByProvince[prov.id] = municipios
      console.log('  ' + prov.name + ': ' + municipios.length + ' municipios')
    } catch (err) {
      console.error('  ERROR ' + prov.name + ': ' + err.message)
      municipiosByProvince[prov.id] = []
    }
    await sleep(300)
  }

  fs.writeFileSync(path.join(dataDir, 'municipios.json'), JSON.stringify(municipiosByProvince))
  const totalMun = Object.values(municipiosByProvince).reduce((s, a) => s + a.length, 0)
  console.log('Total municipios: ' + totalMun)

  // 2. Download localidades by province, group by municipio
  const localidadesByMunicipio = {}
  console.log('\n=== Downloading localidades ===')

  for (const prov of PROVINCES) {
    try {
      const url = `https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(prov.name)}&max=5000`
      const res = await fetch(url)
      const data = await res.json()
      const localidades = data.localidades || []
      for (const loc of localidades) {
        const munId = String(loc.municipio && loc.municipio.id || '')
        if (!munId) continue
        if (!localidadesByMunicipio[munId]) localidadesByMunicipio[munId] = []
        localidadesByMunicipio[munId].push({ id: String(loc.id), nombre: loc.nombre })
      }
      console.log('  ' + prov.name + ': ' + localidades.length + ' localidades')
    } catch (err) {
      console.error('  ERROR ' + prov.name + ': ' + err.message)
    }
    await sleep(300)
  }

  // Sort
  for (const munId of Object.keys(localidadesByMunicipio)) {
    localidadesByMunicipio[munId].sort((a, b) => a.nombre.localeCompare(b.nombre))
  }

  fs.writeFileSync(path.join(dataDir, 'localidades.json'), JSON.stringify(localidadesByMunicipio))
  const totalLoc = Object.values(localidadesByMunicipio).reduce((s, a) => s + a.length, 0)
  console.log('Total localidades: ' + totalLoc)

  console.log('\nDone!')
}

main().catch(console.error)
