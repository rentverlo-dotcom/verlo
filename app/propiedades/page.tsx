'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Property = {
  id: string
  title?: string | null
  description?: string | null
  city: string
  zone?: string | null
  price: number
  currency: string
  property_type: string
}

export default function PropiedadesFeed() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/properties/feed')
      .then(res => {
        if (!res.ok) throw new Error('Error cargando propiedades')
        return res.json()
      })
      .then(data => {
        setProperties(data || [])
      })
      .catch(err => {
        console.error(err)
        setError('No pudimos cargar las propiedades')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-neutral-400">
        Cargando propiedades…
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400">
        {error}
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-neutral-400">
        No hay propiedades disponibles por ahora
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black px-4 pt-24 pb-16">
      <div className="max-w-3xl mx-auto space-y-4">
        {properties.map(p => (
          <Link
            key={p.id}
            href={`/propiedades/${p.id}`}
            className="block bg-neutral-900 rounded-xl p-4 hover:bg-neutral-800 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-white font-medium">
                  {p.title || 'Propiedad en alquiler'}
                </h2>
                <p className="text-sm text-neutral-400">
                  {p.city}
                  {p.zone ? ` · ${p.zone}` : ''}
                </p>
              </div>

              <div className="text-white font-semibold">
                {p.price} {p.currency}
              </div>
            </div>

            {p.description && (
              <p className="text-sm text-neutral-400 mt-2 line-clamp-2">
                {p.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
