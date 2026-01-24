'use client'

import { useRef, useState } from 'react'

type Match = {
  id: string
  title: string
  address: string
  price: number
  cover_url: string
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
  const match = matches[index]

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
      cardRef.current.style.transition = 'transform 0.3s ease'
      cardRef.current.style.transform = `translateX(${currentX.current > 0 ? 1000 : -1000}px)`
      setTimeout(() => {
        setIndex((i) => i + 1)
        if (cardRef.current) {
          cardRef.current.style.transition = ''
          cardRef.current.style.transform = ''
        }
      }, 300)
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
          <p>{match.address}</p>
          <strong>${match.price}</strong>
        </div>
      </div>
    </div>
  )
}

const container: React.CSSProperties = {
  width: '100%',
  height: '100vh',
  display: 'flex',
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
  color: '#fff',
}
