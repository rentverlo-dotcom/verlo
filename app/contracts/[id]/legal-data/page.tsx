'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LegalDataPage() {
  const { id: matchId } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    address: '',
    city: '',
    province: '',
  })

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Debes iniciar sesión')
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('user_contract_data')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setForm({
          first_name: data.first_name,
          last_name: data.last_name,
          dni: data.dni,
          address: data.address,
          city: data.city,
          province: data.province,
        })
      }

      setLoading(false)
    }

    load()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Sesión inválida')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('user_contract_data')
      .upsert({
        user_id: user.id,
        ...form,
      })

    if (error) {
      console.error(error)
      setError('No se pudieron guardar los datos')
      setSaving(false)
      return
    }

    router.push(`/contracts/${matchId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-xl mx-auto space-y-8">

        <h1 className="text-3xl font-bold">
          Datos legales para el contrato
        </h1>

        <p className="text-neutral-400 text-sm">
          Estos datos se usarán exclusivamente para la generación
          formal del contrato de locación.
        </p>

        {error && (
          <div className="bg-red-900 border border-red-700 p-4 rounded text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <input
            name="first_name"
            placeholder="Nombre"
            value={form.first_name}
            onChange={handleChange}
            required
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3"
          />

          <input
            name="last_name"
            placeholder="Apellido"
            value={form.last_name}
            onChange={handleChange}
            required
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3"
          />

          <input
            name="dni"
            placeholder="DNI"
            value={form.dni}
            onChange={handleChange}
            required
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3"
          />

          <input
            name="address"
            placeholder="Domicilio"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3"
          />

          <input
            name="city"
            placeholder="Ciudad"
            value={form.city}
            onChange={handleChange}
            required
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3"
          />

          <input
            name="province"
            placeholder="Provincia"
            value={form.province}
            onChange={handleChange}
            required
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-white text-black py-4 rounded-xl font-semibold"
          >
            {saving ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </form>

      </div>
    </div>
  )
}
