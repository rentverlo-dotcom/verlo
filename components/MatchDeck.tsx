// components/MatchDeck.tsx
'use client'

import { useRef, useState } from 'react'

type Match = {
  id: string
  title: string
  address: string
  price: number
  cover_url: string
  short_description: string
}

type MatchDeckProps = {
  matches: Match[]
}

export default function MatchDeck({ matches }: MatchDeckProps) {
  const [index, setIndex] = useState(0)
  const startX = useRef(0)
  const currentX = useRef(0)
  const cardRef = useRef<HTMLDivElement | null>(null)

  if (!matches || matches.length === 0) return null

  const match = matches[index] ?? null
  if (!match) {
    return (
      <div style={container}>
        <p style={{ color: '#fff', marginBottom: '20px', textAlign: 'center' }}>
          Terminaste por ahora.
          <br />
          Mirá las propiedades guardadas 👀
        </p>

        <button
          style={{ ...btn, background: '#2563eb' }}
          onClick={() => {
            // placeholder: ir a /guardadas
            console.log('ver guardadas')
          }}
        >
          👁️
        </button>
      </div>
    )
  }

function swipe(dir: 'left' | 'right') {
  if (!cardRef.current) return

  const x = dir === 'right' ? 1000 : -1000

  // 👉 LIKE REAL (solo derecha)
  if (dir === 'right') {
    fetch('/api/property-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        property_id: match.id,
        action: 'like',
      }),
    }).catch(() => {})
  }

  cardRef.current.style.transition = 'transform 0.3s ease'
  cardRef.current.style.transform = `translateX(${x}px) rotate(${x / 20}deg)`

  setTimeout(() => {
    setIndex((i) => i + 1)

    if (cardRef.current) {
      cardRef.current.style.transition = ''
      cardRef.current.style.transform = ''
    }
  }, 300)
}



  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    currentX.current = e.clientX - startX.current
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${currentX.current}px) rotate(${currentX.current / 20}deg)`
    }
  }

  function onPointerUp() {
    if (!cardRef.current) return

    if (Math.abs(currentX.current) > 120) {
      swipe(currentX.current > 0 ? 'right' : 'left')
    } else {
      cardRef.current.style.transition = 'transform 0.2s ease'
      cardRef.current.style.transform = 'translateX(0)'
    }

    currentX.current = 0
  }

  return (
    <div style={container}>
      <div
        ref={cardRef}
        style={{
          ...card,
          backgroundImage: `url(${match.cover_url})`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div style={overlay} />
       <div style={info}>
  <h2>{match.title}</h2>

  {/* 👉 DESCRIPCIÓN BREVE (COPY PARA SWIPE) */}
  <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '6px' }}>
    {match.short_description}
  </p>

  <p style={{ fontSize: '13px', opacity: 0.75 }}>{match.address}</p>
  <strong>${match.price}</strong>
</div>

      </div>

      <div style={actions}>
        <button
          style={{ ...btn, background: '#ff4d4f' }}
          onClick={() => swipe('left')}
        >
          ✕
        </button>

        <button
          style={{ ...btn, background: '#2563eb' }}
          onClick={() => {
            // placeholder: ir a /guardadas
            console.log('ver guardadas')
          }}
        >
          👁️
        </button>

        <button
          style={{ ...btn, background: '#22c55e' }}
          onClick={() => swipe('right')}
        >
          ♥
        </button>
      </div>
    </div>
  )
}

const container: React.CSSProperties = {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#000',
}

const card: React.CSSProperties = {
  width: '360px',
  height: '640px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: '20px',
  position: 'relative',
  touchAction: 'none',
  cursor: 'grab',
}

const overlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: '20px',
  background:
    'linear-gradient(to top, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.2) 60%, transparent)',
}

const info: React.CSSProperties = {
  position: 'absolute',
  bottom: '20px',
  left: '20px',
  right: '20px',
  color: '#fff',
}

const actions: React.CSSProperties = {
  marginTop: '20px',
  display: 'flex',
  gap: '24px',
}

const btn: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  border: 'none',
  color: '#fff',
  fontSize: '28px',
  cursor: 'pointer',
}

