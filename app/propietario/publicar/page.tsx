'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from "framer-motion"

function mapFileToMediaType(file: File): 'photo' | 'video' | 'pdf' {
  if (file.type.startsWith('image/')) return 'photo'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type === 'application/pdf') return 'pdf'
  throw new Error('Tipo de archivo no soportado')
}

type Draft = {
  province_id?: string
  municipality_id?: string
  neighborhood_id?: string
  price?: number
  type?: string
  requirements?: string[]
  duration?: string[]
  furnished?: boolean
  pets?: boolean
  media?: File[]
  address?: string
  phone?: string
  first_name?: string
  last_name?: string
  email?: string
  description?: string
  sqm?: number

}

const PROPERTY_TYPES = [
  'Casa',
  'Departamento',
  'PH',
  'Habitación',
  'Local',
]
// Mapea los labels del select (ES) al enum real de la DB (EN)
const PROPERTY_TYPE_MAP: Record<string, 'apartment' | 'house' | 'room' | 'hotel_room'> = {
  'Departamento': 'apartment',
  'Casa': 'house',
  'Habitación': 'room',
  'PH': 'house',
  'Local': 'house',
}

const REQUIREMENTS = [
  'Garantía propietaria',
  'Seguro de caución',
  'Recibo de sueldo',
  'Monotributo',
  'Sin mascotas',
]

const ARG_PROVINCES = [
  { id: '02', name: 'Ciudad Autónoma de Buenos Aires' },
  { id: '06', name: 'Buenos Aires' },
  { id: '10', name: 'Catamarca' },
  { id: '22', name: 'Chaco' },
  { id: '26', name: 'Chubut' },
  { id: '14', name: 'Córdoba' },
  { id: '18', name: 'Corrientes' },
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
  { id: '94', name: 'Tierra del Fuego' },
]

const CABA_MUNICIPALITY = {
  id: 'caba',
  name: 'Ciudad Autónoma de Buenos Aires',
}

const CABA_BARRIOS = [
  'Agronomía','Almagro','Balvanera','Barracas','Belgrano','Boedo',
  'Caballito','Chacarita','Coghlan','Colegiales','Constitución',
  'Flores','Floresta','La Boca','La Paternal','Liniers','Mataderos',
  'Monte Castro','Monserrat','Nueva Pompeya','Nuñez','Palermo',
  'Parque Avellaneda','Parque Chacabuco','Parque Chas',
  'Parque Patricios','Puerto Madero','Recoleta','Retiro',
  'Saavedra','San Cristóbal','San Nicolás','San Telmo',
  'Vélez Sarsfield','Versalles','Villa Crespo','Villa del Parque',
  'Villa Devoto','Villa General Mitre','Villa Lugano',
  'Villa Luro','Villa Ortúzar','Villa Pueyrredón',
  'Villa Real','Villa Riachuelo','Villa Santa Rita',
  'Villa Soldati','Villa Urquiza'
].map(b => ({ id: b, name: b }))

