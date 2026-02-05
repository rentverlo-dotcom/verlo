'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Draft = {
  province_id?: string
  municipality_id?: string
  neighborhood_id?: string

  city?: string | null
  zone?: string | null

  min_price?: number
  max_price?: number

  preferred_property_types?: string[] // property_type[]
  preferred_durations?: string[] // contract_duration[]

  furnished_preference?: boolean | null
  pets_preference?: boolean | null
  notes?: string
}

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

const CABA_MUNICIPALITY = { id: 'caba', name: 'Ciudad Autónoma de Buenos Aires' }
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

export default function Buscar() {
  const [step, setStep] = useState<number>(() => {
    if (typeof window === 'undefined') return 1
    const saved = localStorage.getItem('demand_step')
    return saved ? Number(saved) : 1
  })

  const [draft, setDraft] = useState<Draft>(() => {
    if (typeof window === 'undefined') return {}
    return JSON.parse(localStorage.getItem('demand_draft') || '{}')
  })

  const [provinces] = useState<any[]>(ARG_PROVINCES)
  const [municipalities, setMunicipalities] = useState<any[]>([])
  const [neighborhoods, setNeighborhoods] = useState<any[]>([])
  const PROPERTY_TYPES = ['apartment', 'house', 'ph', 'room', 'local']
  const DURATIONS = ['6_months', '12_months', '24_months']
  
  const [propertyTypes] = useState<string[]>(PROPERTY_TYPES)
  const [durations] = useState<string[]>(DURATIONS)


  useEffect(() => localStorage.setItem('demand_draft', JSON.stringify(draft)), [draft])
  useEffect(() => localStorage.setItem('demand_step', String(step)), [step])

  // Login obligatorio antes de arrancar
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
    })
  }, [])

  // Cargar enums reales desde tu DB (sin inventar)
  useEffect(() => {
    fetch('/api/enums/property_type')
      .then(r => r.json())
      .then(d => setPropertyTypes(d.values || []))
      .catch(() => setPropertyTypes([]))

    fetch('/api/enums/contract_duration')
      .then(r => r.json())
      .then(d => setDurations(d.values || []))
      .catch(() => setDurations([]))
  }, [])

  // Provincias → Municipios (igual que propietario)
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

    const province = ARG_PROVINCES.find(p => String(p.id) === String(draft.province_id))
    if (!province?.name) return

    fetch(`/api/georef/municipios?provincia=${encodeURIComponent(province.name)}`)
      .then(r => r.json())
      .then(d => {
        setMunicipalities((d.municipios || []).map((m: any) => ({ id: m.id, name: m.nombre })))
        setNeighborhoods([])
        setDraft(prev => ({ ...prev, municipality_id: undefined, neighborhood_id: undefined }))
      })
  }, [draft.province_id])

  // Municipios → Barrios (igual que propietario)
  useEffect(() => {
    if (!draft.municipality_id) {
      setNeighborhoods([])
      return
    }
    if (draft.municipality_id === CABA_MUNICIPALITY.id) return

    fetch(`/api/georef/localidades?municipio=${encodeURIComponent(draft.municipality_id)}`)
      .then(r => r.json())
      .then(d => {
        setNeighborhoods((d.localidades || []).map((n: any) => ({ id: n.id, name: n.nombre })))
        setDraft(prev => ({ ...prev, neighborhood_id: undefined }))
      })
  }, [draft.municipality_id])

  const municipalityName = useMemo(
    () => municipalities.find(m => m.id === draft.municipality_id)?.name ?? null,
    [municipalities, draft.municipality_id]
  )

  const neighborhoodName = useMemo(
    () => neighborhoods.find(n => n.id === draft.neighborhood_id)?.name ?? null,
    [neighborhoods, draft.neighborhood_id]
  )

  const canGoStep2 = Boolean(municipalityName && draft.min_price != null && draft.max_price != null)
  const canGoStep3 = (draft.preferred_property_types?.length ?? 0) > 0

  async function submitDemand() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      window.location.href = '/login'
      return
    }

    // city obligatoria por decisión MVP
    const city = municipalityName
    if (!city) return

    const { error } = await supabase.from('demands').insert({
      tenant_id: auth.user.id,
      city,
      zone: neighborhoodName ?? null,
      min_price: draft.min_price,
      max_price: draft.max_price,
      preferred_property_types: draft.preferred_property_types ?? [],
      preferred_durations: (draft.preferred_durations?.length ? draft.preferred_durations : null),
      furnished_preference: draft.furnished_preference ?? null,
      pets_preference: draft.pets_preference ?? null,
      notes: draft.notes ?? null,
    })

    if (error) {
      console.error(error)
      return
    }

    localStorage.removeItem('demand_draft')
    localStorage.removeItem('demand_step')

    // Te mando a la sección donde ya tenés el “Tinder” (ajustalo si tu ruta real es otra)
    window.location.href = '/propiedades'
  }

  return (
    <div className="min-h-screen bg-black flex justify-center pt-24 px-4">
      <div className="w-full max-w-xl bg-neutral-900 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-white">Buscar propiedades</h1>
        <p className="text-sm text-neutral-400 mt-1">Paso {step} de 3</p>

        {/* STEP 1 */}
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
              onChange={e => setDraft(d => ({ ...d, municipality_id: e.target.value, neighborhood_id: undefined }))}
            >
              <option value="">Ciudad / Municipio</option>
              {municipalities.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              className="input"
              value={draft.neighborhood_id || ''}
              disabled={!draft.municipality_id}
              onChange={e => setDraft(d => ({ ...d, neighborhood_id: e.target.value }))}
            >
              <option value="">Zona (opcional)</option>
              {neighborhoods.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="input"
                type="number"
                placeholder="Presupuesto mínimo"
                value={draft.min_price ?? ''}
                onChange={e => setDraft(d => ({ ...d, min_price: Number(e.target.value) }))}
              />
              <input
                className="input"
                type="number"
                placeholder="Presupuesto máximo"
                value={draft.max_price ?? ''}
                onChange={e => setDraft(d => ({ ...d, max_price: Number(e.target.value) }))}
              />
            </div>

            <button className="button-primary" disabled={!canGoStep2} onClick={() => setStep(2)}>
              Continuar
            </button>
          </div>
        )}

    {/* STEP 2 */}
{step === 2 && (
  <div className="mt-8 space-y-6">

    {/* PROPERTY TYPES */}
    <div className="space-y-3">
      <p className="text-sm font-medium text-neutral-300">
        Tipo de propiedad (obligatorio)
      </p>

      {propertyTypes.length === 0 && (
        <p className="text-sm text-red-400">
          Error cargando tipos de propiedad
        </p>
      )}

      {propertyTypes.map(t => (
        <label
          key={t}
          className="flex items-center gap-3 text-sm text-neutral-200 cursor-pointer"
        >
          <input
            type="checkbox"
            className="accent-white"
            checked={draft.preferred_property_types?.includes(t) || false}
            onChange={e => {
              const current = draft.preferred_property_types || []
              setDraft(d => ({
                ...d,
                preferred_property_types: e.target.checked
                  ? [...current, t]
                  : current.filter(x => x !== t),
              }))
            }}
          />
          <span>
            {{
              apartment: 'Departamento',
              house: 'Casa',
              room: 'Habitación',
              hotel_room: 'Hotel',
            }[t] ?? t}
          </span>
        </label>
      ))}
    </div>

    {/* DURATIONS */}
    <div className="space-y-3">
      <p className="text-sm font-medium text-neutral-300">
        Duración preferida (opcional)
      </p>

      {durations.length === 0 && (
        <p className="text-sm text-neutral-500">
          No especificada
        </p>
      )}

      {durations.map(dur => (
        <label
          key={dur}
          className="flex items-center gap-3 text-sm text-neutral-200 cursor-pointer"
        >
          <input
            type="checkbox"
            className="accent-white"
            checked={draft.preferred_durations?.includes(dur) || false}
            onChange={e => {
              const current = draft.preferred_durations || []
              setDraft(d => ({
                ...d,
                preferred_durations: e.target.checked
                  ? [...current, dur]
                  : current.filter(x => x !== dur),
              }))
            }}
          />
          <span>
            {{
              short: 'Corto plazo',
              medium: 'Mediano plazo',
              long: 'Largo plazo',
            }[dur] ?? dur}
          </span>
        </label>
      ))}
    </div>

    {/* ACTIONS */}
    <div className="flex gap-3 pt-4">
      <button
        type="button"
        className="button-secondary"
        onClick={() => setStep(1)}
      >
        Volver
      </button>

      <button
        type="button"
        className="button-primary"
        disabled={!draft.preferred_property_types?.length}
        onClick={() => setStep(3)}
      >
        Continuar
      </button>
    </div>
  </div>
)}


        {/* STEP 3 */}
        {step === 3 && (
          <div className="mt-8 space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={draft.furnished_preference === true}
                  onChange={e => setDraft(d => ({ ...d, furnished_preference: e.target.checked ? true : null }))}
                />
                Prefiero amoblado
              </label>

              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={draft.pets_preference === true}
                  onChange={e => setDraft(d => ({ ...d, pets_preference: e.target.checked ? true : null }))}
                />
                Tengo / quiero mascotas
              </label>
            </div>

            <textarea
              className="input h-28 resize-none"
              placeholder="Notas (opcional)"
              value={draft.notes || ''}
              onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
            />

            <div className="flex gap-3">
              <button className="button-primary" type="button" onClick={() => setStep(2)}>
                Volver
              </button>
              <button className="button-primary" type="button" onClick={submitDemand}>
                Crear búsqueda
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
