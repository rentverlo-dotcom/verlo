'use client'

import { useRef, useState, useEffect } from 'react'

const items = [
  { id: 1, title: 'Depto Palermo', price: '$450.000' },
  { id: 2, title: 'Loft Belgrano', price: '$620.000' },
  { id: 3, title: 'PH Caballito', price: '$390.000' },
  { id: 4, title: 'Casa Núñez', price: '$890.000' },
  { id: 5, title: 'Recoleta Premium', price: '$1.200.000' },
]

export default function HeroCarousel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(2)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const children = Array.from(container.children)
      const containerCenter =
        container.scrollLeft + container.offsetWidth / 2

      let closestIndex = 0
      let closestDistance = Infinity

      children.forEach((child, index) => {
        const el = child as HTMLElement
        const elCenter = el.offsetLeft + el.offsetWidth / 2
        const distance = Math.abs(containerCenter - elCenter)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      setActiveIndex(closestIndex)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      style={{
        marginTop: 80,
        paddingBottom: 60,
      }}
    >
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          gap: 40,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          padding: '40px 20vw',
          scrollbarWidth: 'none',
        }}
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex

          return (
            <div
              key={item.id}
              style={{
                flex: '0 0 280px',
                height: 400,
                borderRadius: 28,
                scrollSnapAlign: 'center',
                background: 'linear-gradient(145deg,#ffffff,#f1f5f9)',
                boxShadow: isActive
                  ? '0 40px 100px rgba(0,0,0,0.18)'
                  : '0 15px 40px rgba(0,0,0,0.08)',
                transform: `scale(${isActive ? 1 : 0.82})`,
                opacity: isActive ? 1 : 0.45,
                transition: 'all 0.35s cubic-bezier(.4,0,.2,1)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: 24,
                cursor: 'pointer',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    opacity: 0.7,
                  }}
                >
                  {item.price}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
