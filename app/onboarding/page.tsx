'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const router = useRouter()

  async function choose(role: 'tenant' | 'owner') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').insert({
      id: user.id,
      role,
    })

router.push(role === 'tenant' ? '/inquilino' : '/propietario/publicar')

