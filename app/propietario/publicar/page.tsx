'use client'

import { useEffect } from 'react'
import PropertyForm from '@/components/properties/PropertyForm'

export default function PublicarPage() {
  useEffect(() => {
    const saved = localStorage.getItem('pending_property_form')
    if (saved) {
      const data = JSON.parse(saved)
      Object.entries(data).forEach(([key, value]) => {
        const input = document.querySelector(`[name="${key}"]`) as HTMLInputElement | null
        if (input && 'value' in input) {
          input.value = value as string
        }
      })
    }
  }, [])

  return <PropertyForm />
}
