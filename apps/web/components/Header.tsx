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
  <header
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      zIndex: 100,
      borderBottom: '1px solid #e2e8f0',
    }}
  >
    <strong
      style={{
        fontSize: '18px',
        letterSpacing: '0.5px',
        color: '#0f172a',
      }}
    >
      VERLO
    </strong>

    <nav
      style={{
        display: 'flex',
        gap: '28px',
        alignItems: 'center',
        fontSize: '14px',
      }}
    >
      <a href="/#transparencia" style={{ color: '#334155', textDecoration: 'none' }}>
        Transparencia total
      </a>

      {/*  <a href="/login" style={{ color: '#334155', textDecoration: 'none' }}>
        Soy inquilino
      </a>*/}

      <a href="/login" style={{ color: '#334155', textDecoration: 'none' }}>
        Soy propietario
      </a>

      {user ? (
        <a href="/logout" style={{ color: '#0f172a', fontWeight: 600 }}>
          Cerrar sesión
        </a>
      ) : (
        <a href="/login" style={{ color: '#0f172a', fontWeight: 600 }}>
          Ingresar
        </a>
      )}
    </nav>
  </header>
)
}

