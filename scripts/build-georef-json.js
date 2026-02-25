import { writeFileSync, mkdirSync } from 'node:fs'

const PROVINCES = [
  ['06', 'Buenos Aires'], ['10', 'Catamarca'], ['14', 'Córdoba'],
  ['18', 'Corrientes'], ['22', 'Chaco'], ['26', 'Chubut'],
  ['30', 'Entre Ríos'], ['34', 'Formosa'], ['38', 'Jujuy'],
  ['42', 'La Pampa'], ['46', 'La Rioja'], ['50', 'Mendoza'],
  ['54', 'Misiones'], ['58', 'Neuquén'], ['62', 'Río Negro'],
  ['66', 'Salta'], ['70', 'San Juan'], ['74', 'San Luis'],
  ['78', 'Santa Cruz'], ['82', 'Santa Fe'], ['86', 'Santiago del Estero'],
  ['90', 'Tucumán'], ['94', 'Tierra del Fuego, Antártida e Islas del Atlántico Sur'],
]

const DIR = '/vercel/share/v0-project/public/data'
mkdirSync(DIR, { recursive: true })

const municipiosByProvince = {}
const localidadesByMunicipio = {}

for (const [id, name] of PROVINCES) {
  try {
    const mRes = await fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(name)}&campos=id,nombre&max=500`)
    const mData = await mRes.json()
    municipiosByProvince[id] = (mData.municipios || [])
      .map(m => ({ id: String(m.id), nombre: m.nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
    console.log(`Mun ${name}: ${municipiosByProvince[id].length}`)
  } catch (e) {
    municipiosByProvince[id] = []
    console.log(`Mun ${name}: ERROR ${e.message}`)
  }

  try {
    const lRes = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(name)}&campos=id,nombre,municipio.id&max=5000`)
    const lData = await lRes.json()
    for (const loc of (lData.localidades || [])) {
      const munId = loc.municipio ? String(loc.municipio.id) : ''
      if (!munId) continue
      if (!localidadesByMunicipio[munId]) localidadesByMunicipio[munId] = []
      localidadesByMunicipio[munId].push({ id: String(loc.id), nombre: loc.nombre })
    }
    console.log(`Loc ${name}: ${(lData.localidades || []).length}`)
  } catch (e) {
    console.log(`Loc ${name}: ERROR ${e.message}`)
  }

  await new Promise(r => setTimeout(r, 200))
}

for (const k of Object.keys(localidadesByMunicipio)) {
  localidadesByMunicipio[k].sort((a, b) => a.nombre.localeCompare(b.nombre))
}

writeFileSync(`${DIR}/municipios.json`, JSON.stringify(municipiosByProvince))
writeFileSync(`${DIR}/localidades.json`, JSON.stringify(localidadesByMunicipio))

const tm = Object.values(municipiosByProvince).reduce((s, a) => s + a.length, 0)
const tl = Object.values(localidadesByMunicipio).reduce((s, a) => s + a.length, 0)
console.log(`Done! ${tm} municipios, ${tl} localidades saved.`)
