'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Doc = {
  id: string
  doc_type: string
  file_path: string
  status: string
  created_at: string
}

export default function TenantDocumentsPage() {
  const router = useRouter()

  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('income_proof')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('tenant_financial_documents')
      .select('*')
      .eq('tenant_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setDocs(data)
    setLoading(false)
  }

  async function handleUpload() {
    if (!file) return

    setUploading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`

    // 1️⃣ Subir a bucket privado
    const { error: uploadError } = await supabase.storage
      .from('financial-documents')
      .upload(fileName, file)

    if (uploadError) {
      alert(uploadError.message)
      setUploading(false)
      return
    }

    // 2️⃣ Guardar en DB
    const { error: dbError } = await supabase
      .from('tenant_financial_documents')
      .insert({
        tenant_id: user.id,
        doc_type: docType,
        file_path: fileName,
        status: 'pending',
      })

    if (dbError) {
      alert(dbError.message)
    }

    setFile(null)
    setUploading(false)
    loadDocuments()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando documentos…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-10">

        <div>
          <h1 className="text-3xl font-semibold mb-2">
            Documentación financiera
          </h1>
          <p className="text-neutral-400 text-sm">
            Estos documentos serán visibles únicamente para propietarios con match aprobado.
          </p>
        </div>

        {/* Upload */}
        <div className="bg-neutral-900 p-6 rounded-xl space-y-4">

          <select
            value={docType}
            onChange={e => setDocType(e.target.value)}
            className="w-full p-3 bg-neutral-800 rounded"
          >
            <option value="income_proof">Recibo de sueldo</option>
            <option value="bank_statement">Extracto bancario</option>
            <option value="guarantee_property">Garantía propietaria</option>
            <option value="guarantor_id">DNI garante</option>
          </select>

          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />

          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="w-full bg-white text-black py-3 rounded font-medium"
          >
            {uploading ? 'Subiendo…' : 'Subir documento'}
          </button>

        </div>

        {/* Lista */}
        <div className="space-y-4">
          {docs.length === 0 && (
            <p className="text-neutral-500 text-sm">
              No hay documentos cargados aún.
            </p>
          )}

          {docs.map(doc => (
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
              <p className="text-xs text-neutral-500">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
