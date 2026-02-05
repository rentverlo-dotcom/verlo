import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin' // si no lo tenés, usá tu service role como ya haces en otros endpoints

export async function GET(
  _req: Request,
  { params }: { params: { name: string } }
) {
  const name = params.name

  // Solo permitimos los dos enums que existen en tu modelo
  if (!['property_type', 'contract_duration'].includes(name)) {
    return NextResponse.json({ error: 'Enum not allowed' }, { status: 400 })
  }

  // Lee valores del enum real en Postgres
  const sql = `
    select e.enumlabel as value
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = $1
    order by e.enumsortorder;
  `

  const { data, error } = await supabaseAdmin.rpc('sql', {
    query: sql,
    params: [name],
  })

  // Si vos no tenés rpc('sql'), decime qué helper usás para queries admin
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ values: (data || []).map((r: any) => r.value) })
}
