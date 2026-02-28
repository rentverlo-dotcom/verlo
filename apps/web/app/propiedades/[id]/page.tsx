'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type MediaItem = {
  id: string
  url: string
  type: 'photo' | 'video' | 'pdf'
  position: number
}

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Departamento',
  house: 'Casa',
  ph: 'PH',
  room: 'Habitacion',
  local: 'Local',
}

export default function PropertyPage() {
  const params = useParams<{ id: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [loading, setLoading] = useState(true)
  const [property, setProperty] = useState<any>(null)
  const [mediaUrls, setMediaUrls] = useState<{ url: string; type: string }[]>([])
  const [currentImg, setCurrentImg] = useState(0)

  useEffect(() => {
    if (!id) return

    async function load() {
      setLoading(true)

      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

      if (propertyError || !propertyData) {
        setProperty(null)
        setLoading(false)
        return
      }

      // Owner can see even if not published
      if (user && propertyData.owner_id === user.id) {
        setProperty(propertyData)
        await loadMedia(id)
        setLoading(false)
        return
      }

      // Public: only if published
      if (propertyData.publish_status === 'published') {
        setProperty(propertyData)
        await loadMedia(id)
        setLoading(false)
        return
      }

      setProperty(null)
      setLoading(false)
    }

    async function loadMedia(propertyId: string) {
      const { data: mediaData } = await supabase
        .from('property_media')
        .select('*')
        .eq('property_id', propertyId)
        .order('position')

      if (mediaData?.length) {
        const signed = await Promise.all(
          mediaData.map(async (m: MediaItem) => {
            const { data } = await supabase.storage
              .from('media')
              .createSignedUrl(m.url, 3600)
            if (!data) return null
            return { url: data.signedUrl, type: m.type }
          })
        )
        setMediaUrls(signed.filter(Boolean) as { url: string; type: string }[])
      }
    }

    load()
  }, [id])

  const photos = mediaUrls.filter(m => m.type === 'photo')
  const videos = mediaUrls.filter(m => m.type === 'video')

  const goNext = () => setCurrentImg(i => (i + 1) % photos.length)
  const goPrev = () => setCurrentImg(i => (i - 1 + photos.length) % photos.length)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        Cargando...
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        Propiedad no encontrada
      </div>
    )
  }

  const typeLabel = TYPE_LABELS[property.property_type || ''] || property.property_type || ''

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* GALLERY */}
      {photos.length > 0 && (
        <div className="relative w-full" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: 520, borderRadius: '0 0 18px 18px' }}>
            <img
              src={photos[currentImg]?.url}
              alt={`Foto ${currentImg + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Counter */}
            <div
              style={{
                position: 'absolute', bottom: 16, right: 16,
                background: 'rgba(0,0,0,0.7)', borderRadius: 8,
                padding: '6px 14px', fontSize: 14, color: '#fff',
              }}
            >
              {currentImg + 1} / {photos.length}
            </div>

            {/* Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  aria-label="Foto anterior"
                  style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', border: 'none',
                    color: '#fff', fontSize: 22, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {'<'}
                </button>
                <button
                  onClick={goNext}
                  aria-label="Foto siguiente"
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', border: 'none',
                    color: '#fff', fontSize: 22, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {'>'}
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0' }}>
              {photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImg(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  style={{
                    width: 72, height: 52, flexShrink: 0, borderRadius: 8,
                    overflow: 'hidden', cursor: 'pointer', padding: 0,
                    border: i === currentImg ? '2px solid var(--accent)' : '2px solid transparent',
                    opacity: i === currentImg ? 1 : 0.5,
                    background: 'none', transition: 'opacity 0.2s, border-color 0.2s',
                  }}
                >
                  <img
                    src={p.url}
                    alt={`Thumbnail ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENT */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
          {/* LEFT COLUMN */}
          <div style={{ flex: '1 1 600px', minWidth: 0 }}>
            {/* Price + Type */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
                ${property.price?.toLocaleString('es-AR')}
                <span style={{ fontSize: 18, fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>/mes</span>
              </h1>
              {typeLabel && (
                <span style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 14px', fontSize: 14, fontWeight: 600,
                }}>
                  {typeLabel}
                </span>
              )}
            </div>

            {/* Location */}
            {(property.city || property.zone) && (
              <p style={{ marginTop: 8, fontSize: 16, color: 'var(--muted)' }}>
                {[property.zone, property.city].filter(Boolean).join(', ')}
              </p>
            )}

            {/* Feature chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
              {property.sqm && (
                <span style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 18px', fontSize: 15,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 3v18"/></svg>
                  {property.sqm} m2
                </span>
              )}
              {property.furnished && (
                <span style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 18px', fontSize: 15,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/><path d="M4 18v2"/><path d="M20 18v2"/></svg>
                  Amueblado
                </span>
              )}
              {property.pets_allowed && (
                <span style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 18px', fontSize: 15,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M12 12c-2.5 0-4.5 1.5-5.5 3.5-.7 1.4-.5 3 .5 4 1.2 1.1 3 1.5 5 1.5s3.8-.4 5-1.5c1-1 1.2-2.6.5-4-1-2-3-3.5-5.5-3.5z"/></svg>
                  Acepta mascotas
                </span>
              )}
            </div>

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '32px 0' }} />

            {/* Description */}
            {(property.description || property.short_description) && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Descripcion</h2>
                <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>
                  {property.description || property.short_description}
                </p>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div style={{ marginTop: 40 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Video</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {videos.map((v, i) => (
                    <video
                      key={i}
                      controls
                      style={{
                        width: '100%', maxHeight: 400, borderRadius: 12,
                        background: '#000', objectFit: 'contain',
                      }}
                    >
                      <source src={v.url} />
                    </video>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Contact card */}
          <div style={{ flex: '0 0 320px' }}>
            <div
              style={{
                position: 'sticky', top: 100,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 18, padding: 28,
              }}
            >
              <p style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                ${property.price?.toLocaleString('es-AR')}
                <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--muted)' }}> /mes</span>
              </p>
              {typeLabel && (
                <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>
                  {typeLabel}{property.sqm ? ` - ${property.sqm} m2` : ''}
                </p>
              )}
              {(property.city || property.zone) && (
                <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>
                  {[property.zone, property.city].filter(Boolean).join(', ')}
                </p>
              )}
              <button
                className="button-primary"
                onClick={() => {
                  window.location.href = `/matches?property_id=${id}`
                }}
              >
                Me interesa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
