'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

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
}

const PROPERTY_TYPES = [
  'Casa',
  'Departamento',
  'PH',
  'Habitación',
  'Local',
]

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

    // Si el usuario NO tiene contraseña
    if (!data.user.user_metadata?.has_password) {
      window.location.href = '/set-password'
    }
  })
}, [])


// PROVINCIAS → MUNICIPIOS
useEffect(() => {
  if (!draft.province_id) {
    setMunicipalities([])
    setNeighborhoods([])
    return
  }

  // 🔥 RESET CLAVE
  setDraft(d => ({
    ...d,
    municipality_id: undefined,
    neighborhood_id: undefined,
  }))

  // CABA
  if (draft.province_id === '02') {
    setMunicipalities([CABA_MUNICIPALITY])
    setNeighborhoods(CABA_BARRIOS)
    setDraft(d => ({
      ...d,
      municipality_id: CABA_MUNICIPALITY.id,
    }))
    return
  }

  // RESTO DEL PAÍS
  const provinceName = ARG_PROVINCES.find(
    p => p.id === draft.province_id
  )?.name

  if (!provinceName) return

  fetch(`/api/georef/municipios?provincia=${encodeURIComponent(provinceName)}`)
    .then(r => r.json())
    .then(data => {
      setMunicipalities(data)
      setNeighborhoods([])
    })
}, [draft.province_id])


// MUNICIPIOS → BARRIOS / LOCALIDADES
useEffect(() => {
  if (!draft.municipality_id) return

  // CABA ya cargado
  if (draft.municipality_id === 'caba') return

fetch(
  `/api/georef/localidades?municipio=${encodeURIComponent(
    draft.municipality_id
  )}`
)
  .then(r => r.json())
  .then(d => {
    setNeighborhoods(
      (d.localidades || []).map((n: any) => ({
        id: n.id,
        name: n.nombre,
      }))
    )
    setDraft(d => ({ ...d, neighborhood_id: undefined }))
  })
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
    const { data } = await supabase.auth.getUser()
    if (!data.user) return

    const { data: property } = await supabase
      .from('properties')
      .insert({
        owner_id: data.user.id,
        neighborhood_id: draft.neighborhood_id,
        price: draft.price,
        property_type: draft.type,
        allowed_durations: draft.duration,
        furnished: draft.furnished,
        pets_allowed: draft.pets,
        requirements: draft.requirements,
        publish_status: 'published',
      })
      .select()
      .single()

    if (draft.media) {
      for (const file of draft.media) {
        const path = `${property.id}/${crypto.randomUUID()}`
        await supabase.storage.from('property-media').upload(path, file)
      }
    }

    await supabase.from('property_private').insert({
      property_id: property.id,
      address: draft.address,
      phone: draft.phone,
    })

    localStorage.removeItem('property_draft')
    window.location.href = `/propiedades/${property.id}`
  }

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
    {/* PROVINCIA */}
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
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>

    {/* MUNICIPIO */}
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
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>

    {/* BARRIO */}
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
        <option key={n.id} value={n.id}>
          {n.name}
        </option>
      ))}
    </select>

    {/* PRECIO */}
    <input
      className="input"
      type="number"
      placeholder="Precio mensual"
      value={draft.price || ''}
      onChange={e =>
        setDraft(d => ({
          ...d,
          price: Number(e.target.value),
        }))
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
            <select
              className="input"
              value={draft.type || ''}
              onChange={e =>
                setDraft({ ...draft, type: e.target.value })
              }
            >
              <option value="">Tipo de propiedad</option>
              {PROPERTY_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <div className="space-y-2">
              {REQUIREMENTS.map(r => (
                <label key={r} className="flex items-center gap-2 text-sm text-neutral-300">
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

            <button className="button-primary" onClick={() => setStep(3)}>
              Continuar
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8 space-y-4">
            <div className="p-4 border border-dashed border-neutral-700 rounded-xl text-neutral-400 text-sm text-center">
              Subí fotos o videos de la propiedad
            </div>
            <input
              type="file"
              multiple
              onChange={e =>
                setDraft({ ...draft, media: Array.from(e.target.files || []) })
              }
            />
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
            <button className="button-primary" onClick={publish}>
              Publicar propiedad
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
