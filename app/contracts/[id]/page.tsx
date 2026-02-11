'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Contract = {
  id: string
  match_id: string
  tenant_id: string
  owner_id: string
  status: string
  content: string | null
  created_at: string
  signed_at: string | null
}

export default function ContractPage() {
  const { id } = useParams<{ id: string }>()

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
        .single()

      if (error) {
        console.error(error)
        setError('Error cargando contrato')
        setLoading(false)
        return
      }

      setContract(data)
      setLoading(false)
    }

    loadContract()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando contrato…
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex items-center justify-center">
        {error || 'Contrato no encontrado'}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-8">

        <h1 className="text-4xl font-bold">Contrato de Locación</h1>

        <div className="text-sm text-neutral-400">
          Estado: <span className="font-medium">{contract.status}</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 leading-relaxed space-y-4 text-neutral-200">

          {contract.content ? (
            <div
              dangerouslySetInnerHTML={{ __html: contract.content }}
            />
          ) : (
            <div className="space-y-4">
              <p>
                Entre el propietario identificado como <strong>{contract.owner_id}</strong>,
                en adelante “EL LOCADOR”, y el inquilino identificado como
                <strong> {contract.tenant_id}</strong>, en adelante “EL LOCATARIO”,
                se celebra el presente contrato de locación.
              </p>

              <p>
                El contrato tiene por objeto la locación del inmueble asociado al
                match <strong>{contract.match_id}</strong>.
              </p>

              <p>
                El presente contrato fue generado digitalmente a través de la
                plataforma VERLO.
              </p>

              <p>
                Fecha de creación: {new Date(contract.created_at).toLocaleString()}
              </p>
            </div>
          )}

        </div>

        {contract.status === 'ready_to_sign' && (
          <button className="w-full bg-white text-black py-4 rounded-xl font-semibold">
            Firmar contrato
          </button>
        )}

        {contract.status === 'signed' && (
          <div className="bg-green-900 border border-green-700 rounded-xl p-4 text-green-300">
            Contrato firmado el{' '}
            {contract.signed_at
              ? new Date(contract.signed_at).toLocaleString()
              : '—'}
          </div>
        )}

      </div>
    </div>
  )
}
