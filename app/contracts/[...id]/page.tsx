'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Contract = {
  id: string
  status: 'draft' | 'ready_to_sign' | 'signed'
  content: string
  tenant_id: string
  owner_id: string
  signed_at: string | null
}

export default function ContractPage() {
  const { id } = useParams()
  const matchId = Array.isArray(id) ? id[0] : id
  const [contract, setContract] = useState<Contract | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)

 useEffect(() => {
  const load = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return
    setUserId(session.user.id)

   const res = await fetch(
  `/api/contracts/by-match/${matchId}`,
  {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  }
)

    if (!res.ok) {
  const text = await res.text()
  console.error('API ERROR:', res.status, text)
  setLoading(false)
  return
}

    const json = await res.json()
    setContract(json.contract)
    setLoading(false)
  }

  load()
}, [id])

  const isOwner = contract && userId === contract.owner_id
  const isTenant = contract && userId === contract.tenant_id

  const canOwnerSign =
    isOwner && contract?.status === 'ready_to_sign'

  // Tenant todavía NO firma ni paga en esta etapa
  const canTenantDoAnything = false

  const signAsOwner = async () => {
    if (!contract) return
    setSigning(true)

    await supabase
      .from('contracts')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
      })
      .eq('id', contract.id)

    const { data } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contract.id)
      .single()

    setContract(data)
    setSigning(false)
  }

  if (loading) {
    return <div className="p-8">Cargando contrato…</div>
  }

  if (!contract) {
    return <div className="p-8">Contrato no encontrado</div>
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">
          Contrato de alquiler
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Estado:{' '}
          <strong>
            {contract.status === 'ready_to_sign'
              ? 'Listo para firmar'
              : contract.status === 'signed'
              ? 'Firmado'
              : 'Borrador'}
          </strong>
        </p>
      </header>

      {/* CONTRATO */}
      <section
        className="prose max-w-none border rounded-lg p-6 bg-white"
        dangerouslySetInnerHTML={{ __html: contract.content }}
      />

      {/* ACCIONES */}
      <footer className="mt-8 flex justify-end">
        {canOwnerSign && (
          <button
            onClick={signAsOwner}
            disabled={signing}
            className="bg-black text-white px-6 py-3 rounded"
          >
            {signing ? 'Firmando…' : 'Firmar contrato'}
          </button>
        )}

        {isTenant && contract.status !== 'signed' && (
          <p className="text-sm text-gray-500">
            Esperando firma del propietario
          </p>
        )}

        {contract.status === 'signed' && (
          <p className="text-green-600 font-medium">
            Contrato firmado. Descarga e impresión habilitadas.
          </p>
        )}
      </footer>
    </main>
  )
}
