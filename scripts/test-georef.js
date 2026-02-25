// Test the georef API directly to see what it returns
const provincias = ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán']

for (const prov of provincias) {
  const url = `https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(prov)}&max=5`
  console.log(`\n--- Testing: ${prov} ---`)
  console.log(`URL: ${url}`)
  
  try {
    const res = await fetch(url)
    console.log(`Status: ${res.status}`)
    const data = await res.json()
    console.log(`Total municipios: ${data.total}`)
    console.log(`Cantidad en respuesta: ${data.municipios?.length ?? 0}`)
    if (data.municipios?.length > 0) {
      console.log(`Primero:`, JSON.stringify(data.municipios[0]))
      console.log(`Segundo:`, JSON.stringify(data.municipios[1]))
    }
  } catch (err) {
    console.error(`ERROR: ${err.message}`)
  }
}

// Now test localidades with a municipio ID (as the code currently does)
console.log('\n\n=== Testing localidades with ID ===')
const testMunicipioId = '060280' // Florencio Varela
const urlById = `https://apis.datos.gob.ar/georef/api/localidades?municipio=${encodeURIComponent(testMunicipioId)}&max=5`
console.log(`URL: ${urlById}`)
try {
  const res = await fetch(urlById)
  console.log(`Status: ${res.status}`)
  const data = await res.json()
  console.log(`Total localidades: ${data.total}`)
  console.log(`Cantidad en respuesta: ${data.localidades?.length ?? 0}`)
  if (data.localidades?.length > 0) {
    console.log(`Primera:`, JSON.stringify(data.localidades[0]))
  }
} catch (err) {
  console.error(`ERROR: ${err.message}`)
}
