'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PostLogin() {
  const router = useRouter()

  useEffect(() => {
    async function run() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile) {
        router.push('/onboarding')
      } else if (profile.role === 'tenant') {
        router.push('/inquilino')
      } else {
        router.push('/propietario')
      }
    }

    run()
  }, [router])

  return null
}

