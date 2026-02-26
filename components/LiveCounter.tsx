'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  target?: number
}

export default function LiveCounter({ target = 312 }: Props) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
        }
      },
      { threshold: 0.6 }
    )

    if (ref.current) observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return

    let start = 0
    const duration = 1200
    const increment = target / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [started, target])

  return (
    <div
      ref={ref}
      style={{
        marginTop: 40,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 42,
          fontWeight: 900,
          color: '#0f172a',
          letterSpacing: '-1px',
        }}
      >
        +{count}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 15,
          color: '#64748b',
        }}
      >
        propietarios ya publicaron en VERLO
      </div>
    </div>
  )
}
