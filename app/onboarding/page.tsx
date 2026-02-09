'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()

  useEffect(() => {
    async function run() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const role = user.user_metadata?.role

      if (role === 'tenant') {
        router.push('/inquilino')
      } else if (role === 'owner') {
        router.push('/propietario/publicar')
      }
    }

    run()
  }, [router])

  return null
}
