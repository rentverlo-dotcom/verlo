'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Property = {
  id: string
  price: number | null
  description: string | null
  property_media: {
    id: string
    url: string
    type: 'photo' | 'video'
    position: number
  }[]
}

export default function OwnerPreview() {
  const params = useParams()
  const id = params?.id as string

  const [property, setProperty] = useState<Property | null>(null)
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchProperty = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          price,
          description,
          property_media (
            id,
            url,
            type,
            position
          )
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        console.error(error)
        setLoading(false)
        return
      }

      setProperty(data)

      if (data.property_media?.length) {
        const urls = await Promise.all(
          data.property_media
            .sort((a, b) => a.position - b.position)
            .map(async m => {
              const { data } = await supabase.storage
                .from('media')
                .createSignedUrl(m.url, 60 * 60)

              return data?.signedUrl || ''
            })
        )

        setMediaUrls(urls.filter(Boolean))
      }

      setLoading(false)
    }

    fetchProperty()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Cargando propiedad…
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        No se encontró la propiedad
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex justify-center p-6">
      <div className="w-full max-w-md bg-neutral-900 rounded-2xl overflow-hidden shadow-xl">

        {/* MEDIA */}
        <div className="h-96 flex overflow-x-auto snap-x snap-mandatory">
          {mediaUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              className="h-full w-full object-cover snap-center shrink-0"
              alt={`media-${i}`}
            />
          ))}
        </div>

        {/* INFO */}
        <div className="p-6 space-y-3">
          <div className="text-2xl font-semibold text-white">
            ${property.price?.toLocaleString('es-AR')}
          </div>

          <p className="text-neutral-300 text-sm whitespace-pre-line">
            {property.description}
          </p>

          <div className="flex gap-2 pt-4">
            <button className="button-secondary w-full">
              Editar
            </button>
            <button className="button-primary w-full">
              Publicar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
