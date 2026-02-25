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
// 2) Cover por propiedad
const ids = props.map(p => p.id)

const { data: media, error: mediaErr } = await supabase
  .from('property_media')
  .select('property_id, url, position')
  .in('property_id', ids)
  .order('position', { ascending: true })

if (mediaErr) throw mediaErr

const map: Record<string, string> = {}

// IMPORTANTE: for...of para poder usar await
for (const m of media ?? []) {
  if (map[m.property_id]) continue

  const raw = m.url

  // Si en DB guardaste una URL completa, úsala directo
  if (raw?.startsWith('http')) {
    map[m.property_id] = raw
    continue
  }

  // 1) Intento signed URL (sirve si el bucket es privado)
  const { data: signed, error: signErr } = await supabase.storage
    .from('property-media')
    .createSignedUrl(raw, 60 * 60)

  if (!signErr && signed?.signedUrl) {
    map[m.property_id] = signed.signedUrl
    continue
  }

  // 2) Fallback: public URL (sirve si el bucket es público)
  const pub = supabase.storage.from('property-media').getPublicUrl(raw).data.publicUrl
  if (pub) map[m.property_id] = pub
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

  // IMPORTANTÍSIMO: al clickear una propiedad, mandalo a la ficha linda:
  const goPreview = (propertyId: string) => router.push(`/propietario/preview/${propertyId}`)

  if (loading) {
    return (
      <div style={page}>
        <div style={topbar}>
          <h1 style={title}>Mis propiedades</h1>
        </div>
        <div style={{ padding: 40, color: '#fff', opacity: 0.9 }}>Cargando…</div>
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
        <div style={{ padding: 40, color: '#fff' }}>
          <div style={{ marginBottom: 10, opacity: 0.85 }}>Algo salió mal:</div>
          <div style={{ fontFamily: 'monospace', opacity: 0.9 }}>{error}</div>
        </div>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div style={empty}>
        <h2 style={{ margin: 0 }}>Todavía no publicaste propiedades</h2>
        <p style={{ margin: 0, opacity: 0.75 }}>
          Cuando publiques, van a aparecer acá ordenadas por las más recientes.
        </p>
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
              role="button"
              tabIndex={0}
            >
              <div style={overlay} />
              {!cover && <div style={noCover}>Sin foto</div>}

              <div style={info}>
                <div style={rowBetween}>
                  <h3 style={h3}>{p.property_type || 'Propiedad'}</h3>
                  <span style={pill(p.publish_status)}>{labelStatus(p.publish_status)}</span>
                </div>

                <div style={price}>{money.format(Number(p.price || 0))}</div>

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
  if (v.includes('publish') || v.includes('public')) return 'Publicada'
  if (v.includes('draft') || v.includes('borr')) return 'Borrador'
  if (v.includes('review') || v.includes('pend')) return 'Pendiente'
  return s || '—'
}

function pill(status?: string): React.CSSProperties {
  const v = (status || '').toLowerCase()
  const base: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.18)',
    whiteSpace: 'nowrap',
  }
  if (v.includes('publish') || v.includes('public')) return { ...base, background: 'rgba(34,197,94,0.18)', borderColor: 'rgba(34,197,94,0.28)' }
  if (v.includes('draft') || v.includes('borr')) return { ...base, background: 'rgba(250,204,21,0.14)', borderColor: 'rgba(250,204,21,0.25)' }
  return base
}

/* ================== STYLES ================== */

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: `
    radial-gradient(900px 500px at 15% 10%, rgba(99,102,241,0.18), transparent 60%),
    radial-gradient(900px 500px at 85% 20%, rgba(16,185,129,0.16), transparent 55%),
    radial-gradient(900px 500px at 60% 85%, rgba(236,72,153,0.12), transparent 60%),
    linear-gradient(180deg, #f8fafc 0%, #ffffff 60%, #f8fafc 100%)
  `,
  color: '#0f172a',
}

const topbar: React.CSSProperties = {
  padding: '28px 20px 10px',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 12,
  position: 'sticky',
  top: 0,
  background: 'rgba(248,250,252,0.75)',
  backdropFilter: 'blur(12px)',
  zIndex: 10,
  borderBottom: '1px solid rgba(15,23,42,0.08)',
}

const title = { margin: 0, color: '#0f172a', fontSize: 26, letterSpacing: -0.3 }
const subtitle = { marginTop: 6, color: '#334155', opacity: 0.9, fontSize: 13 }

const grid: React.CSSProperties = {
  padding: '18px 20px 80px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 18,
}

const card: React.CSSProperties = {
  height: 420,
  borderRadius: 22,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  position: 'relative',
  cursor: 'pointer',
  overflow: 'hidden',
  border: '1px solid rgba(15,23,42,0.10)',
  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
  backgroundColor: 'rgba(255,255,255,0.65)',
}

const overlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(to top, rgba(15,23,42,0.70) 12%, rgba(15,23,42,0.18) 55%, rgba(15,23,42,0.04) 100%)',
}

const info: React.CSSProperties = {
  position: 'absolute',
  bottom: 18,
  left: 18,
  right: 18,
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const rowBetween: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
}

const h3: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  letterSpacing: -0.2,
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
  background: 'rgba(255,255,255,0.12)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.18)',
}

const empty: React.CSSProperties = {
  minHeight: '100vh',
  background: 'transparent',
  color: '#0f172a',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
  textAlign: 'center',
  padding: 20,
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
