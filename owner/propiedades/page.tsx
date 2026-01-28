'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import OwnerDeck from '@/components/OwnerDeck'

export default function OwnerPropertiesPage() {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user) return

      const { data } = await supabase
        .from('properties')
        .select(`
          id,
          property_type,
          price,
          publish_status,
          property_media ( url )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      const cards = (data || []).map(p => ({
        id: p.id,
        title: p.property_type,
        price: p.price,
        publish_status: p.publish_status,
        cover_url: p.property_media?.[0]
          ? supabase.storage
              .from('property-media')
              .getPublicUrl(p.property_media[0].url).data.publicUrl
          : '/placeholder.jpg',
      }))

      setCards(cards)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <div>Cargando…</div>

  return <OwnerDeck cards={cards} />
}
