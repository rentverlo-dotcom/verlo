// app/propiedades/[id]/page.tsx
import { createClient } from '@supabase/supabase-js'

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!data) return <div>No existe</div>

  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  )
}
