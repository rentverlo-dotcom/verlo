// app/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          'https://verlo.lat/propietario/publicar',
      },
    })

    setLoading(false)
    alert('Te enviamos un link a tu mail')
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <input
        type="email"
        placeholder="Tu email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="input"
      />
      <button disabled={loading} className="button-primary">
        Enviar link
      </button>
    </form>
  )
}

