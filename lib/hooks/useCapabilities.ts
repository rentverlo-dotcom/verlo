'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Capabilities = {
  isOwner: boolean
  isTenant: boolean
  loading: boolean
}

export function useCapabilities(): Capabilities {
  const [state, setState] = useState<Capabilities>({
    isOwner: false,
    isTenant: false,
    loading: true,
  })

  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setState({ isOwner: false, isTenant: false, loading: false })
        return
      }

      const res = await fetch(`/api/capabilities?userId=${user.id}`)
      const data = await res.json()

      setState({
        isOwner: data.isOwner,
        isTenant: data.isTenant,
        loading: false,
      })
    }

    run()
  }, [])

  return state
}
