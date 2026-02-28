'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type OwnerProperty = {
  id: string
  price: number
  property_type: string
  cover_url: string
  publish_status: 'draft' | 'published'
}

type Props = {
  cards: OwnerProperty[]
}

export default function OwnerDeck({ cards }: Props) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const cardRef = useRef<HTMLDivElement | null>(null)

  if (!cards || cards.length === 0) {
    return (
      <div style={empty}>
        <p>No publicaste propiedades todavía</p>
      </div>
    )
  }

  const card = cards[index]
  if (!card) {
    return (
      <div style={empty}>
        <p>Eso es todo 👌</p>
      </div>
    )
  }

  function next() {
    setIndex(i => i + 1)
  }

  return (
    <div style={container}>
      <div
        ref={cardRef}
        style={{
          ...cardStyle,
          backgroundImage: `url(${card.cover_url})`,
        }}
      >
        <div style={overlay} />

        <div style={info}>
          <h2>
            {card.property_type} – ${card.price}
          </h2>

          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Estado: {card.publish_status}
          </p>
        </div>
      </div>

      <div style={actions}>
        <button
          style={{ ...btn, background: '#2563eb' }}
          onClick={() => router.push(`/propiedades/${card.id}`)}
        >
          👁️
        </button>

        <button
          style={{ ...btn, background: '#f59e0b' }}
          onClick={() => router.push(`/propietario/editar/${card.id}`)}
        >
          ✏️
        </button>

        <button
          style={{ ...btn, background: '#22c55e' }}
          onClick={next}
        >
          →
        </button>
      </div>
    </div>
  )
}

/* ===== STYLES ===== */

const container: React.CSSProperties = {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#000',
}

const cardStyle: React.CSSProperties = {
  width: '360px',
  height: '640px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: '20px',
  position: 'relative',
}

const overlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: '20px',
  background:
    'linear-gradient(to top, rgba(0,0,0,0.8) 25%, transparent)',
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
  fontSize: '22px',
  cursor: 'pointer',
}

const empty: React.CSSProperties = {
  width: '100%',
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  background: '#000',
  fontSize: '16px',
  opacity: 0.7,
}
