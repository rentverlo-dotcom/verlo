'use client'

import { motion } from 'framer-motion'
import { useRef, useState } from 'react'

const items = [
  { id: 1, title: 'Depto Palermo', price: '$450.000' },
  { id: 2, title: 'Loft Belgrano', price: '$620.000' },
  { id: 3, title: 'PH Caballito', price: '$390.000' },
  { id: 4, title: 'Casa Núñez', price: '$890.000' },
  { id: 5, title: 'Monoambiente Recoleta', price: '$320.000' },
]

export default function HeroCarousel() {
  const [active, setActive] = useState(2)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      style={{
        marginTop: '80px',
        overflow: 'hidden',
        padding: '40px 0',
      }}
    >
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          gap: '40px',
          justifyContent: 'center',
          perspective: 1200,
        }}
      >
        {items.map((item, index) => {
          const isActive = index === active

          return (
            <motion.div
              key={item.id}
              onClick={() => setActive(index)}
              animate={{
                scale: isActive ? 1 : 0.85,
                opacity: isActive ? 1 : 0.5,
                y: isActive ? 0 : 40,
              }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{
                width: 280,
                height: 380,
                borderRadius: 24,
                background: 'linear-gradient(145deg,#ffffff,#f1f5f9)',
                boxShadow: isActive
                  ? '0 30px 80px rgba(0,0,0,0.15)'
                  : '0 10px 30px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '24px',
                cursor: 'pointer',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    opacity: 0.7,
                  }}
                >
                  {item.price}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
