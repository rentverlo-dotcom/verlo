// app/propiedades/[id]/page.tsx
import { createClient } from '@supabase/supabase-js'

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!property) return <div>No existe</div>

  const { data: media } = await supabase
    .from('property_media')
    .select('*')
    .eq('property_id', params.id)
    .order('position')

  const mediaUrls =
    media?.map(m =>
      supabase.storage
        .from('media')
        .getPublicUrl(m.url).data.publicUrl
    ) ?? []

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>
        {property.property_type} – ${property.price}
      </h1>

      <p style={{ opacity: 0.7 }}>
        {property.city} · {property.zone}
      </p>

      {mediaUrls.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
            marginTop: 24,
          }}
        >
          {mediaUrls.map(url => (
            <img
              key={url}
              src={url}
              style={{
                width: '100%',
                height: 160,
                objectFit: 'cover',
                borderRadius: 8,
              }}
            />
          ))}
        </div>
      )}

      <pre style={{ marginTop: 32, opacity: 0.6 }}>
        {JSON.stringify(property, null, 2)}
      </pre>
    </div>
  )
}
