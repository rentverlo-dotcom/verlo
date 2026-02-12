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
        setError('Contrato no encontrado')
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
      <div className="min-h-screen flex items-center justify-center">
        Cargando contrato…
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error || 'Contrato no disponible'}
      </div>
    )
  }
return (
  <div className="min-h-screen bg-white text-black py-16 px-6">
    <div className="max-w-[794px] mx-auto">

      {/* Encabezado */}
      <div className="text-center space-y-2 mb-10">
        <h1 className="text-2xl tracking-wide font-semibold uppercase">
          Contrato de Locación
        </h1>
        <p className="text-sm text-neutral-600">
          República Argentina
        </p>
        <div className="border-t border-black mt-4"></div>
      </div>

      {/* Estado discreto */}
      <div className="flex justify-end mb-6 text-sm text-neutral-700">
        Estado: <span className="ml-2 font-medium uppercase">{contract.status}</span>
      </div>

      {/* Cuerpo */}
      <div
        className="text-[15px] leading-[1.8] space-y-6"
        style={{
          fontFamily: 'Georgia, Times New Roman, serif',
          textAlign: 'justify',
        }}
      >

        <p>
          En la República Argentina, a los {new Date().toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}, entre{" "}
          <strong>{contract.owner_id}</strong>, en adelante “EL LOCADOR”, y{" "}
          <strong>{contract.tenant_id}</strong>, en adelante “EL LOCATARIO”, se celebra el presente contrato de locación.
        </p>

        <p>
          <strong>PRIMERA — OBJETO.</strong>  
          EL LOCADOR da en locación al LOCATARIO el inmueble vinculado al match{" "}
          <strong>{contract.match_id}</strong>, destinado al uso acordado entre las partes.
        </p>

        <p>
          <strong>SEGUNDA — PLAZO.</strong>  
          El presente contrato tendrá la duración acordada conforme a las condiciones previamente aceptadas por ambas partes.
        </p>

        <p>
          <strong>TERCERA — PRECIO.</strong>  
          El canon locativo mensual será el pactado en los términos aceptados, pagadero en tiempo y forma conforme lo estipulado.
        </p>

        <p>
          <strong>CUARTA — DEPÓSITO.</strong>  
          El LOCATARIO entrega en concepto de depósito en garantía la suma equivalente a un período locativo, conforme lo acordado.
        </p>

        <p>
          <strong>QUINTA — ACTUALIZACIÓN.</strong>  
          El precio podrá actualizarse conforme índice legal vigente al momento de la firma, respetando la normativa aplicable.
        </p>

        <p>
          <strong>SEXTA — JURISDICCIÓN.</strong>  
          Para cualquier controversia derivada del presente, las partes se someten a los tribunales ordinarios de la jurisdicción correspondiente al inmueble.
        </p>

        <p className="mt-10">
          El presente contrato fue generado digitalmente mediante la plataforma VERLO.
        </p>

        <p className="text-sm text-neutral-600">
          Fecha de generación digital:{" "}
          {new Date(contract.created_at).toLocaleString()}
        </p>
      </div>

      {/* Firmas */}
      <div className="mt-20 grid grid-cols-2 gap-20 text-center text-sm">
        <div>
          <div className="border-t border-black pt-3">
            EL LOCADOR
          </div>
        </div>
        <div>
          <div className="border-t border-black pt-3">
            EL LOCATARIO
          </div>
        </div>
      </div>

      {/* Acción sobria */}
      {contract.status === 'ready_to_sign' && (
        <div className="mt-16 flex justify-center">
          <button className="border border-black px-8 py-3 text-sm tracking-wide hover:bg-black hover:text-white transition">
            Firmar contrato
          </button>
        </div>
      )}

      {contract.status === 'signed' && (
        <div className="mt-16 text-center text-green-700 font-medium">
          ✔ Contrato firmado el{" "}
          {contract.signed_at
            ? new Date(contract.signed_at).toLocaleString()
            : ''}
        </div>
      )}
    </div>
  </div>
)
}
