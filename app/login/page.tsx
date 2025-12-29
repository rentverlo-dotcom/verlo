'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // LOGIN CLÁSICO (email + password)
      if (password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        window.location.href = '/propietario/publicar'
        return
      }

      // MAGIC LINK (solo email)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'https://verlo.lat/propietario/publicar',
        },
      })
      if (error) throw error

      alert('Te enviamos un link a tu mail')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 bg-neutral-900 p-6 rounded-xl"
      >
        <h1 className="text-xl font-semibold text-white text-center">
          Ingresar
        </h1>

        <input
          type="email"
          placeholder="Tu email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="input w-full"
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña (opcional)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input w-full pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <button
          disabled={loading}
          className="button-primary w-full"
        >
          {password ? 'Ingresar' : 'Enviar link'}
        </button>

        <p className="text-xs text-neutral-400 text-center">
          Si no tenés contraseña, te mandamos un link por mail
        </p>
      </form>
    </div>
  )
}

