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
  created_at: string
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

type Terms = {
  price: number
  deposit: number
  start_date: string
  end_date: string
  duration_months: number
}

export default function ContractPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [contract, setContract] = useState<Contract | null>(null)
  const [tenantData, setTenantData] = useState<LegalData | null>(null)
  const [ownerData, setOwnerData] = useState<LegalData | null>(null)
  const [terms, setTerms] = useState<Terms | null>(null)
  const [propertyAddress, setPropertyAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      setLoading(true)

      const { data: contractData } = await supabase
        .from('contracts')
        .select('*')
        .eq('match_id', id)
        .single()

      if (!contractData) {
        setLoading(false)
        return
      }

      setContract(contractData)

      const { data: match } = await supabase
        .from('matches')
        .select('property_id, demand_id')
        .eq('id', id)
        .single()

      const { data: propertyPrivate } = await supabase
        .from('property_private')
        .select('address')
        .eq('property_id', match.property_id)
        .single()

      setPropertyAddress(propertyPrivate?.address || '')

      const { data: termsData } = await supabase
        .from('match_terms')
        .select('*')
        .eq('match_id', id)
        .single()

      setTerms(termsData)

      const { data: ownerLegal } = await supabase
        .from('user_contract_data')
        .select('*')
        .eq('user_id', contractData.owner_id)
        .single()

      const { data: tenantLegal } = await supabase
        .from('user_contract_data')
        .select('*')
        .eq('user_id', contractData.tenant_id)
        .single()

      setOwnerData(ownerLegal)
      setTenantData(tenantLegal)

      setLoading(false)
    }

    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center">
        Cargando contrato...
      </div>
    )
  }

  if (!contract || !tenantData || !ownerData || !terms) {
    return (
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center text-red-600">
        Contrato incompleto
      </div>
    )
  }

  const today = new Date().toLocaleDateString('es-AR')

  return (
    <div className="min-h-screen bg-neutral-300 py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl p-16 text-black leading-relaxed text-[15px]">

        <h1 className="text-center text-2xl font-bold mb-10 uppercase">
          CONTRATO DE LOCACIÓN DE INMUEBLE
        </h1>

        <p className="mb-6">
          En la República Argentina, a los {today}, entre{' '}
          <strong>
            {ownerData.first_name} {ownerData.last_name}
          </strong>, DNI {ownerData.dni}, con domicilio en{' '}
          {ownerData.address}, {ownerData.city}, {ownerData.province},
          en adelante "EL LOCADOR", y{' '}
          <strong>
            {tenantData.first_name} {tenantData.last_name}
          </strong>, DNI {tenantData.dni}, con domicilio en{' '}
          {tenantData.address}, {tenantData.city}, {tenantData.province},
          en adelante "EL LOCATARIO", se celebra el presente contrato.
        </p>

        <h2 className="font-bold mt-8 mb-2">PRIMERA — OBJETO</h2>
        <p>
          EL LOCADOR da en locación al LOCATARIO el inmueble sito en{' '}
          {propertyAddress}, destinado al uso acordado entre las partes.
        </p>

        <h2 className="font-bold mt-8 mb-2">SEGUNDA — PLAZO</h2>
        <p>
          El contrato tendrá una duración de {terms.duration_months} meses,
          comenzando el {terms.start_date} y finalizando el {terms.end_date}.
        </p>

        <h2 className="font-bold mt-8 mb-2">TERCERA — PRECIO</h2>
        <p>
          El canon locativo mensual se fija en la suma de $
          {terms.price.toLocaleString()}.
        </p>

        <h2 className="font-bold mt-8 mb-2">CUARTA — DEPÓSITO</h2>
        <p>
          En concepto de depósito en garantía se entrega la suma de $
          {terms.deposit.toLocaleString()}.
        </p>

        <h2 className="font-bold mt-8 mb-2">QUINTA — ACTUALIZACIÓN</h2>
        <p>
          El valor podrá actualizarse conforme índice legal vigente.
        </p>

        <h2 className="font-bold mt-8 mb-2">SEXTA — JURISDICCIÓN</h2>
        <p>
          Las partes se someten a los tribunales ordinarios de la jurisdicción
          correspondiente al inmueble.
        </p>

        <div className="mt-16 grid grid-cols-2 gap-12">
          <div>
            _______________________________
            <br />
            EL LOCADOR
          </div>

          <div>
            _______________________________
            <br />
            EL LOCATARIO
          </div>
        </div>

      </div>
    </div>
  )
}
