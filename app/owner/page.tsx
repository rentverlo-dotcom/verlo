'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Property = {
  id: string
  property_type: string
  price: number
  publish_status: string
}

export default function OwnerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<Property[]>([])
  const [covers, setCovers] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        router.push('/login')
        return
      }

      // 1️⃣ Traer propiedades del owner
      const { data: props } = await supabase
        .from('properties')
        .select('id, property_type, price, publish_status')
        .eq('owner_id', auth.user.id)
        .order('created_at', { ascending: false })

      if (!props || props.length === 0) {
        setProperties([])
        setLoading(false)
        return
      }

      setProperties(props)

      // 2️⃣ Traer una imagen por propiedad (cover)
      const ids = props.map(p => p.id)

      const { data: media } = await supabase
        .from('property_media')
        .select('property_id, url')
        .in('property_id', ids)
        .order('position')

      const map: Record<string, string> = {}
      media?.forEach(m => {
        if (!map[m.property_id]) {
          map[m.property_id] = supabase.storage
            .from('property-media')
            .getPublicUrl(m.url).data.publicUrl
        }
      })

      setCovers(map)
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return <div style={{ padding: 40, color: '#fff' }}>Cargando…</div>
  }

  if (properties.length === 0) {
    return (
      <div style={empty}>
        <h2>No publicaste propiedades todavía</h2>
        <button style={cta} onClick={() => router.push('/propietario/publicar')}>
          Publicar ahora
        </button>
      </div>
    )
  }

  return (
    <div style={container}>
      {properties.map(p => (
        <div
          key={p.id}
          style={{
            ...card,
            backgroundImage: `url(${covers[p.id] || '/placeholder.jpg'})`,
          }}
          onClick={() => router.push(`/propiedades/${p.id}`)}
        >
          <div style={overlay} />
          <div style={info}>
            <h3>{p.property_type}</h3>
            <strong>${p.price}</strong>
            <span style={{ opacity: 0.7, fontSize: 12 }}>
              {p.publish_status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ================== STYLES ================== */

const container: React.CSSProperties = {
  minHeight: '100vh',
  padding: '80px 20px',
  background: '#000',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '20px',
}

const card: React.CSSProperties = {
  height: '420px',
  borderRadius: '20px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  position: 'relative',
  cursor: 'pointer',
}

const overlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: '20px',
  background:
    'linear-gradient(to top, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.2) 60%, transparent)',
}

const info: React.CSSProperties = {
  position: 'absolute',
  bottom: 20,
  left: 20,
  right: 20,
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const empty: React.CSSProperties = {
  minHeight: '100vh',
  background: '#000',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
}

const cta: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: 999,
  border: 'none',
  background: '#22c55e',
  color: '#000',
  fontWeight: 600,
  cursor: 'pointer',
}
