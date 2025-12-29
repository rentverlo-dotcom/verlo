'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LogoutPage() {
  useEffect(() => {
    supabase.auth.signOut().finally(() => {
      localStorage.removeItem('property_draft')
      localStorage.removeItem('property_step')
      window.location.href = '/'
    })
  }, [])

  return null
}
