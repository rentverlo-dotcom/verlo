'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Property = {
  id: string
  property_type: string
  price: number
  publish_status: string
  created_at?: string
}

export default function OwnerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<Property[]>([])
  const [covers, setCovers] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const money = useMemo(
    () =>
      new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }),
    []
  )

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        setError(null)
        setLoading(true)

        const { data: auth, error: authErr } = await supabase.auth.getUser()
        if (authErr) throw authErr

        if (!auth.user) {
          router.push('/login')
          return
        }

        // 1) Propiedades del owner
        const { data: props, error: propsErr } = await supabase
          .from('properties')
          .select('id, property_type, price, publish_status, created_at')
          .eq('owner_id', auth.user.id)
          .order('created_at', { ascending: false })

        if (propsErr) throw propsErr
        if (!alive) return

        setProperties(props ?? [])

        if (!props || props.length === 0) {
          setCovers({})
          setLoading(false)
          return
        }

        // 2) Covers
        const ids = props.map(p => p.id)

        const { data: media, error: mediaErr } = await supabase
          .from('property_media')
          .select('property_id, url, position')
          .in('property_id', ids)
          .order('position', { ascending: true })

        if (mediaErr) throw mediaErr

        const map: Record<string, string> = {}

        for (const m of media ?? []) {
          if (map[m.property_id]) continue

          const raw = m.url
          if (!raw) continue

          // Si guardaste URL completa
          if (raw.startsWith('http')) {
            map[m.property_id] = raw
            continue
          }

          // Normalización crítica del path
          const cleanPath = raw
            .replace(/^public\//, '')
            .replace(/^property-media\//, '')
            .replace(/^\/+/, '')

          // 1) Intento signed URL
          const { data: signed, error: signErr } = await supabase.storage
            .from('property-media')
            .createSignedUrl(cleanPath, 60 * 60)

          if (!signErr && signed?.signedUrl) {
            map[m.property_id] = signed.signedUrl
            continue
          }

          // 2) Fallback público
          const pub = supabase.storage
            .from('property-media')
            .getPublicUrl(cleanPath).data.publicUrl

          if (pub) {
            map[m.property_id] = pub
          }
        }

        if (!alive) return
        setCovers(map)
        setLoading(false)

      } catch (e: any) {
        if (!alive) return
        setError(e?.message ?? 'Error cargando propiedades')
        setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [router])

  const goPublish = () => router.push('/propietario/publicar')
  const goPreview = (propertyId: string) =>
    router.push(`/propietario/preview/${propertyId}`)

  if (loading) {
    return (
      <div style={page}>
        <div style={topbar}>
          <h1 style={title}>Mis propiedades</h1>
        </div>
        <div style={{ padding: 40, color: '#fff' }}>Cargando…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={page}>
        <div style={topbar}>
          <h1 style={title}>Mis propiedades</h1>
          <button style={cta} onClick={goPublish}>Publicar</button>
        </div>
        <div style={{ padding: 40, color: '#fff' }}>{error}</div>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div style={empty}>
        <h2>No publicaste propiedades todavía</h2>
        <button style={cta} onClick={goPublish}>
          Publicar ahora
        </button>
      </div>
    )
  }

  return (
    <div style={page}>
      <div style={topbar}>
        <div>
          <h1 style={title}>Mis propiedades</h1>
          <div style={subtitle}>
            {properties.length} {properties.length === 1 ? 'propiedad' : 'propiedades'}
          </div>
        </div>
        <button style={cta} onClick={goPublish}>Publicar</button>
      </div>

      <div style={grid}>
        {properties.map(p => {
          const cover = covers[p.id]

          return (
            <div
              key={p.id}
              style={{
                ...card,
                backgroundImage: cover ? `url(${cover})` : undefined,
              }}
              onClick={() => goPreview(p.id)}
            >
              <div style={overlay} />
              {!cover && <div style={noCover}>Sin foto</div>}

              <div style={info}>
                <div style={rowBetween}>
                  <h3 style={h3}>{p.property_type}</h3>
                  <span style={pill(p.publish_status)}>
                    {labelStatus(p.publish_status)}
                  </span>
                </div>

                <div style={price}>
                  {money.format(Number(p.price || 0))}
                </div>

                {p.created_at && (
                  <div style={meta}>
                    Publicada: {new Date(p.created_at).toLocaleDateString('es-AR')}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* helpers */

function labelStatus(s?: string) {
  const v = (s || '').toLowerCase()
  if (v.includes('publish')) return 'Publicada'
  if (v.includes('draft')) return 'Borrador'
  return s || '—'
}

function pill(status?: string): React.CSSProperties {
  return {
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
  }
}

/* ================== STYLES ================== */

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: `
    radial-gradient(1000px 500px at 50% -10%, rgba(59,130,246,0.45), transparent 60%),
    radial-gradient(900px 500px at 50% 110%, rgba(236,72,153,0.6), transparent 60%),
    linear-gradient(180deg, #0b0f1a 0%, #111827 50%, #0f172a 100%)
  `,
  color: '#fff',
}

const topbar: React.CSSProperties = {
  padding: '28px 20px',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(20px)',
}

const title = { margin: 0, color: '#fff', fontSize: 26 }
const subtitle = { marginTop: 6, opacity: 0.7 }

const grid: React.CSSProperties = {
  padding: '20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 20,
}

const card: React.CSSProperties = {
  height: 420,
  borderRadius: 22,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  position: 'relative',
  cursor: 'pointer',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.1)',
}

const overlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(to top, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.2) 60%, transparent)',
}

const info: React.CSSProperties = {
  position: 'absolute',
  bottom: 18,
  left: 18,
  right: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const rowBetween: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
}

const h3: React.CSSProperties = {
  margin: 0,
}

const price: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
}

const meta: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
}

const noCover: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
}

const empty: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 14,
  color: '#fff',
}

const cta: React.CSSProperties = {
  padding: '12px 18px',
  borderRadius: 999,
  border: 'none',
  background: '#22c55e',
  color: '#000',
  fontWeight: 800,
  cursor: 'pointer',
}
