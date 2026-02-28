//app/api/properties/feed/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// helpers
function sanitizeText(text: string | null): string | null {
  if (!text) return null

  const banned = ['import ', 'useEffect', 'export default', '<div', 'function ']
  if (banned.some(b => text.includes(b))) return null

  return text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 140)
}

function isVideo(url: string) {
  return url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm')
}

export async function GET(req: Request) {
  // 🔐 AUTH VIA HEADER (OBLIGATORIO)
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 🎯 FEED REAL: SOLO LO SWIPEABLE PARA ESTE TENANT
  const { data, error } = await supabase
    .from('properties_visible_to_tenant')
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
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const normalized = (data ?? [])
    .map((p: any) => {
      const media = (p.property_media ?? [])
        .filter((m: any) => m.type === 'photo' && m.url && !isVideo(m.url))
        .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999))

      if (media.length === 0) return null
      if (!p.price) return null

      return {
        id: p.id,
        title: p.title ?? 'Propiedad en alquiler',
        city: p.city ?? null,
        zone: p.zone ?? null,
        price: p.price,
        currency: p.currency ?? 'ARS',
        cover_url: media[0].url,
        short_description: sanitizeText(p.short_description),
      }
    })
    .filter(Boolean)

  return NextResponse.json(normalized)
}
