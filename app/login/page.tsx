'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Role = 'tenant' | 'owner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()

    if (!role) {
      setError('Elegí si ingresás como inquilino o propietario')
      return
    }

    setLoading(true)
    setError(null)
    setInfo(null)

    const redirectTo =
      role === 'owner'
        ? 'https://verlo.lat/propietario/publicar'
        : 'https://verlo.lat/inquilino'

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    if (error) {
      setError('No se pudo enviar el link. Revisá el email.')
    } else {
      setInfo('Te enviamos un link a tu mail para ingresar.')
    }

    setLoading(false)
  }

  return (
    <div className="container" style={{ paddingTop: '140px', maxWidth: 520 }}>
      <h1 className="section-title">Ingresar</h1>

      <form onSubmit={sendMagicLink} style={{ marginTop: 32 }}>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        {/* Selector de rol */}
        <div style={{ marginTop: 20 }}>
          <p style={{ marginBottom: 8, fontWeight: 500 }}>
            ¿Cómo querés ingresar?
          </p>

  <div
  style={{
    display: 'flex',
    gap: 8,
    background: '#f1f5f9',
    padding: 6,
    borderRadius: 14,
  }}
>
  {/* INQUILINO BLOQUEADO */}
  <button
    type="button"
    disabled
    style={{
      flex: 1,
      padding: '12px 16px',
      borderRadius: 10,
      border: 'none',
      cursor: 'not-allowed',
      background: '#e2e8f0',
      color: '#94a3b8',
      fontWeight: 600,
      position: 'relative',
      opacity: 0.8,
    }}
  >
    Muy pronto
  </button>

  {/* PROPIETARIO ACTIVO */}
  <button
    type="button"
    onClick={() => setRole('owner')}
    style={{
      flex: 1,
      padding: '12px 16px',
      borderRadius: 10,
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      background: '#ec4899',
      color: '#ffffff',
      fontWeight: 600,
      boxShadow:
        role === 'owner'
          ? '0 4px 14px rgba(236,72,153,0.35)'
          : 'none',
    }}
  >
    Soy propietario
  </button>
</div>
        </div>

        {error && (
          <p style={{ color: '#ff6b6b', marginTop: 16 }}>{error}</p>
        )}

        {info && (
          <p style={{ color: '#ec4899', marginTop: 16 }}>{info}</p>
        )}

        <button
          className="button"
          type="submit"
          disabled={loading}
          style={{ marginTop: 28, width: '100%' }}
        >
          {loading ? 'Enviando link…' : 'Enviar link de acceso'}
        </button>
      </form>
        </div>
  )
}

