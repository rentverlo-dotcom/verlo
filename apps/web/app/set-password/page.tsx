'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)

    await supabase.auth.updateUser({
      password,
      data: { has_password: true },
    })

    setLoading(false)
    window.location.href = '/propietario/publicar'
  }

  return (
    <div className="max-w-md mx-auto mt-32 space-y-4">
      <h1 className="text-xl text-white font-semibold">
        Creá tu contraseña
      </h1>

      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Nueva contraseña"
          className="input pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400"
        >
          👁
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={!password || loading}
        className="button-primary w-full"
      >
        Guardar contraseña
      </button>
    </div>
  )
}