export default function PublicarPropiedad() {

  const [step, setStep] = useState<number>(() => {
    if (typeof window === 'undefined') return 1
    const savedStep = localStorage.getItem('property_step')
    return savedStep ? Number(savedStep) : 1
  })

  const [draft, setDraft] = useState<Draft>(() => {
    if (typeof window === 'undefined') return {}
    return JSON.parse(localStorage.getItem('property_draft') || '{}')
  })

  const [provinces, setProvinces] = useState<any[]>([])
  const [municipalities, setMunicipalities] = useState<any[]>([])
  const [neighborhoods, setNeighborhoods] = useState<any[]>([])

  useEffect(() => {
    localStorage.setItem('property_draft', JSON.stringify(draft))
  }, [draft])

  useEffect(() => {
    localStorage.setItem('property_step', String(step))
  }, [step])

  useEffect(() => {
    setProvinces(ARG_PROVINCES)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      if (!data.user.user_metadata?.has_password) {
        window.location.href = '/set-password'
      }
    })
  }, [])

  // ===============================
  // PROVINCIAS → MUNICIPIOS
  // ===============================
  useEffect(() => {
    if (!draft.province_id) {
      setMunicipalities([])
      setNeighborhoods([])
      return
    }

    if (draft.province_id === '02') {
      setMunicipalities([CABA_MUNICIPALITY])
      setNeighborhoods(CABA_BARRIOS)
      setDraft(prev => ({
        ...prev,
        municipality_id: CABA_MUNICIPALITY.id,
        neighborhood_id: undefined,
      }))
      return
    }

    const province = ARG_PROVINCES.find(
      p => String(p.id) === String(draft.province_id)
    )

    if (!province?.name) return

    fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(province.name)}&max=1000`)
      .then(r => r.json())
      .then(d => {
        setMunicipalities(
          (d.municipios || []).map((m: any) => ({
            id: m.id,
            name: m.nombre,
          }))
        )
        setNeighborhoods([])
      })
      .catch(() => {})
  }, [draft.province_id])

  // ===============================
  // MUNICIPIOS → BARRIOS
  // ===============================
  useEffect(() => {
    if (!draft.municipality_id) {
      setNeighborhoods([])
      return
    }

    if (draft.municipality_id === CABA_MUNICIPALITY.id) return

    fetch(`https://apis.datos.gob.ar/georef/api/localidades?municipio=${encodeURIComponent(draft.municipality_id)}&max=1000`)
      .then(r => r.json())
      .then(d => {
        setNeighborhoods(
          (d.localidades || []).map((n: any) => ({
            id: n.id,
            name: n.nombre,
          }))
        )
      })
      .catch(() => {})
  }, [draft.municipality_id])

  async function requireAuth() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      window.location.href = '/login'
      return false
    }
    return true
  }

