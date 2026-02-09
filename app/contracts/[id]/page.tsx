'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Contract = {
  id: string
  match_id: string
  status: 'draft' | 'ready_to_sign' | 'signed'
  content: string
  tenant_id: string
  owner_id: string
  signed_at: string | null
}

export default function ContractPage() {
  const { id } = useParams() // id = match_id
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('match_id', id)
        .single()

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      setContract(data)
      setLoading(false)
    }

    load()
  }, [id])

  if (loading) {
    return <div className="p-8">Cargando contrato…</div>
  }

  if (!contract) {
    return <div className="p-8">Contrato no encontrado</div>
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-4">
        Contrato de alquiler
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Estado:{' '}
        <strong>
          {contract.status === 'ready_to_sign'
            ? 'Listo para firmar'
            : contract.status === 'signed'
            ? 'Firmado'
            : 'Borrador'}
        </strong>
      </p>

      <section
        className="prose max-w-none border rounded-lg p-6 bg-white"
        dangerouslySetInnerHTML={{ __html: contract.content }}
      />
    </main>
  )
}

