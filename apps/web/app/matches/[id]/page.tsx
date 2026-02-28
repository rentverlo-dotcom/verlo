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

type Profile = {
  id: string
  role: 'tenant' | 'owner' | 'both'
}

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [match, setMatch] = useState<Match | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return

    async function load() {
      setLoading(true)

      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

      if (profileData) setProfile(profileData)

      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single()

      if (matchData) setMatch(matchData)

      setLoading(false)
    }

    load()
  }, [id, router])

  async function scheduleVisit() {
    if (!match) return
    setSubmitting(true)

    const { error } = await supabase.rpc(
      'transition_match_status',
      {
        p_match_id: match.id,
        p_new_status: 'visit_scheduled',
      }
    )

    if (error) {
      alert(error.message)
    } else {
      alert('Visita habilitada')
      router.refresh()
    }

    setSubmitting(false)
  }

  if (loading) return <div className="p-8">Cargando match…</div>
  if (!match) return <div className="p-8">Match no encontrado</div>

  const isOwner = profile?.role === 'owner' || profile?.role === 'both'
  const isTenant = profile?.role === 'tenant' || profile?.role === 'both'

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-semibold mb-6">
        Match
      </h1>

      <p className="mb-2">Estado: {match.status}</p>

      <div className="space-y-4 mt-6">

        {/* OWNER — Revisar garantía */}
        {isOwner && match.status === 'approved' && (
          <button
            onClick={() => router.push(`/matches/${id}/review`)}
            className="w-full bg-blue-600 text-white py-3 rounded"
          >
            Revisar garantía
          </button>
        )}

        {/* OWNER — Coordinar visita (solo cuando garantía ya fue aprobada) */}
        {isOwner && match.status === 'approved' && (
          <button
            onClick={scheduleVisit}
            disabled={submitting}
            className="w-full bg-green-600 text-white py-3 rounded"
          >
            {submitting ? 'Procesando…' : 'Coordinar visita'}
          </button>
        )}

        {/* TENANT — Ver / aceptar condiciones */}
        {isTenant && match.status === 'visit_scheduled' && (
          <button
            onClick={() => router.push(`/matches/${id}/terms`)}
            className="w-full border border-black py-3 rounded"
          >
            Ver condiciones
          </button>
        )}

        {/* Ambos — Ver contrato */}
        {(match.status === 'contract_started' ||
          match.status === 'signed') && (
          <button
            onClick={() => {
              alert('Contrato aún no integrado con Truora')
            }}
            className="w-full bg-green-600 text-white py-3 rounded"
          >
            Ver contrato
          </button>
        )}

      </div>
    </main>
  )
}
