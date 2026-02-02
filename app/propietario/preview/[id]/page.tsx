//app/propietario/preview/[id]/page.tsx
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

              return data.signedUrl
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
    <div className="min-h-screen bg-black flex justify-center pt-10">
      <div className="w-full max-w-md bg-neutral-900 rounded-2xl overflow-hidden shadow-xl">

        {mediaUrls.length > 0 && (
          <div className="flex overflow-x-auto snap-x snap-mandatory py-4">
            {property.property_media
              .sort((a, b) => a.position - b.position)
              .map((media, i) => {
                const url = mediaUrls[i]

                if (media.type === 'photo') {
                  return (
                    <div
                      key={i}
                      className="snap-center shrink-0 w-full flex justify-center"
                    >
                      {/* 👇 ESTA ES LA CLAVE */}
                      <div className="h-40 w-full max-w-sm bg-black flex items-center justify-center rounded-lg overflow-hidden">
                        <img
                          src={url}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )
                }

                if (media.type === 'video') {
                  return (
                    <video
                      key={i}
                      controls
                      className="h-40 w-full snap-center shrink-0 object-contain"
                    >
                      <source src={url} />
                    </video>
                  )
                }

                if (media.type === 'pdf') {
                  return (
                    <div
                      key={i}
                      className="h-40 w-full snap-center shrink-0 flex items-center justify-center bg-neutral-800"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white underline"
                      >
                        Ver documento PDF
                      </a>
                    </div>
                  )
                }

                return null
              })}
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="text-2xl font-bold text-white">
            ${property.price?.toLocaleString('es-AR')}
          </div>

          <p className="text-neutral-300 text-base leading-relaxed">
            {property.short_description}
          </p>
        </div>
      </div>
    </div>
  )
}
