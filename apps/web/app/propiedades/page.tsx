'use client'

import { useEffect, useMemo, useState } from 'react'
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

type DeckMatch = {
  id: string
  title: string
  address: string
  price: number
  cover_url: string | null
  short_description: string
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
      .catch(err => {
        console.error(err)
        setError('No pudimos cargar las propiedades')
      })
      .finally(() => setLoading(false))
  }, [])

 const matches: DeckMatch[] = useMemo(() => {
  return (properties || []).map(p => ({
    id: p.id,
    title: p.title,
    address: [p.zone, p.city].filter(Boolean).join(', ') || '—',
    price: p.price ?? 0,
    cover_url: p.cover_url ?? '/placeholder.jpg',
    short_description: p.short_description ?? '',
  }))
}, [properties])


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

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-neutral-400">
        No hay propiedades disponibles por ahora
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-black">
    <MatchDeck matches={matches} />
  </div>
)

}
