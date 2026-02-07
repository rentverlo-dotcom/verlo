import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

type Capabilities = {
  isOwner: boolean
  isTenant: boolean
  loading: boolean
}

export function useCapabilities(): Capabilities {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [state, setState] = useState<Capabilities>({
    isOwner: false,
    isTenant: false,
    loading: true,
  })

  useEffect(() => {
    if (!user) {
      setState({ isOwner: false, isTenant: false, loading: false })
      return
    }

    fetch(`/api/capabilities?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setState({
          isOwner: data.isOwner,
          isTenant: data.isTenant,
          loading: false,
        })
      })
  }, [user])

  return state
}
