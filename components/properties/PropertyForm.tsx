'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase/client'

export default function PropertyForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])

  // 🔁 RETRY POST LOGIN
  useEffect(() => {
    const retry = localStorage.getItem('retry_property_submit')
    if (retry === 'true') {
      localStorage.removeItem('retry_property_submit')
      const form = document.getElementById('property-form') as HTMLFormElement
      form?.requestSubmit()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    // 🔐 CHECK SESSION
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 🚨 NO SESSION → LOGIN FLOW
    if (!user) {
      localStorage.setItem('pending_property_form', JSON.stringify(Object.fromEntries(formData)))
      localStorage.setItem('retry_property_submit', 'true')
      router.push('/login')
      return
    }

    // 🏠 CREATE PROPERTY
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
        publish_status: 'published',
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('Error creando propiedad')
      setLoading(false)
      return
    }

    // 📸 UPLOAD PHOTOS
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      const path = `${property.id}/${crypto.randomUUID()}`

      await supabase.storage.from('property-media').upload(path, file)

      await supabase.from('property_media').insert({
        property_id: property.id,
        type: 'photo',
        url: path,
        position: i,
      })
    }

    localStorage.removeItem('pending_property_form')
    setLoading(false)

    // ✅ FIN DEL FLUJO
    router.push(`/propiedades/${property.id}`)
  }

  return (
    <form
      id="property-form"
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <input name="title" required />
      <textarea name="description" required />
      <input name="city" required />
      <input name="zone" required />
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
        onChange={(e) => setPhotos(Array.from(e.target.files || []))}
      />

      <button disabled={loading}>
        {loading ? 'Publicando...' : 'Publicar propiedad'}
      </button>
    </form>
  )
}
