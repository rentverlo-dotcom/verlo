// app/propiedades/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function PropertyPage() {
  const params = useParams<{ id: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [loading, setLoading] = useState(true)
  const [property, setProperty] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])

  useEffect(() => {
    if (!id) return

    async function load() {
      setLoading(true)

      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

      if (propertyError || !propertyData) {
        setProperty(null)
        setLoading(false)
        return
      }

      // OWNER puede ver aunque no esté publicada
      if (user && propertyData.owner_id === user.id) {
        const { data: mediaData } = await supabase
          .from('property_media')
          .select('*')
          .eq('property_id', id)
          .order('position')

        setProperty(propertyData)
        setMedia(mediaData || [])
        setLoading(false)
        return
      }

      // Público: solo si está publicada
      if (propertyData.publish_status === 'published') {
        const { data: mediaData } = await supabase
          .from('property_media')
          .select('*')
          .eq('property_id', id)
          .order('position')

        setProperty(propertyData)
        setMedia(mediaData || [])
        setLoading(false)
        return
      }

      // Ni owner ni pública
      setProperty(null)
      setLoading(false)
    }

    load()
  }, [id])

  if (loading) return <div style={{ padding: 40 }}>Cargando…</div>
  if (!property) return <div style={{ padding: 40 }}>No existe</div>

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>
        {property.property_type} – ${property.price}
      </h1>

      {media.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
            marginTop: 24,
          }}
        >
          {media.map(m => {
            const url = supabase.storage
              .from('property-media')
              .getPublicUrl(m.url).data.publicUrl

            return (
              <img
                key={m.id}
                src={url}
                style={{
                  width: '100%',
                  height: 160,
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
            )
          })}
        </div>
      )}

      <pre style={{ marginTop: 32, opacity: 0.6 }}>
        {JSON.stringify(property, null, 2)}
      </pre>
    </div>
  )
}
