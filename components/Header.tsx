//components/Header.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function Header() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  return (
    <header className="nav">
  <strong>VERLO</strong>

  <nav className="nav-links">
    <a href="/#transparencia">Transparencia</a>

    {/* Ambos van a login */}
    <a href="/login">Soy inquilino</a>
    <a href="/login">Soy propietario</a>

    {user ? (
      <a href="/logout">Cerrar sesión</a>
    ) : (
      <a href="/login">Ingresar</a>
    )}
  </nav>
</header>

  )
}

