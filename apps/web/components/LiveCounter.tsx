'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LiveCounter() {
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const run = async () => {
      setError(null)

      // 1) Incremento global (cada request suma 1 sesión; cada 5 suma properties_count)
      const { error: rpcErr } = await supabase.rpc('increment_session')
      if (rpcErr) {
        setError(rpcErr.message)
        return
      }

      // 2) Leo el contador global
      const { data, error: readErr } = await supabase
        .from('site_stats')
        .select('value')
        .eq('key', 'properties_count')
        .single()

      if (readErr) {
        setError(readErr.message)
        return
      }

      setCount(Number(data?.value ?? 0))
    }

    run()
  }, [])

  if (error) {
    // para que NO “no se vea nada”: mostramos el error en pantalla
    return (
      <div style={{ marginTop: 24, textAlign: 'center', color: '#ef4444', fontSize: 14 }}>
        Error contador: {error}
      </div>
    )
  }

  if (count === null) {
    return (
      <div style={{ marginTop: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        Cargando…
      </div>
    )
  }

  return (
  <div style={{ marginTop: 24, textAlign: 'center' }}>
    <div
      style={{
        fontSize: 44,
        fontWeight: 900,
        color: '#0f172a',
        letterSpacing: '-1px',
        lineHeight: 1,
      }}
    >
      +{count}
    </div>

    <div
      style={{
        marginTop: 8,
        fontSize: 15,
        color: '#64748b',
      }}
    >
      propietarios ya publicaron en VERLO
    </div>
  </div>
)
}
