'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function AuthButton() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) return null

  if (!user) {
    return (
      <a href="/login" className="text-sm">
        Ingresar
      </a>
    )
  }

  return (
    <button
      className="text-sm"
      onClick={async () => {
        await supabase.auth.signOut()
        localStorage.clear()
        window.location.href = '/'
      }}
    >
      Cerrar sesión
    </button>
  )
}
