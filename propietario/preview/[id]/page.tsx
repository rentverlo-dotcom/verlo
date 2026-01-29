import { createClient } from '@/lib/supabase/server'

export default async function OwnerPreview({ params }) {
  const supabase = createClient()

  const { data: property } = await supabase
    .from('properties')
    .select(`
      *,
      property_media (*)
    `)
    .eq('id', params.id)
    .single()

  if (!property) return null

  const mediaUrls = await Promise.all(
    property.property_media.map(async m => {
      const { data } = await supabase.storage
        .from('media')
        .createSignedUrl(m.url, 60 * 60)

      return data?.signedUrl
    })
  )

  return (
    <div className="min-h-screen bg-black flex justify-center p-6">
      <div className="w-full max-w-md bg-neutral-900 rounded-2xl overflow-hidden shadow-xl">
        
        {/* MEDIA */}
        <div className="h-96 overflow-x-scroll flex">
          {mediaUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              className="h-full w-full object-cover shrink-0"
            />
          ))}
        </div>

        {/* INFO */}
        <div className="p-6 space-y-2">
          <div className="text-xl font-semibold text-white">
            ${property.price?.toLocaleString()}
          </div>

          <p className="text-neutral-300 text-sm">
            {property.description}
          </p>

          <div className="flex gap-2 pt-4">
            <button className="button-secondary w-full">
              Editar
            </button>
            <button className="button-primary w-full">
              Publicar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
