'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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
      setError('Email o contraseña incorrectos')
      return
    }

    window.location.href = '/propietario/publicar'
  }

  async function sendMagicLink() {
    setError(null)
    setMessage(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'https://verlo.lat/propietario/publicar',
      },
    })

    setLoading(false)

    if (error) {
      setError('No se pudo enviar el link')
      return
    }

    setMessage('Te enviamos un link a tu email para ingresar')
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-neutral-900 p-8 rounded-2xl space-y-6"
      >
        <h1 className="text-2xl font-semibold text-white">Ingresar</h1>

        <input
          type="email"
          placeholder="Email"
          className="input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña"
            className="input pr-12"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400"
          >
            {showPassword ? 'Ocultar' : 'Ver'}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {message && <p className="text-green-400 text-sm">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="button-primary w-full"
        >
          Ingresar
        </button>

        <button
          type="button"
          onClick={sendMagicLink}
          disabled={!email || loading}
          className="w-full text-sm text-neutral-400 underline"
        >
          ¿No tenés contraseña? Te mandamos un link por mail
        </button>

        <p className="text-sm text-neutral-400 text-center">
          ¿No tenés cuenta?{' '}
          <a href="/signup" className="underline">
            Crear cuenta
          </a>
        </p>
      </form>
    </div>
  )
}
