'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type IdentityDoc = {
  id: string
  doc_type: string
  status: string
  created_at: string
}

export default function VerificacionPage() {
  const router = useRouter()

  const [docs, setDocs] = useState<IdentityDoc[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('dni_front')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocs()
  }, [])

  async function loadDocs() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('identity_documents')
      .select('*')
      .eq('user_id', user.id)
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

    const ext = file.name.split('.').pop()
    const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`

    // subir a bucket privado
    const { error: uploadError } = await supabase.storage
      .from('identity-documents')
      .upload(fileName, file)

    if (uploadError) {
      alert(uploadError.message)
      setUploading(false)
      return
    }

    // guardar en DB
    const { error: dbError } = await supabase
      .from('identity_documents')
      .insert({
        user_id: user.id,
        doc_type: docType,
        file_path: fileName,
        status: 'pending',
      })

    if (dbError) {
      alert(dbError.message)
    }

    setFile(null)
    setUploading(false)
    loadDocs()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando verificación…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-10">

        <div>
          <h1 className="text-3xl font-semibold mb-2">
            Verificación de identidad
          </h1>
          <p className="text-neutral-400 text-sm">
            Necesitamos validar tu identidad antes de coordinar visitas.
          </p>
        </div>

        <div className="bg-neutral-900 p-6 rounded-xl space-y-4">

          <select
            value={docType}
            onChange={e => setDocType(e.target.value)}
            className="w-full p-3 bg-neutral-800 rounded"
          >
            <option value="dni_front">DNI frente</option>
            <option value="dni_back">DNI dorso</option>
            <option value="selfie">Selfie sosteniendo DNI</option>
          </select>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
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
