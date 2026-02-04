'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type PropertyMedia = {
  url: string
  position: number
  type: 'photo' | 'video' | 'pdf'
}

type Property = {
  price: number | null
  short_description: string | null
  property_media: PropertyMedia[]
}

export default function OwnerPreview() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [property, setProperty] = useState<Property | null>(null)
  const [mediaUrls, setMediaUrls] = useState<
    { url: string; type: PropertyMedia['type'] }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('properties')
        .select(`
          price,
          short_description,
          property_media (
            url,
            position,
            type
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
        const signed = await Promise.all(
          data.property_media
            .sort((a, b) => a.position - b.position)
            .map(async m => {
              const { data } = await supabase.storage
                .from('media')
                .createSignedUrl(m.url, 3600)

              if (!data) return null
              return { url: data.signedUrl, type: m.type }
            })
        )

        setMediaUrls(signed.filter(Boolean) as any)
      }

      setLoading(false)
    }

    run()
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Cargando…
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Propiedad no encontrada
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* HERO MULTIMEDIA */}
      {mediaUrls.length > 0 && (
        <div className="w-full bg-black flex justify-center">
          <div className="w-full max-w-5xl aspect-video max-h-[420px] overflow-hidden rounded-b-2xl">
            {mediaUrls.map((m, i) => {
              if (m.type === 'photo') {
                return (
                  <img
                    key={i}
                    src={m.url}
                    className="w-full h-full object-cover"
                  />
                )
              }

              if (m.type === 'video') {
                return (
                  <video
                    key={i}
                    controls
                    className="w-full h-full object-contain bg-black"
                  >
                    <source src={m.url} />
                  </video>
                )
              }

              if (m.type === 'pdf') {
                return (
                  <iframe
                    key={i}
                    src={m.url}
                    className="w-full h-full bg-white"
                  />
                )
              }

              return null
            })}
          </div>
        </div>
      )}

      {/* INFO */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        <div className="text-3xl font-semibold text-white">
          ${property.price?.toLocaleString('es-AR')}
        </div>

        <p className="text-neutral-400 text-base leading-relaxed">
          {property.short_description}
        </p>
      </div>
    </div>
  )
}

