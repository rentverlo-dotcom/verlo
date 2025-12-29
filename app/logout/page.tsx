// app/logout/page.tsx
'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LogoutPage() {
  useEffect(() => {
    async function logout() {
      // 1. Cerrar sesión en Supabase
      await supabase.auth.signOut()

      // 2. Limpiar todo estado local
      localStorage.clear()
      sessionStorage.clear()

      // 3. Redirigir a home
      window.location.href = '/'
    }

    logout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      Cerrando sesión…
    </div>
  )
}
