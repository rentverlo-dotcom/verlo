// app/propiedades/[id]/page.tsx
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // 🔹 Traemos propiedad + media en una sola query
  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_media (
        id,
        url,
        type,
        position
      )
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (!property || error) {
    return <div>No existe</div>
  }

  // 🔹 URLs públicas del storage
  const mediaUrls =
    property.property_media?.map(m =>
      supabase.storage
        .from('property-media') // ⚠️ asegurate que este sea el bucket real
        .getPublicUrl(m.url).data.publicUrl
    ) ?? []

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>
        {property.property_type} – ${property.price}
      </h1>

      <p style={{ opacity: 0.7 }}>
        {property.city ?? ''} {property.zone ?? ''}
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

