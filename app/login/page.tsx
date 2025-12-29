'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError('Credenciales inválidas')
      return
    }

    window.location.href = '/'
  }

  async function sendMagicLink() {
    if (!email) {
      setError('Ingresá tu email primero')
      return
    }

    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'https://verlo.lat',
      },
    })

    alert('Te enviamos un link a tu email')
  }

  return (
    <form onSubmit={handleLogin} className="login-form">
      <h1>Ingresar</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />

      <div className="password-field">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
        >
          {showPassword ? 'Ocultar' : 'Ver'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <button disabled={loading}>Ingresar</button>

      <p className="alt">
        ¿No tenés contraseña?{' '}
        <button type="button" onClick={sendMagicLink}>
          Enviame un link
        </button>
      </p>

      <p className="alt">
        ¿No tenés cuenta?{' '}
        <a href="/login">Creala con tu email</a>
      </p>
    </form>
  )
}
