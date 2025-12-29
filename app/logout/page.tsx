'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LogoutPage() {
  useEffect(() => {
    supabase.auth.signOut().finally(() => {
      window.location.href = '/'
    })
  }, [])

  return null
}
