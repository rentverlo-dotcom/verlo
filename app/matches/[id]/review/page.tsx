'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Match = {
  id: string
  demand_id: string
}

type Document = {
  id: string
  doc_type: string
  file_path: string
  status: string
  created_at: string
}

export default function MatchReviewPage() {
  const { id: matchId } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [demandId, setDemandId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!matchId) return
    loadData()
  }, [matchId])

  async function loadData() {
    setLoading(true)

    // 1️⃣ Traer match
    const { data: match } = await supabase
      .from('matches')
      .select('id, demand_id')
      .eq('id', matchId)
      .single()

    if (!match) {
      setLoading(false)
      return
    }

    setDemandId(match.demand_id)

    // 2️⃣ Traer tenant_id
    const { data: demand } = await supabase
      .from('demands')
      .select('tenant_id')
      .eq('id', match.demand_id)
      .single()

    if (!demand) {
      setLoading(false)
      return
    }

    setTenantId(demand.tenant_id)

    // 3️⃣ Traer documentos financieros
    const { data: docs } = await supabase
      .from('tenant_financial_documents')
      .select('*')
      .eq('tenant_id', demand.tenant_id)
      .order('created_at', { ascending: false })

    if (docs) setDocuments(docs)

    setLoading(false)
  }

  async function approveGuarantee() {
    if (!demandId) return

    setSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('match_guarantee_reviews')
      .upsert({
        match_id: matchId,
        demand_id: demandId,
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })

    if (!error) {
      alert('Garantía aprobada')
      router.push(`/matches/${matchId}`)
    } else {
      alert(error.message)
    }

    setSubmitting(false)
  }

  async function rejectGuarantee() {
    if (!demandId) return

    setSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('match_guarantee_reviews')
      .upsert({
        match_id: matchId,
        demand_id: demandId,
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })

    if (!error) {
      alert('Garantía rechazada')
      router.push(`/matches/${matchId}`)
    } else {
      alert(error.message)
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando documentación…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-3xl mx-auto space-y-10">

        <div>
          <h1 className="text-3xl font-semibold">
            Revisión de garantía
          </h1>
          <p className="text-neutral-400 text-sm mt-2">
            Documentación financiera presentada por el inquilino.
          </p>
        </div>

        {documents.length === 0 && (
          <p className="text-neutral-500">
            El inquilino aún no cargó documentación.
          </p>
        )}

        <div className="space-y-4">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="bg-neutral-900 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-medium">{doc.doc_type}</p>
                <p className="text-xs text-neutral-400">
                  Estado: {doc.status}
                </p>
              </div>

              <button
                onClick={async () => {
                  const { data } = await supabase
                    .storage
                    .from('financial-documents')
                    .createSignedUrl(doc.file_path, 60)

                  if (data?.signedUrl) {
                    window.open(data.signedUrl, '_blank')
                  }
                }}
                className="text-sm underline"
              >
                Ver archivo
              </button>
            </div>
          ))}
        </div>

        {documents.length > 0 && (
          <div className="flex gap-4 pt-6">
            <button
              onClick={approveGuarantee}
              disabled={submitting}
              className="flex-1 bg-green-600 py-3 rounded font-medium"
            >
              Aprobar garantía
            </button>

            <button
              onClick={rejectGuarantee}
              disabled={submitting}
              className="flex-1 bg-red-600 py-3 rounded font-medium"
            >
              Rechazar
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

