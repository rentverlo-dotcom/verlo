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

          // Si guardaste URL completa en DB (https://...)
          if (raw.startsWith('http')) {
            map[m.property_id] = raw
            continue
          }

          // Normalización del path (esto es CLAVE)
          const cleanPath = raw
            .replace(/^public\//, '')
            .replace(/^property-media\//, '')
            .replace(/^\/+/, '')

          // Intento signed URL (bucket privado)
          const { data: signed, error: signErr } = await supabase.storage
            .from('property-media')
            .createSignedUrl(cleanPath, 60 * 60)

          if (!signErr && signed?.signedUrl) {
            map[m.property_id] = signed.signedUrl
            continue
          }

          // Fallback público (bucket público)
          const pub = supabase.storage
            .from('property-media')
            .getPublicUrl(cleanPath).data.publicUrl

          if (pub) map[m.property_id] = pub
        }

        // ✅ Validar que las URLs realmente carguen (si no, las descartamos)
        const validated: Record<string, string> = {}
        const entries = Object.entries(map)

        await Promise.all(
          entries.map(async ([propertyId, url]) => {
            const ok = await preloadImage(url)
            if (ok) validated[propertyId] = url
          })
        )

        if (!alive) return
        setCovers(validated)
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
          <div>
            <div style={brandRow}>
              <h1 style={title}>Mis propiedades</h1>
              <span style={chip}>Cargando…</span>
            </div>
            <div style={subtitle}>Tus publicaciones, en un solo lugar</div>
          </div>
          <button style={cta} onClick={goPublish}>Publicar</button>
        </div>
        <div style={{ padding: 28, color: 'rgba(255,255,255,0.85)' }}>Cargando…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={page}>
        <div style={topbar}>
          <div>
            <div style={brandRow}>
              <h1 style={title}>Mis propiedades</h1>
              <span style={chip}>Error</span>
            </div>
            <div style={subtitle}>Algo salió mal cargando tus datos</div>
          </div>
          <button style={cta} onClick={goPublish}>Publicar</button>
        </div>
        <div style={{ padding: 28, color: 'rgba(255,255,255,0.85)' }}>
          <div style={{ marginBottom: 10, opacity: 0.85 }}>Detalle:</div>
          <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div style={page}>
        <div style={topbar}>
          <div>
            <div style={brandRow}>
              <h1 style={title}>Mis propiedades</h1>
              <span style={chip}>0</span>
            </div>
            <div style={subtitle}>Todavía no publicaste nada</div>
          </div>
          <button style={cta} onClick={goPublish}>Publicar</button>
        </div>

        <div style={empty}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Todavía no publicaste propiedades</h2>
          <p style={{ margin: 0, opacity: 0.75 }}>
            Publicá una propiedad y va a aparecer acá automáticamente.
          </p>
          <button style={cta} onClick={goPublish}>Publicar ahora</button>
        </div>
      </div>
    )
  }

  return (
    <div style={page}>
      <div style={topbar}>
        <div>
          <div style={brandRow}>
            <h1 style={title}>Mis propiedades</h1>
            <span style={chip}>{properties.length}</span>
          </div>
          <div style={subtitle}>
            {properties.length === 1 ? '1 propiedad' : `${properties.length} propiedades`} • ordenadas por las más recientes
          </div>
        </div>

        <div style={actions}>
          <button style={cta} onClick={goPublish}>Publicar</button>
        </div>
      </div>

      <div style={grid}>
        {properties.map(p => {
          const cover = covers[p.id]

          return (
            <div
              key={p.id}
              style={{
                ...card,
                // ✅ comillas para URLs con query params (signed URLs)
                backgroundImage: cover ? `url("${cover}")` : undefined,
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

/* ---------- helpers ---------- */

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
    fontWeight: 800,
    letterSpacing: 0.2,
    color: '#fff',
    background: 'rgba(255,255,255,0.14)',
    border: '1px solid rgba(255,255,255,0.18)',
    whiteSpace: 'nowrap',
  }
  if (v.includes('publish') || v.includes('public')) {
    return {
      ...base,
      background: 'rgba(34,197,94,0.18)',
      borderColor: 'rgba(34,197,94,0.28)',
    }
  }
  if (v.includes('draft') || v.includes('borr')) {
    return {
      ...base,
      background: 'rgba(250,204,21,0.14)',
      borderColor: 'rgba(250,204,21,0.25)',
    }
  }
  return base
}

function preloadImage(url: string) {
  return new Promise<boolean>(resolve => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

/* ================== STYLES (Lovable vibe) ================== */

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: `
    radial-gradient(900px 500px at 20% 10%, rgba(99,102,241,0.18), transparent 60%),
    radial-gradient(900px 500px at 80% 20%, rgba(236,72,153,0.16), transparent 55%),
    radial-gradient(900px 500px at 60% 90%, rgba(168,85,247,0.14), transparent 60%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 60%, #ffffff 100%)
  `,
  color: '#0f172a',
}

const topbar: React.CSSProperties = {
  padding: '28px 20px',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 14,
  position: 'sticky',
  top: 0,
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(14px)',
  borderBottom: '1px solid rgba(15,23,42,0.08)',
  zIndex: 10,
}

const actions: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const brandRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 30,
  letterSpacing: -0.6,
  lineHeight: 1.05,
}

const chip: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: 'rgba(255,255,255,0.9)',
}

const subtitle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  color: 'rgba(255,255,255,0.72)',
}

const grid: React.CSSProperties = {
  padding: '22px 20px 80px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: 18,
}

const card: React.CSSProperties = {
  height: 420,
  borderRadius: 24,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  position: 'relative',
  cursor: 'pointer',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
  backgroundColor: 'rgba(255,255,255,0.04)',
}

const overlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(to top, rgba(0,0,0,0.90) 18%, rgba(0,0,0,0.25) 62%, rgba(0,0,0,0.05) 100%)',
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
  fontSize: 24,
  fontWeight: 900,
  letterSpacing: -0.4,
}

const meta: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.72,
}

const noCover: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: '#fff',
}

const empty: React.CSSProperties = {
  minHeight: 'calc(100vh - 92px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
  textAlign: 'center',
  padding: 20,
  color: '#fff',
}

/**
 * Botón “Lovable-ish” rojizo/magenta con glow.
 * (es la paleta que estás pidiendo: rosa/rojo, no verde)
 */
const cta: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 8px 20px rgba(236,72,153,0.35)',
  transition: 'all 0.2s ease',
}