async function publish() {
  console.log('MEDIA EN PUBLISH:', draft.media)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return

  // 1. Resolver nombres
  const municipalityName =
    municipalities.find(m => m.id === draft.municipality_id)?.name ?? null

  const neighborhoodName =
    neighborhoods.find(n => n.id === draft.neighborhood_id)?.name ?? null

  // 1.5 MAPEO DEFINITIVO DE PROPERTY TYPE (ENUM SAFE)
 const propertyTypeMap = {
  apartment: 'apartment',
  house: 'house',
  room: 'room',
  hotel_room: 'hotel_room',
  local: 'apartment',
  ph: 'apartment',
} as const

  const safePropertyType =
  propertyTypeMap[draft.type as keyof typeof propertyTypeMap]

  if (!safePropertyType) {
    console.error('Tipo de propiedad inválido:', draft.type)
    return
  }

 // 2. Insert PROPERTY
const { data: property, error: propertyError } = await supabase
  .from('properties')
  .insert({
    owner_id: auth.user.id,
    city: municipalityName,
    zone: neighborhoodName,
    price: draft.price ?? null,
    property_type: safePropertyType,
    short_description: draft.description ?? null, // agregue esta linea porque el front prop tiraba 400
    description: draft.description ?? null,
    sqm: draft.sqm ?? null,
    furnished: draft.furnished ?? false,
    pets_allowed: draft.pets ?? false,
    publish_status: 'draft',
    currency: 'ARS',
    available: true,
  })
  .select()
  .single()

if (propertyError || !property) {
  console.error(propertyError)
  return
}

console.log('PROPERTY INSERTADA:', property)
console.log('PROPERTY ID INSERTADO:', property.id)

  // 3. MEDIA (UPLOAD + DB)
  if (draft.media?.length) {
    for (let i = 0; i < draft.media.length; i++) {
      const file = draft.media[i]
      const extension = file.name.split('.').pop()
      const path = `${property.id}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error(uploadError)
        continue
      }

      const { error: mediaError } = await supabase
        .from('property_media')
        .insert({
          property_id: property.id,
          type: mapFileToMediaType(file),
          url: path,
          position: i,
        })

      if (mediaError) console.error(mediaError)
    }
  }

  // 4. PRIVATE DATA
  const { error: privateError } = await supabase
    .from('property_private')
    .insert({
      property_id: property.id,
      address: draft.address ?? null,
      phone: draft.phone ?? null,
      first_name: draft.first_name ?? null,
      last_name: draft.last_name ?? null,
      email: draft.email ?? null,
    })

  if (privateError) {
    console.error(privateError)
    return
  }

  // 5. CLEANUP
  localStorage.removeItem('property_draft')
  localStorage.removeItem('property_step')


  // 6. REDIRECT FINAL (CLAVE)
  console.log('REDIRECT A:', `/propietario/preview/${property.id}`)
  window.location.href = `/propietario/preview/${property.id}`
}
  
function next() {
  setStep(s => Math.min(s + 1, 4))
}

function back() {
  setStep(s => Math.max(s - 1, 1))
}
  
 return (
  <section className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 py-16 px-6">
    <div className="max-w-2xl mx-auto">

      <h1 className="text-5xl font-bold text-slate-900 mb-2">
        Publicá tu propiedad
      </h1>

      <p className="text-slate-500 mb-10">
        Paso {step} de 4
      </p>

      <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6 transition-all duration-300">

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={draft.province_id || ''}
              onChange={e =>
                setDraft(d => ({
                  ...d,
                  province_id: e.target.value,
                  municipality_id: undefined,
                  neighborhood_id: undefined,
                }))
              }
            >
              <option value="">Provincia</option>
              {provinces.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={draft.municipality_id || ''}
              disabled={!draft.province_id}
              onChange={e =>
                setDraft(d => ({
                  ...d,
                  municipality_id: e.target.value,
                  neighborhood_id: undefined,
                }))
              }
            >
              <option value="">Municipio</option>
              {municipalities.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={draft.neighborhood_id || ''}
              disabled={!draft.municipality_id}
              onChange={e =>
                setDraft(d => ({
                  ...d,
                  neighborhood_id: e.target.value,
                }))
              }
            >
              <option value="">Barrio</option>
              {neighborhoods.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>

            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              type="number"
              placeholder="Precio mensual"
              value={draft.price || ''}
              onChange={e =>
                setDraft(d => ({ ...d, price: Number(e.target.value) }))
              }
            />

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-4 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 transition"
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={draft.type || ''}
              onChange={e =>
                setDraft(d => ({ ...d, type: e.target.value }))
              }
            >
              <option value="">Tipo de propiedad</option>
              <option value="apartment">Departamento</option>
              <option value="house">Casa</option>
              <option value="ph">PH</option>
              <option value="room">Habitación</option>
              <option value="local">Local</option>
            </select>

            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              type="number"
              placeholder="Metros cuadrados"
              value={draft.sqm || ''}
              onChange={e =>
                setDraft(d => ({ ...d, sqm: Number(e.target.value) }))
              }
            />

            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Descripción de la propiedad"
              value={draft.description || ''}
              onChange={e =>
                setDraft(d => ({ ...d, description: e.target.value }))
              }
            />

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
              >
                Volver
              </button>

              <button
                onClick={() => setStep(3)}
                className="px-8 py-4 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 transition"
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={e => {
                const files = Array.from(e.target.files || [])
                setDraft(d => ({
                  ...d,
                  media: [...(d.media || []), ...files],
                }))
              }}
              className="w-full"
            />

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
              >
                Volver
              </button>

              <button
                onClick={() => setStep(4)}
                className="px-8 py-4 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 transition"
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Dirección (privada)"
              value={draft.address || ''}
              onChange={e =>
                setDraft(d => ({ ...d, address: e.target.value }))
              }
            />

            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Teléfono"
              value={draft.phone || ''}
              onChange={e =>
                setDraft(d => ({ ...d, phone: e.target.value }))
              }
            />

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
              >
                Volver
              </button>

              <button
                onClick={publish}
                className="px-8 py-4 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 transition"
              >
                Publicar propiedad
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  </section>
)
}
