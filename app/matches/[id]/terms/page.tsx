'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type MatchTerms = {
  id: string
  price: number
  deposit: number
  expenses_included: boolean
  start_date: string
  end_date: string
  duration_months: number
  locked: boolean
  accepted_by: string | null
}

export default function MatchTermsPage() {
  const { id: matchId } = useParams()
  const router = useRouter()
  const [terms, setTerms] = useState<MatchTerms | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('match_terms')
        .select('*')
        .eq('match_id', matchId)
        .single()

      if (!error) setTerms(data)
      setLoading(false)
    }

    load()
  }, [matchId])

  async function acceptTerms() {
    setSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('match_terms')
      .update({
        accepted_by: user.id,
      })
      .eq('match_id', matchId)

    if (!error) {
      router.push('/matches')
    }

    setSubmitting(false)
  }

  if (loading) return <div className="p-8">Cargando términos…</div>
  if (!terms) return <div className="p-8 text-red-600">No hay términos</div>

  if (terms.locked)
    return (
      <div className="p-8">
        <p>Estos términos ya fueron aceptados.</p>
      </div>
    )

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6">
        Condiciones finales del alquiler
      </h1>

      <ul className="space-y-3 text-sm">
        <li>Precio mensual: ${terms.price}</li>
        <li>Depósito: ${terms.deposit}</li>
        <li>Inicio: {terms.start_date}</li>
        <li>Fin: {terms.end_date}</li>
        <li>Duración: {terms.duration_months} meses</li>
        <li>
          Gastos incluidos:{' '}
          {terms.expenses_included ? 'Sí' : 'No'}
        </li>
      </ul>

      <button
        onClick={acceptTerms}
        disabled={submitting}
        className="mt-8 w-full bg-black text-white py-3 rounded"
      >
        {submitting
          ? 'Aceptando…'
          : 'Aceptar condiciones y continuar'}
      </button>
    </main>
  )
}
