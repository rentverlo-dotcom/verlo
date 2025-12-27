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
          'https://verlo.lat/auth/callback?next=/propietario/publicar',
      },
    })

    setLoading(false)
    alert('Te enviamos un link')
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button disabled={loading}>Enviar link</button>
    </form>
  )
}

