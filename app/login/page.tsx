'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/propietario/publicar')
  }

  async function sendMagicLink() {
    setLoading(true)
    setError(null)
    setInfo(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'https://verlo.lat/propietario/publicar',
      },
    })

    if (error) {
      setError('No se pudo enviar el link. Revisá el email.')
    } else {
      setInfo('Te enviamos un link a tu mail para ingresar o crear la cuenta.')
    }

    setLoading(false)
  }

  return (
    <div className="container" style={{ paddingTop: '140px', maxWidth: 520 }}>
      <h1 className="section-title">Ingresar</h1>

      <form onSubmit={handleLogin} style={{ marginTop: 32 }}>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <div style={{ position: 'relative', marginTop: 12 }}>
          <input
            className="input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            style={{
              position: 'absolute',
              right: 12,
              top: 10,
              fontSize: 14,
              opacity: 0.8,
            }}
          >
            {showPassword ? 'Ocultar' : 'Ver'}
          </button>
        </div>

        {error && (
          <p style={{ color: '#ff6b6b', marginTop: 12 }}>{error}</p>
        )}

        {info && (
          <p style={{ color: '#6bffb3', marginTop: 12 }}>{info}</p>
        )}

        <button
          className="button"
          type="submit"
          disabled={loading}
          style={{ marginTop: 20, width: '100%' }}
        >
          Ingresar
        </button>
      </form>

      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={sendMagicLink}
          className="link"
        >
          ¿No tenés contraseña o la olvidaste? Enviame un link
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={sendMagicLink}
          className="link"
        >
          ¿No tenés cuenta? Creala con tu email
        </button>
      </div>
    </div>
  )
}

