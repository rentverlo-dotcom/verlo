'use client'

import { useEffect, useState } from 'react'

export default function LiveCounter() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/live-counter')
      .then(res => res.json())
      .then(data => setCount(data.count))
  }, [])

  if (count === null) return null

  return (
    <div style={{ textAlign: 'center', marginTop: 32 }}>
      <div
        style={{
          fontSize: 44,
          fontWeight: 900,
          color: '#0f172a',
        }}
      >
        +{count}
      </div>
      <div style={{ color: '#64748b', marginTop: 8 }}>
        propietarios ya publicaron en VERLO
      </div>
    </div>
  )
}
