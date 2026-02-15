'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import ContractSignature from '@/components/ContractSignature'

type Contract = {
  id: string
  status: string
  content: string
  tenant_id: string
  owner_id: string
  tenant_signature: string | null
  owner_signature: string | null
  signed_at: string | null
  hash: string | null
}

export default function ContractPage() {
  const { id } = useParams<{ id: string }>()
  const [contract, setContract] = useState<Contract | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    setUserId(auth.user.id)

    const { data } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single()

    if (data) setContract(data)
  }

  async function handleSign(signature: string) {
    const res = await fetch('/api/contracts/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contract_id: id,
        signature,
      }),
    })

    if (res.ok) {
      await load()
    } else {
      alert('Error al firmar')
    }
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando contrato…
      </div>
    )
  }

  const isTenant = userId === contract.tenant_id
  const isOwner = userId === contract.owner_id

  return (
    <div className="min-h-screen bg-white text-black py-16 px-6">
      <div className="max-w-[794px] mx-auto space-y-10">

        <div
          className="text-[15px] leading-[1.8]"
          style={{
            fontFamily: 'Georgia, serif',
            whiteSpace: 'pre-wrap',
          }}
        >
          {contract.content}
        </div>

        {/* Estado parcial */}
        {contract.status === 'ready_to_sign' && (
          <div className="space-y-4 text-sm">

            {contract.tenant_signature && (
              <div className="text-green-600">
                ✔ Firmado por inquilino
              </div>
            )}

            {contract.owner_signature && (
              <div className="text-green-600">
                ✔ Firmado por propietario
              </div>
            )}

            {/* Firma si aún no firmó */}
            {isTenant && !contract.tenant_signature && (
              <ContractSignature onSign={handleSign} />
            )}

            {isOwner && !contract.owner_signature && (
              <ContractSignature onSign={handleSign} />
            )}
          </div>
        )}

        {/* Sello final */}
        {contract.status === 'signed' && (
          <div className="border border-green-700 p-6 rounded-xl bg-green-50 text-center space-y-3">
            <div className="text-green-700 font-semibold text-lg">
              ✔ CONTRATO FIRMADO DIGITALMENTE
            </div>

            <div className="text-sm text-neutral-700">
              Fecha: {new Date(contract.signed_at!).toLocaleString()}
            </div>

            <div className="text-xs text-neutral-600 break-all">
              Hash de integridad: {contract.hash}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
