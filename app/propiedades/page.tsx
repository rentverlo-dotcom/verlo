'use client'

import { useEffect, useState } from 'react'
import MatchDeck from '@/components/MatchDeck'

type PropertyFeedItem = {
  id: string
  title: string
  city: string | null
  zone: string | null
  price: number | null
  currency: string
  cover_url: string | null
  short_description: string | null
}

export default function PropiedadesFeed() {
  const [properties, setProperties] = useState<PropertyFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/properties/feed')
      .then(res => {
        if (!res.ok) throw new Error('Error cargando propiedades')
        return res.json()
      })
      .then((data: PropertyFeedItem[]) => setProperties(data || []))
      .catch(() => {
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

  return (
    <div className="min-h-screen bg-black">
      <MatchDeck
        matches={properties}
        source="properties"
      />
    </div>
  )
}
