'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
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
        console.log('[v0] municipios response:', JSON.stringify(d).slice(0, 200))
        const mapped = (d.municipios || []).map((m: any) => ({
          id: m.id,
          name: m.nombre,
        }))
        console.log('[v0] setting municipalities, count:', mapped.length)
        setMunicipalities(mapped)
        setNeighborhoods([])
      })
      .catch(err => console.error('[v0] Error cargando municipios:', err))
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
        console.log('[v0] localidades response:', JSON.stringify(d).slice(0, 200))
        setNeighborhoods(
          (d.localidades || []).map((n: any) => ({
            id: n.id,
            name: n.nombre,
          }))
        )
      })
      .catch(err => console.error('[v0] Error cargando localidades:', err))
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
  const PROPERTY_TYPE_MAP: Record<
    string,
    'apartment' | 'house' | 'room' | 'hotel_room'
  > = {
    apartment: 'apartment',
    house: 'house',
    room: 'room',
    hotel_room: 'hotel_room',

    // valores del form que NO existen en el enum
    local: 'apartment',
    ph: 'apartment',
  }

  const safePropertyType =
    PROPERTY_TYPE_MAP[draft.type as string]

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


  console.log('[v0] RENDER - municipalities:', municipalities.length, 'province_id:', draft.province_id, 'municipality_id:', draft.municipality_id)

  return (
    <div className="min-h-screen bg-black flex justify-center pt-24 px-4">
      <div className="w-full max-w-xl bg-neutral-900 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-white">
          Publicá tu propiedad
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Paso {step} de 4
        </p>

        {step === 1 && (
          <div className="mt-8 space-y-4">
            <select
              className="input"
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
              className="input"
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
              className="input"
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
              className="input"
              type="number"
              placeholder="Precio mensual"
              value={draft.price || ''}
              onChange={e =>
                setDraft(d => ({ ...d, price: Number(e.target.value) }))
              }
            />

            <button
              className="button-primary"
              disabled={!draft.neighborhood_id || !draft.price}
              onClick={() => setStep(2)}
            >
              Continuar
            </button>
          </div>
        )}
{step === 2 && (
  <div className="mt-8 space-y-4">

    {/* Tipo */}
    <select
      className="input"
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

    {/* Metros cuadrados */}
    <input
      className="input"
      type="number"
      placeholder="Metros cuadrados"
      value={draft.sqm || ''}
      onChange={e =>
        setDraft(d => ({ ...d, sqm: Number(e.target.value) }))
      }
    />

    {/* Descripción (CLAVE) */}
    <textarea
      className="input h-32 resize-none"
      placeholder="Descripción de la propiedad (esto es lo que ve el inquilino)"
      value={draft.description || ''}
      onChange={e =>
        setDraft(d => ({ ...d, description: e.target.value }))
      }
    />

    {/* Requisitos */}
    <div className="space-y-2">
      {REQUIREMENTS.map(r => (
        <label
          key={r}
          className="flex items-center gap-2 text-sm text-neutral-300"
        >
          <input
            type="checkbox"
            checked={draft.requirements?.includes(r) || false}
            onChange={e => {
              const current = draft.requirements || []
              setDraft({
                ...draft,
                requirements: e.target.checked
                  ? [...current, r]
                  : current.filter(x => x !== r),
              })
            }}
          />
          {r}
        </label>
      ))}
    </div>

    <button
      className="button-primary"
      onClick={() => setStep(3)}
      disabled={!draft.type || !draft.description}
    >
      Continuar
    </button>
  </div>
)}


      {step === 3 && (
  <div className="mt-8 space-y-4">
    {/* Fotos y videos */}
    <input
      type="file"
      accept="image/*,video/*"
      multiple
      capture="environment"
      onChange={e => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        setDraft(d => ({
          ...d,
          media: [...(d.media || []), ...files],
        }))

        // permite volver a elegir el mismo archivo
        e.currentTarget.value = ''
      }}
    />

    {/* Preview + remove */}
    {draft.media && draft.media.length > 0 && (
      <div className="space-y-2">
        {draft.media.map((f, idx) => (
          <div
            key={`${f.name}-${idx}`}
            className="flex items-center justify-between"
          >
            <span className="text-sm opacity-80">
              {idx + 1}. {f.name}
            </span>
            <button
              type="button"
              className="text-sm underline"
              onClick={() =>
                setDraft(d => ({
                  ...d,
                  media: d.media?.filter((_, i) => i !== idx),
                }))
              }
            >
              Quitar
            </button>
          </div>
        ))}
      </div>
    )}

    <button
      className="button-primary"
      onClick={async () => (await requireAuth()) && setStep(4)}
    >
      Continuar
    </button>
  </div>
)}



        {step === 4 && (
          <div className="mt-8 space-y-4">
            <input
              className="input"
              placeholder="Dirección (privada)"
              value={draft.address || ''}
              onChange={e =>
                setDraft({ ...draft, address: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Teléfono de contacto"
              value={draft.phone || ''}
              onChange={e =>
                setDraft({ ...draft, phone: e.target.value })
              }
            />
            <input
  className="input"
  placeholder="Nombre"
  value={draft.first_name || ''}
  onChange={e =>
    setDraft(d => ({ ...d, first_name: e.target.value }))
  }
/>

<input
  className="input"
  placeholder="Apellido"
  value={draft.last_name || ''}
  onChange={e =>
    setDraft(d => ({ ...d, last_name: e.target.value }))
  }
/>

<input
  className="input"
  type="email"
  placeholder="Email de contacto"
  value={draft.email || ''}
  onChange={e =>
    setDraft(d => ({ ...d, email: e.target.value }))
  }
/>

            <button
  type="button"
  className="button-primary"
  onClick={publish}
>
  Publicar propiedad
</button> 
          </div>
        )}
      </div>
    </div>
  )
}
