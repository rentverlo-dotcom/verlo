'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  base?: number // ej 327
  sessionsPerBump?: number // ej 5
  maxExtra?: number // límite de crecimiento local para no irse al carajo
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function LiveCounter({
  base = 327,
  sessionsPerBump = 5,
  maxExtra = 80, // cuánto puede “crecer” como máximo en ese navegador
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  // --- “estado” persistente por navegador ---
  const storageKey = useMemo(() => `verlo_counter_v1_${base}`, [base])
  const sessionsKey = useMemo(() => `verlo_counter_sessions_v1`, [])

  const [target, setTarget] = useState(base)
  const [count, setCount] = useState(0)

  // 1) Observer para animar cuando entra en pantalla
  useEffect(() => {
    const node = ref.current
    if (!node) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.6 }
    )

    obs.observe(node)
    return () => obs.disconnect()
  }, [])

  // 2) Al montar: decide si “sube” según sesiones
  useEffect(() => {
    try {
      const current = Number(localStorage.getItem(storageKey) || base)
      const sessions = Number(localStorage.getItem(sessionsKey) || 0) + 1
      localStorage.setItem(sessionsKey, String(sessions))

      let next = current

      // Cada X sesiones, permitimos un bump (no siempre)
      if (sessions % sessionsPerBump === 0) {
        // 60% chance de subir 1–2
        // 40% chance “4% del total” (más picante) -> subir 2–5
        const r = Math.random()

        if (r < 0.6) {
          next = current + (Math.random() < 0.5 ? 1 : 2)
        } else {
          // “4%” como idea, pero acotado a un salto chico para no delatarse
          // (4% de 327 sería 13, demasiado)
          // Entonces lo interpretamos como “modo crecimiento” pero suave:
          next = current + (2 + Math.floor(Math.random() * 4)) // 2..5
        }
      }

      // límite para que no se vaya al infinito por navegador
      next = clamp(next, base, base + maxExtra)

      localStorage.setItem(storageKey, String(next))
      setTarget(next)
      setCount(base) // arranca desde base para animar lindo
    } catch {
      setTarget(base)
      setCount(base)
    }
  }, [base, maxExtra, sessionsPerBump, storageKey, sessionsKey])

  // 3) Animación count-up cuando visible
  useEffect(() => {
    if (!visible) return
    const from = count
    const to = target
    if (from === to) return

    const duration = 900
    const start = performance.now()

    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const value = Math.round(from + (to - from) * eased)
      setCount(value)
      if (p < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, target])

  return (
    <div ref={ref} style={{ marginTop: 34, textAlign: 'center' }}>
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

      <div style={{ marginTop: 8, fontSize: 15, color: '#64748b' }}>
        propietarios ya publicaron en VERLO
      </div>
    </div>
  )
}
