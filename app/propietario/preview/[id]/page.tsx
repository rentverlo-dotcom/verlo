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
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/ingresar')
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
        const urls = await Promise.all(
          data.property_media
            .sort((a, b) => a.position - b.position)
            .map(async media => {
              const { data, error } = await supabase.storage
                .from('media')
                .createSignedUrl(media.url, 3600)

              if (error) {
                console.error(error)
                return null
              }

              return data?.signedUrl ?? null
            })
        )

        setMediaUrls(urls.filter(Boolean) as string[])
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

      {/* HERO CON TODA LA MEDIA */}
      {mediaUrls.length > 0 && (
        <div className="relative w-full h-[480px] bg-black overflow-hidden">
          <div className="absolute inset-0 flex">
            {property.property_media
              .sort((a, b) => a.position - b.position)
              .map((media, i) => {
                const url = mediaUrls[i]

                if (media.type === 'photo') {
                  return (
                    <div key={i} className="flex-1 h-full">
                      <img
                        src={url}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )
                }

                if (media.type === 'video') {
                  return (
                    <div key={i} className="flex-1 h-full">
                      <video
                        controls
                        className="w-full h-full object-cover"
                      >
                        <source src={url} />
                      </video>
                    </div>
                  )
                }

                if (media.type === 'pdf') {
                  return (
                    <div
                      key={i}
                      className="flex-1 h-full flex items-center justify-center bg-neutral-900"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white underline text-lg"
                      >
                        Ver documento PDF
                      </a>
                    </div>
                  )
                }

                return null
              })}
          </div>

          {/* Overlay suave */}
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* CARD INFO */}
      <div className="max-w-xl mx-auto bg-neutral-900 rounded-2xl shadow-xl -mt-24 relative z-10 p-6 space-y-4">
        <div className="text-3xl font-semibold text-white">
          ${property.price?.toLocaleString('es-AR')}
        </div>

        <p className="text-neutral-300 text-base leading-relaxed">
          {property.short_description}
        </p>
      </div>
    </div>
  )
}
