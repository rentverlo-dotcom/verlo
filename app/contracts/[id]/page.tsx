'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Contract = {
  id: string
  match_id: string
  tenant_id: string
  owner_id: string
  created_at: string
  // agregá acá los campos reales que tengas
}

export default function ContractPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const loadContract = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('match_id', id)

      if (error) {
        console.error(error)
        setError('Error cargando contrato')
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setError('Contrato no encontrado')
        setLoading(false)
        return
      }

      setContract(data[0])
      setLoading(false)
    }

    loadContract()
  }, [id])

  if (loading) {
    return <div className="p-6">Cargando contrato…</div>
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>
  }

  if (!contract) {
    return <div className="p-6">Contrato no disponible</div>
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Contrato</h1>

      <div className="border rounded p-4">
        <p><strong>ID:</strong> {contract.id}</p>
        <p><strong>Match ID:</strong> {contract.match_id}</p>
        <p><strong>Inquilino:</strong> {contract.tenant_id}</p>
        <p><strong>Propietario:</strong> {contract.owner_id}</p>
        <p><strong>Creado:</strong> {new Date(contract.created_at).toLocaleString()}</p>
      </div>
    </div>
  )
}

