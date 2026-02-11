'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Match = {
  id: string
  status: string
  property_id: string
  demand_id: string
}

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single()

      if (data) setMatch(data)
      setLoading(false)
    }

    load()
  }, [id])

  if (loading) return <div className="p-8">Cargando match…</div>
  if (!match) return <div className="p-8">Match no encontrado</div>

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-semibold mb-6">
        Match
      </h1>

      <p className="mb-2">Estado: {match.status}</p>

      <div className="space-y-4 mt-6">

        <button
          onClick={() => router.push(`/matches/${id}/propose`)}
          className="w-full bg-black text-white py-3 rounded"
        >
          Proponer condiciones
        </button>

        <button
          onClick={() => router.push(`/matches/${id}/terms`)}
          className="w-full border border-black py-3 rounded"
        >
          Ver condiciones
        </button>

        <button
          onClick={() => router.push(`/contracts/${id}`)}
          className="w-full bg-green-600 text-white py-3 rounded"
        >
          Ver contrato
        </button>

      </div>
    </main>
  )
}
