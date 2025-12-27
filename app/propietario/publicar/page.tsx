'use client'

import { useEffect } from 'react'
import PropertyForm from '@/components/properties/PropertyForm'

export default function PublicarPage() {
  useEffect(() => {
    const saved = localStorage.getItem('pending_property_form')
    if (!saved) return

    const data = JSON.parse(saved)

    Object.entries(data).forEach(([key, value]) => {
      const inputs = document.querySelectorAll(`[name="${key}"]`)

      inputs.forEach((el) => {
        if (el instanceof HTMLInputElement) {
          if (el.type === 'checkbox' && Array.isArray(value)) {
            el.checked = value.includes(el.value)
          } else if (typeof value === 'string') {
            el.value = value
          }
        }

        if (el instanceof HTMLTextAreaElement && typeof value === 'string') {
          el.value = value
        }
      })
    })
  }, [])

  return <PropertyForm />
}
