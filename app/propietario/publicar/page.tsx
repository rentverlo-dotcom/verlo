'use client'

import { useEffect } from 'react'
import PropertyForm from '@/components/properties/PropertyForm'

export default function PublicarPage() {
  // 🧠 Restaurar draft del form después del login
  useEffect(() => {
    const saved = localStorage.getItem('pending_property_form')
    if (!saved) return

    try {
      const data = JSON.parse(saved) as Record<string, string | string[]>

      Object.entries(data).forEach(([key, value]) => {
        const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          `[name="${key}"]`
        )

        inputs.forEach((input) => {
          if (input.type === 'checkbox' && Array.isArray(value)) {
            input.checked = value.includes(input.value)
          } else if ('value' in input && typeof value === 'string') {
            input.value = value
          }
        })
      })
    } catch (e) {
      console.error('Error restaurando form guardado', e)
    }
  }, [])

  return (
    <main className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">
        Publicar propiedad
      </h1>
      <PropertyForm />
    </main>
  )
}
