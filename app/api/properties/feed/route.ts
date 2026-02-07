import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// helpers
function sanitizeText(text: string | null): string | null {
  if (!text) return null

  // si parece código, a la mierda
  const banned = ['import ', 'useEffect', 'from(', 'export default', '<div', 'function ']
  if (banned.some(b => text.includes(b))) return null

  return text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 140)
}

function isVideo(url: string) {
  return url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm')
}

function toPublicUrl(path: string) {
  if (path.startsWith('http')) return path

  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(path)

  return data.publicUrl
}

export async function GET() {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      id,
      title,
      city,
      zone,
      price,
      currency,
      short_description,
      property_media (
        url,
        position,
        type
      )
    `)
    .eq('available', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const normalized = (data ?? []).map((p: any) => {
    const media = (p.property_media ?? [])
      .filter((m: any) => m.type === 'photo' && m.url)
      .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999))

    let coverUrl: string | null = null

    if (media.length > 0) {
      const raw = media[0].url
      if (!isVideo(raw)) {
        coverUrl = toPublicUrl(raw)
      }
    }

    return {
      id: p.id,
      title: p.title ?? 'Propiedad en alquiler',
      city: p.city ?? null,
      zone: p.zone ?? null,
      price: p.price ?? null,
      currency: p.currency ?? 'ARS',
      cover_url: coverUrl,
      short_description: sanitizeText(p.short_description),
    }
  })

  return NextResponse.json(normalized)
}
