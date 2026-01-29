'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Property = {
  price: number | null
  description: string | null
  property_media: {
    url: string
    position: number
  }[]
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
      // 1️⃣ GARANTIZAR SESIÓN (OPCIÓN A)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/ingresar')
        return
      }

      // 2️⃣ FETCH PROPERTY + MEDIA (authenticated)
      const { data, error } = await supabase
        .from('properties')
        .select(`
          price,
          description,
          property_media (
            url,
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

      // 3️⃣ SIGNED URLS
      if (data.property_media?.length) {
        const urls = await Promise.all(
          data.property_media
            .sort((a, b) => a.position - b.position)
            .map(async m => {
              const { data } = await supabase.storage
                .from('media')
                .createSignedUrl(m.url, 3600)

              return data?.signedUrl
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

        {/* MEDIA */}
        {mediaUrls.length > 0 && (
          <div className="h-96 flex overflow-x-auto snap-x snap-mandatory">
            {mediaUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                className="h-full w-full object-cover snap-center shrink-0"
              />
            ))}
          </div>
        )}

        {/* INFO */}
        <div className="p-6 space-y-4">
          <div className="text-2xl font-bold text-white">
            ${property.price?.toLocaleString('es-AR')}
          </div>

          <p className="text-neutral-300 text-sm whitespace-pre-line">
            {property.description}
          </p>

          <button className="button-primary w-full">
            Publicar
          </button>
        </div>
      </div>
    </div>
  )
}
