'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function Header() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="w-full px-6 py-4 flex justify-between items-center border-b border-neutral-800">
      <Link href="/" className="text-white font-semibold">
        Verlo
      </Link>

      {user ? (
        <Link href="/logout" className="text-sm text-red-400">
          Cerrar sesión
        </Link>
      ) : (
        <Link href="/login" className="text-sm text-white">
          Ingresar
        </Link>
      )}
    </header>
  )
}
