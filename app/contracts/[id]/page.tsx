'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

type LegalData = {
  first_name: string
  last_name: string
  dni: string
  address: string
  city: string
  province: string
  country: string
}

export default function ContractPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [contract, setContract] = useState<Contract | null>(null)
  const [tenantData, setTenantData] = useState<LegalData | null>(null)
  const [ownerData, setOwnerData] = useState<LegalData | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const loadContract = async () => {
      setLoading(true)
      setError(null)

      // 1️⃣ Obtener usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      // 2️⃣ Verificar legal data del usuario actual
      const { data: legalData } = await supabase
        .from('user_contract_data')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!legalData) {
        router.push(`/contracts/${id}/legal-data`)
        return
      }

      // 3️⃣ Cargar contrato
      const { data: contractData, error } = await supabase
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

      setContract(contractData)

      // 4️⃣ Cargar datos legales de ambas partes
      const { data: tenantLegal } = await supabase
        .from('user_contract_data')
        .select('*')
        .eq('user_id', contractData.tenant_id)
        .single()

      const { data: ownerLegal } = await supabase
        .from('user_contract_data')
        .select('*')
        .eq('user_id', contractData.owner_id)
        .single()

      setTenantData(tenantLegal)
      setOwnerData(ownerLegal)

      setLoading(false)
    }

    loadContract()
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando contrato…
      </div>
    )
  }

  if (error || !contract || !tenantData || !ownerData) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex items-center justify-center">
        {error || 'Contrato incompleto'}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-10">

        <h1 className="text-5xl font-bold">
          CONTRATO DE LOCACIÓN DE VIVIENDA
        </h1>

        <div className="text-sm text-neutral-400">
          Estado: {contract.status}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 space-y-6 text-neutral-200 leading-relaxed text-[15px]">

          <p>
            En la República Argentina, a la fecha de generación digital del presente,
            entre <strong>{ownerData.first_name} {ownerData.last_name}</strong>,
            DNI {ownerData.dni}, con domicilio en {ownerData.address},
            {ownerData.city}, {ownerData.province}, en adelante "EL LOCADOR",
            y <strong>{tenantData.first_name} {tenantData.last_name}</strong>,
            DNI {tenantData.dni}, con domicilio en {tenantData.address},
            {tenantData.city}, {tenantData.province}, en adelante
            "EL LOCATARIO", se celebra el presente contrato de locación.
          </p>

          <h2 className="text-xl font-semibold">PRIMERA — OBJETO</h2>
          <p>
            EL LOCADOR da en locación al LOCATARIO el inmueble vinculado al match
            {contract.match_id}, destinado exclusivamente a vivienda.
          </p>

          <h2 className="text-xl font-semibold">SEGUNDA — PLAZO</h2>
          <p>
            El contrato tendrá una duración de 24 meses conforme legislación vigente.
          </p>

          <h2 className="text-xl font-semibold">TERCERA — PRECIO</h2>
          <p>
            El canon locativo mensual será el acordado en condiciones previas
            aceptadas por ambas partes.
          </p>

          <h2 className="text-xl font-semibold">CUARTA — DEPÓSITO</h2>
          <p>
            Se entrega en concepto de depósito en garantía una suma equivalente
            a un mes de alquiler.
          </p>

          <h2 className="text-xl font-semibold">QUINTA — ACTUALIZACIÓN</h2>
          <p>
            El valor del alquiler podrá actualizarse conforme índice legal
            aplicable según normativa vigente al momento de la firma.
          </p>

          <h2 className="text-xl font-semibold">SEXTA — JURISDICCIÓN</h2>
          <p>
            Para cualquier controversia, las partes se someten a los tribunales
            ordinarios de la jurisdicción correspondiente al inmueble.
          </p>

          <p>
            El presente contrato fue generado digitalmente mediante la plataforma VERLO.
          </p>

          <p>
            Fecha de creación digital: {new Date(contract.created_at).toLocaleString()}
          </p>

        </div>

        {contract.status === 'ready_to_sign' && (
          <button className="w-full bg-white text-black py-4 rounded-xl font-semibold text-lg">
            Firmar contrato
          </button>
        )}

        {contract.status === 'signed' && (
          <div className="bg-green-900 border border-green-700 rounded-xl p-6 text-green-300">
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
