'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function Header() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
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

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header>
      <div className="nav">
        <strong>VERLO</strong>

        <nav className="nav-links">
          <a href="#transparencia">Transparencia</a>
          <a href="#forms">Soy inquilino</a>
          <a href="#forms">Soy propietario</a>

          {!user ? (
            <Link href="/login">Ingresar</Link>
          ) : (
            <button onClick={logout} style={{ cursor: 'pointer' }}>
              Salir
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}

