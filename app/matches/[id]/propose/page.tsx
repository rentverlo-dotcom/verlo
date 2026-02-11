'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function ProposeTermsPage() {
  const { id: matchId } = useParams<{ id: string }>()
  const router = useRouter()

  const [price, setPrice] = useState('')
  const [deposit, setDeposit] = useState('')
  const [duration, setDuration] = useState(12)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('match_terms').insert({
      match_id: matchId,
      price: Number(price),
      deposit: Number(deposit),
      duration_months: duration,
      start_date: startDate,
      end_date: endDate,
      proposed_by: user.id,
    })

    router.push(`/matches/${matchId}/terms`)
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6">
        Proponer condiciones
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="number"
          placeholder="Precio mensual"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="w-full border p-3 rounded"
          required
        />

        <input
          type="number"
          placeholder="Depósito"
          value={deposit}
          onChange={e => setDeposit(e.target.value)}
          className="w-full border p-3 rounded"
          required
        />

        <input
          type="number"
          placeholder="Duración en meses"
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className="w-full border p-3 rounded"
          required
        />

        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="w-full border p-3 rounded"
          required
        />

        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="w-full border p-3 rounded"
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black text-white py-3 rounded"
        >
          {submitting ? 'Guardando…' : 'Enviar condiciones'}
        </button>

      </form>
    </main>
  )
}
