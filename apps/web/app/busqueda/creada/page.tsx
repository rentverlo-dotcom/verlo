'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Demand = {
  id: string
  city: string | null
  zone: string | null
  min_price: number | null
  max_price: number | null
  preferred_property_types: string[] | null
}

export default function BusquedaCreada() {
  const router = useRouter()
  const [demand, setDemand] = useState<Demand | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('demands')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        setDemand(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-neutral-300">
        Procesando tu búsqueda…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex justify-center pt-24 px-4">
      <div className="w-full max-w-xl bg-neutral-900 rounded-2xl p-8 shadow-xl space-y-6">

        <h1 className="text-2xl font-semibold text-white">
          Tu búsqueda está activa
        </h1>

        <p className="text-sm text-neutral-400">
          Estamos moviendo el algoritmo para encontrar propiedades que encajen
          con lo que buscás.  
          Apenas haya coincidencias, te vamos a enviar fichas directamente por
          WhatsApp.
        </p>

        <div className="bg-neutral-800 rounded-xl p-4 space-y-2 text-sm text-neutral-300">
          <p><strong>Ciudad:</strong> {demand?.city ?? '—'}</p>
          <p><strong>Barrio:</strong> {demand?.zone ?? '—'}</p>
          <p>
            <strong>Presupuesto:</strong>{' '}
            {demand?.min_price} – {demand?.max_price}
          </p>
          <p>
            <strong>Tipo:</strong>{' '}
            {demand?.preferred_property_types?.join(', ') ?? '—'}
          </p>
        </div>

        <p className="text-xs text-neutral-500">
          Mientras tanto, podés explorar propiedades disponibles o crear una
          nueva búsqueda.
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <button
            className="button-primary"
            onClick={() => router.push('/buscar')}
          >
            Crear nueva búsqueda
          </button>

          <button
            className="button-secondary"
            onClick={() => router.push('/propiedades')}
          >
            Ver propiedades disponibles
          </button>
        </div>
      </div>
    </div>
  )
}
