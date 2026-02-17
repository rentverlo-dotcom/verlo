'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Contract = {
  id: string
  status: string
  content: string
  tenant_id: string
  owner_id: string
  tenant_signature: string | null
  owner_signature: string | null
  signed_at: string | null
  contract_hash: string | null
}

export default function ContractPage() {
  const { id } = useParams<{ id: string }>()
  const [contract, setContract] = useState<Contract | null>(null)

  useEffect(() => {
    if (!id) return
    load()
  }, [id])

  async function load() {
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single()

    if (data) setContract(data)
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando contrato…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black py-16 px-6">
      <div className="max-w-[794px] mx-auto space-y-10">

        {/* Contenido del contrato */}
        <div
          className="text-[15px] leading-[1.8]"
          style={{
            fontFamily: 'Georgia, serif',
            whiteSpace: 'pre-wrap',
          }}
        >
          {contract.content}
        </div>

        {/* Estado firmas */}
        {contract.status === 'ready_to_sign' && (
          <div className="space-y-4 text-sm border-t pt-6">

            {contract.tenant_signature ? (
              <div className="text-green-600">
                ✔ Firmado por inquilino
              </div>
            ) : (
              <div className="text-neutral-500">
                Pendiente firma inquilino
              </div>
            )}

            {contract.owner_signature ? (
              <div className="text-green-600">
                ✔ Firmado por propietario
              </div>
            ) : (
              <div className="text-neutral-500">
                Pendiente firma propietario
              </div>
            )}
          </div>
        )}

        {/* Contrato firmado */}
        {contract.status === 'signed' && (
          <div className="border border-green-700 p-6 rounded-xl bg-green-50 text-center space-y-3">
            <div className="text-green-700 font-semibold text-lg">
              ✔ CONTRATO FIRMADO DIGITALMENTE
            </div>

            {contract.signed_at && (
              <div className="text-sm text-neutral-700">
                Fecha: {new Date(contract.signed_at).toLocaleString()}
              </div>
            )}

            {contract.contract_hash && (
              <div className="text-xs text-neutral-600 break-all">
                Hash de integridad: {contract.contract_hash}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
