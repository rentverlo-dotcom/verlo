'use client'
import { supabase } from '@/lib/supabase/client'

export default function Login() {
  return (
    <button
      onClick={() =>
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${location.origin}/propietario/publicar`,
          },
        })
      }
    >
      Entrar con Google
    </button>
  )
}
