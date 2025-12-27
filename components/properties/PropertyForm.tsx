'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase/client'

export default function PropertyForm() {
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    console.log('SUBMIT FORM')

    const formData = new FormData(e.currentTarget)
    console.log('FORM DATA', Object.fromEntries(formData.entries()))

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('AUTH ERROR', authError)
      alert('No autenticado')
      setLoading(false)
      return
    }

    // 1️⃣ Crear propiedad (draft)
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        owner_id: user.id,
        title: formData.get('title'),
        description: formData.get('description'),
        city: formData.get('city'),
        zone: formData.get('zone'),
        price: Number(formData.get('price')),
        property_type: formData.get('property_type'),
        allowed_durations: formData.getAll('allowed_durations'),
        furnished: formData.get('furnished') === 'on',
        pets_allowed: formData.get('pets_allowed') === 'on',
        publish_status: 'draft',
      })
      .select()
      .single()

    if (error || !property) {
      console.error('INSERT ERROR', error)
      alert('Error creando propiedad')
      setLoading(false)
      return
    }

    console.log('PROPERTY CREATED', property.id)

    // 2️⃣ Subir fotos
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      const path = `${property.id}/${crypto.randomUUID()}`

      const { error: uploadError } = await supabase.storage
        .from('property-media')
        .upload(path, file)

      if (uploadError) {
        console.error('UPLOAD ERROR', uploadError)
        continue
      }

      await supabase.from('property_media').insert({
        property_id: property.id,
        type: 'photo',
        url: path,
        position: i,
      })
    }

    // 3️⃣ Publicar
    await supabase
      .from('properties')
      .update({ publish_status: 'published' })
      .eq('id', property.id)

    setLoading(false)
    alert('Propiedad publicada correctamente')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* DATOS BÁSICOS */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Datos de la propiedad</h2>

        <input name="title" placeholder="Título" required />
        <textarea name="description" placeholder="Descripción" required />
        <input name="city" placeholder="Ciudad" required />
        <input name="zone" placeholder="Zona" required />
        <input name="price" type="number" placeholder="Precio mensual" required />

        <select name="property_type" required>
          <option value="">Tipo de propiedad</option>
          <option value="apartment">Departamento</option>
          <option value="house">Casa</option>
        </select>
      </section>

      {/* CONDICIONES */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Condiciones</h2>

        <label>
          <input type="checkbox" name="allowed_durations" value="short" /> Alquiler corto
        </label>

        <label>
          <input type="checkbox" name="allowed_durations" value="long" /> Alquiler largo
        </label>

        <label>
          <input type="checkbox" name="furnished" /> Amoblado
        </label>

        <label>
          <input type="checkbox" name="pets_allowed" /> Acepta mascotas
        </label>
      </section>

      {/* FOTOS */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Fotos</h2>

        <input
          type="file"
          multiple
          accept="image/*"
          required
          onChange={(e) => setPhotos(Array.from(e.target.files || []))}
        />
      </section>

      <button disabled={loading}>
        {loading ? 'Publicando...' : 'Publicar propiedad'}
      </button>
    </form>
  )
}
