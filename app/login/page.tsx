'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: 'https://verlo.lat/auth/callback?next=/propietario/publicar',
  },
})


    if (error) {
      alert('Error enviando link')
      console.error(error)
    } else {
      alert('Te enviamos un link para iniciar sesión')
    }

    setLoading(false)
  }

  return (
    <main className="max-w-md mx-auto py-20 space-y-6">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar link mágico'}
        </button>
      </form>
    </main>
  )
}
