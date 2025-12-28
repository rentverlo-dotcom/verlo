// app/propietario/publicar/page.tsx
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

  if (step === 1)
    return (
      <div>
        <h2>Paso 1</h2>
        <input placeholder="Zona" onChange={e => setDraft({ ...draft, zone: e.target.value })} />
        <input type="number" placeholder="Precio" onChange={e => setDraft({ ...draft, price: Number(e.target.value) })} />
        <button onClick={() => setStep(2)}>Continuar</button>
      </div>
    )

  if (step === 2)
    return (
      <div>
        <h2>Paso 2</h2>
        <input placeholder="Tipo" onChange={e => setDraft({ ...draft, type: e.target.value })} />
        <textarea placeholder="Requisitos" onChange={e => setDraft({ ...draft, requirements: e.target.value })} />
        <button onClick={() => setStep(3)}>Continuar</button>
      </div>
    )

  if (step === 3)
    return (
      <div>
        <h2>Paso 3</h2>
        <input type="file" multiple onChange={e => setDraft({ ...draft, media: Array.from(e.target.files || []) })} />
        <button onClick={async () => (await requireAuth()) && setStep(4)}>Continuar</button>
      </div>
    )

  if (step === 4)
    return (
      <div>
        <h2>Paso 4 (Privado)</h2>
        <input placeholder="Dirección" onChange={e => setDraft({ ...draft, address: e.target.value })} />
        <input placeholder="Teléfono" onChange={e => setDraft({ ...draft, phone: e.target.value })} />
        <button onClick={publish}>Publicar</button>
      </div>
    )

  return null
}
