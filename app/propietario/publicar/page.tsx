'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

type Draft = {
  zone?: string
  price?: number
  type?: string
  duration?: string[]
  furnished?: boolean
  pets?: boolean
  requirements?: string
  media?: File[]
  address?: string
  phone?: string
}

export default function PublicarPropiedad() {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Draft>(() => {
    if (typeof window === 'undefined') return {}
    return JSON.parse(localStorage.getItem('property_draft') || '{}')
  })

  useEffect(() => {
    localStorage.setItem('property_draft', JSON.stringify(draft))
  }, [draft])

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
        zone: draft.zone,
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

        {/* PASO 1 */}
        {step === 1 && (
          <div className="mt-8 space-y-4">
            <input
              className="input"
              placeholder="Zona"
              value={draft.zone || ''}
              onChange={e => setDraft({ ...draft, zone: e.target.value })}
            />
            <input
              className="input"
              type="number"
              placeholder="Precio mensual"
              value={draft.price || ''}
              onChange={e => setDraft({ ...draft, price: Number(e.target.value) })}
            />
            <button className="button-primary" onClick={() => setStep(2)}>
              Continuar
            </button>
          </div>
        )}

        {/* PASO 2 */}
        {step === 2 && (
          <div className="mt-8 space-y-4">
            <input
              className="input"
              placeholder="Tipo de propiedad"
              value={draft.type || ''}
              onChange={e => setDraft({ ...draft, type: e.target.value })}
            />
            <textarea
              className="input h-28 resize-none"
              placeholder="Requisitos para el inquilino"
              value={draft.requirements || ''}
              onChange={e => setDraft({ ...draft, requirements: e.target.value })}
            />
            <button className="button-primary" onClick={() => setStep(3)}>
              Continuar
            </button>
          </div>
        )}

        {/* PASO 3 */}
        {step === 3 && (
          <div className="mt-8 space-y-4">
            <div className="p-4 border border-dashed border-neutral-700 rounded-xl text-neutral-400 text-sm text-center">
              Subí fotos o videos de la propiedad  
              <br />
              (no incluyas dirección ni datos privados)
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

        {/* PASO 4 */}
        {step === 4 && (
          <div className="mt-8 space-y-4">
            <input
              className="input"
              placeholder="Dirección (privada)"
              value={draft.address || ''}
              onChange={e => setDraft({ ...draft, address: e.target.value })}
            />
            <input
              className="input"
              placeholder="Teléfono de contacto"
              value={draft.phone || ''}
              onChange={e => setDraft({ ...draft, phone: e.target.value })}
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
