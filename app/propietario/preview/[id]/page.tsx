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

      const urls = await Promise.all(
        (data.property_media || [])
          .sort((a, b) => a.position - b.position)
          .map(async m => {
            const { data } = await supabase.storage
              .from('media')
              .createSignedUrl(m.url, 3600)
            return data?.signedUrl ?? null
          })
      )

      setMediaUrls(urls.filter(Boolean) as string[])
      setLoading(false)
    }

    run()
  }, [id, router])

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Cargando…</div>
  }

  if (!property) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">No encontrada</div>
  }

  return (
    <div className="min-h-screen bg-black">
      {/* HERO */}
      {mediaUrls.length > 0 && (
        <div className="w-full h-[420px] bg-black overflow-hidden grid grid-cols-3 gap-1">
          {property.property_media.map((m, i) => {
            const url = mediaUrls[i]
            if (!url) return null

            if (m.type === 'photo') {
              return <img key={i} src={url} className="w-full h-full object-cover" />
            }

            if (m.type === 'video') {
              return (
                <video key={i} controls className="w-full h-full object-cover">
                  <source src={url} />
                </video>
              )
            }

            if (m.type === 'pdf') {
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-full flex items-center justify-center text-white bg-neutral-800"
                >
                  PDF
                </a>
              )
            }

            return null
          })}
        </div>
      )}

      {/* INFO */}
      <div className="max-w-xl mx-auto -mt-24 relative z-10 bg-neutral-900 rounded-2xl p-6 space-y-4">
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

