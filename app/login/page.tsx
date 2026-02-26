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

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => setRole('tenant')}
              className={`button ${role === 'tenant' ? '' : 'button-outline'}`}
              style={{ flex: 1 }}
            >
              Soy inquilino
            </button>

            <button
              type="button"
              onClick={() => setRole('owner')}
              className={`button ${role === 'owner' ? '' : 'button-outline'}`}
              style={{ flex: 1 }}
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

