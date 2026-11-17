import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

// The old implementation read a hardcoded QA tenant with the service role.
// This endpoint now resolves the tenant only from a verified Supabase session.
export async function GET(request: NextRequest) {
  const bearer = request.headers.get('authorization') || ''
  if (!bearer.startsWith('Bearer ')) return reply({ error: 'No autorizado' }, 401)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return reply({ error: 'Servicio no disponible' }, 503)

  const auth = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error: authError } = await auth.auth.getUser(bearer.slice(7).trim())
  if (authError || !data.user) return reply({ error: 'No autorizado' }, 401)

  // Ownership filter must be applied before reading the private saved list.
  const { data: likes, error } = await supabaseAdmin
    .from('property_likes')
    .select(`
      property_id,
      properties (
        id, title, short_description, address, price,
        property_media (url, position, type)
      )
    `)
    .eq('tenant_id', data.user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return reply({ error: 'No pudimos consultar tus guardadas' }, 503)

  const properties = (likes || []).flatMap(row => {
    const property = Array.isArray(row.properties) ? row.properties[0] : row.properties
    if (!property) return []
    const media = Array.isArray(property.property_media) ? property.property_media : []
    const cover = media.filter((m: { type: string; url: string | null }) =>
      m.type === 'photo' && Boolean(m.url)).sort(
      (a: { position: number | null }, b: { position: number | null }) =>
        (a.position ?? 999) - (b.position ?? 999),
    )[0]
    return [{
      id: property.id,
      title: property.title || 'Propiedad guardada',
      short_description: property.short_description || '',
      address: property.address || '',
      price: property.price,
      cover_url: cover?.url || '/placeholder.jpg',
    }]
  })
  return reply(properties)
}
