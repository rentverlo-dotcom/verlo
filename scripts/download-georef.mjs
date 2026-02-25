// Downloads all municipios and localidades from Argentina's georef API
// and saves them as static JSON files

const PROVINCES = [
  { id: '02', name: 'Ciudad Autónoma de Buenos Aires' },
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
  console.log('Downloading municipios for all provinces...')
  
  const municipiosByProvince = {}
  
  for (const prov of PROVINCES) {
    if (prov.id === '02') continue // CABA is hardcoded already
    
    const url = `https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(prov.name)}&max=500`
    console.log(`  Fetching municipios for ${prov.name}...`)
    
    try {
      const data = await fetchJSON(url)
      const municipios = (data.municipios || []).map(m => ({
        id: String(m.id),
        name: m.nombre,
      })).sort((a, b) => a.name.localeCompare(b.name))
      
      municipiosByProvince[prov.id] = municipios
      console.log(`    -> ${municipios.length} municipios`)
    } catch (err) {
      console.error(`    ERROR: ${err.message}`)
      municipiosByProvince[prov.id] = []
    }
    
    // Small delay to not hammer the API
    await new Promise(r => setTimeout(r, 300))
  }
  
  console.log('\nDownloading localidades for all municipios...')
  
  const localidadesByMunicipio = {}
  
  for (const provId of Object.keys(municipiosByProvince)) {
    const municipios = municipiosByProvince[provId]
    
    for (const mun of municipios) {
      const url = `https://apis.datos.gob.ar/georef/api/localidades?municipio=${encodeURIComponent(mun.id)}&max=500`
      
      try {
        const data = await fetchJSON(url)
        const localidades = (data.localidades || []).map(l => ({
          id: String(l.id),
          name: l.nombre,
        })).sort((a, b) => a.name.localeCompare(b.name))
        
        if (localidades.length > 0) {
          localidadesByMunicipio[mun.id] = localidades
        }
      } catch (err) {
        console.error(`    ERROR for municipio ${mun.name}: ${err.message}`)
      }
      
      await new Promise(r => setTimeout(r, 100))
    }
    
    const provName = PROVINCES.find(p => p.id === provId)?.name
    console.log(`  ${provName}: done (${municipios.length} municipios processed)`)
  }
  
  // Write files
  const fs = await import('fs')
  const path = await import('path')
  
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  
  fs.writeFileSync(
    path.join(dataDir, 'municipios.json'),
    JSON.stringify(municipiosByProvince, null, 2)
  )
  
  fs.writeFileSync(
    path.join(dataDir, 'localidades.json'),
    JSON.stringify(localidadesByMunicipio, null, 2)
  )
  
  const totalMunicipios = Object.values(municipiosByProvince).reduce((sum, arr) => sum + arr.length, 0)
  const totalLocalidades = Object.keys(localidadesByMunicipio).length
  
  console.log(`\nDone! Saved ${totalMunicipios} municipios and localidades for ${totalLocalidades} municipios`)
  console.log('Files: data/municipios.json, data/localidades.json')
}

main().catch(console.error)
