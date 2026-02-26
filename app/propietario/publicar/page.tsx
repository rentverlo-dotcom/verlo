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
  <section
    style={{
      minHeight: "100vh",
      paddingTop: "140px",
      paddingBottom: "120px",
      background: "linear-gradient(180deg,#fdf2f8 0%, #ffffff 40%)",
    }}
  >
    <div className="container" style={{ maxWidth: "760px" }}>
      <div
        style={{
          background: "#ffffff",
          borderRadius: "28px",
          padding: "56px",
          boxShadow: "0 40px 100px rgba(236,72,153,0.12)",
          border: "1px solid #fce7f3",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            fontWeight: 900,
            marginBottom: "8px",
            letterSpacing: "-1px",
            color: "#0f172a",
          }}
        >
          Publicá tu propiedad
        </h1>

        <p
          style={{
            fontSize: "16px",
            color: "#64748b",
            marginBottom: "32px",
          }}
        >
          Paso {step} de 4
        </p>

        {/* PROGRESS */}
        <div className="flex items-center gap-3 mb-10">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="flex-1 h-2 rounded-full transition-all"
              style={{
                background: step >= n ? "#ec4899" : "#f1f5f9",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 1 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >

              <select className="input-modern"
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

              <select className="input-modern"
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

              <select className="input-modern"
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
                className="input-modern"
                type="number"
                placeholder="Precio mensual"
                value={draft.price || ''}
                onChange={e =>
                  setDraft(d => ({ ...d, price: Number(e.target.value) }))
                }
              />

              <div className="flex justify-end">
                <button className="button-primary" onClick={next}>
                  Continuar
                </button>
              </div>

            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >

              <select
                className="input-modern"
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
                className="input-modern"
                type="number"
                placeholder="Metros cuadrados"
                value={draft.sqm || ''}
                onChange={e =>
                  setDraft(d => ({ ...d, sqm: Number(e.target.value) }))
                }
              />

              <textarea
                className="input-modern h-32"
                placeholder="Descripción de la propiedad"
                value={draft.description || ''}
                onChange={e =>
                  setDraft(d => ({ ...d, description: e.target.value }))
                }
              />

              <div className="flex flex-wrap gap-3">
                {REQUIREMENTS.map(r => {
                  const selected = draft.requirements?.includes(r)
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        const current = draft.requirements || []
                        setDraft({
                          ...draft,
                          requirements: selected
                            ? current.filter(x => x !== r)
                            : [...current, r],
                        })
                      }}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "999px",
                        fontSize: "14px",
                        background: selected ? "#ec4899" : "#f8fafc",
                        color: selected ? "#ffffff" : "#334155",
                        border: selected ? "none" : "1px solid #e2e8f0",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {r}
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-between">
                <button className="button-secondary" onClick={back}>
                  Volver
                </button>

                <button
                  className="button-primary"
                  onClick={next}
                  disabled={!draft.type || !draft.description}
                >
                  Continuar
                </button>
              </div>

            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >

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

                  e.currentTarget.value = ''
                }}
              />

              {draft.media && draft.media.length > 0 && (
                <div className="space-y-2">
                  {draft.media.map((f, idx) => (
                    <div
                      key={`${f.name}-${idx}`}
                      className="flex items-center justify-between"
                    >
                      <span style={{ fontSize: "14px", color: "#475569" }}>
                        {idx + 1}. {f.name}
                      </span>
                      <button
                        type="button"
                        style={{ color: "#ec4899", fontSize: "14px" }}
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

              <div className="flex justify-between">
                <button className="button-secondary" onClick={back}>
                  Volver
                </button>

                <button
                  className="button-primary"
                  onClick={async () => (await requireAuth()) && next()}
                >
                  Continuar
                </button>
              </div>

            </motion.div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >

              <input
                className="input-modern"
                placeholder="Dirección (privada)"
                value={draft.address || ''}
                onChange={e =>
                  setDraft({ ...draft, address: e.target.value })
                }
              />

              <input
                className="input-modern"
                placeholder="Teléfono de contacto"
                value={draft.phone || ''}
                onChange={e =>
                  setDraft({ ...draft, phone: e.target.value })
                }
              />

              <input
                className="input-modern"
                placeholder="Nombre"
                value={draft.first_name || ''}
                onChange={e =>
                  setDraft(d => ({ ...d, first_name: e.target.value }))
                }
              />

              <input
                className="input-modern"
                placeholder="Apellido"
                value={draft.last_name || ''}
                onChange={e =>
                  setDraft(d => ({ ...d, last_name: e.target.value }))
                }
              />

              <input
                className="input-modern"
                type="email"
                placeholder="Email de contacto"
                value={draft.email || ''}
                onChange={e =>
                  setDraft(d => ({ ...d, email: e.target.value }))
                }
              />

              <div className="flex justify-between">
                <button className="button-secondary" onClick={back}>
                  Volver
                </button>

                <button
                  type="button"
                  className="button-primary"
                  onClick={publish}
                >
                  Publicar propiedad
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  </section>
)
}
