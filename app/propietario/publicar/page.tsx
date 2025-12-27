'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PropertyForm() {
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const form = e.target as HTMLFormElement
    const data = new FormData(form)

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) throw new Error('No auth')

    // 1️⃣ crear propiedad
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        owner_id: user.id,
        title: data.get('title'),
        description: data.get('description'),
        city: data.get('city'),
        zone: data.get('zone'),
        price: Number(data.get('price')),
        property_type: data.get('property_type'),
        allowed_durations: data.getAll('allowed_durations'),
        furnished: data.get('furnished') === 'on',
        pets_allowed: data.get('pets_allowed') === 'on',
        publish_status: 'draft'
      })
      .select()
      .single()

    if (error) throw error

    // 2️⃣ subir fotos
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      const path = `${property.id}/${crypto.randomUUID()}`
      
      await supabase.storage
        .from('property-media')
        .upload(path, file)

      await supabase.from('property_media').insert({
        property_id: property.id,
        type: 'photo',
        url: path,
        position: i
      })
    }

    // 3️⃣ publicar
    await supabase
      .from('properties')
      .update({ publish_status: 'published' })
      .eq('id', property.id)

    setLoading(false)
    alert('Propiedad publicada')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="title" placeholder="Título" required />
      <textarea name="description" placeholder="Descripción" required />
      <input name="city" placeholder="Ciudad" required />
      <input name="zone" placeholder="Zona" required />
      <input name="price" type="number" required />

      <select name="property_type" required>
        <option value="apartment">Departamento</option>
        <option value="house">Casa</option>
      </select>

      <label>
        <input type="checkbox" name="allowed_durations" value="short" /> Corto
      </label>
      <label>
        <input type="checkbox" name="allowed_durations" value="long" /> Largo
      </label>

      <label>
        <input type="checkbox" name="furnished" /> Amoblado
      </label>

      <label>
        <input type="checkbox" name="pets_allowed" /> Mascotas
      </label>

      <input
        type="file"
        multiple
        accept="image/*"
        required
        onChange={(e) => setPhotos([...e.target.files!])}
      />

      <button disabled={loading}>
        {loading ? 'Publicando...' : 'Publicar propiedad'}
      </button>
    </form>
  )
}
