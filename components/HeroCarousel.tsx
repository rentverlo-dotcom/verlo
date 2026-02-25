'use client'

import { useRef, useState, useEffect } from 'react'

const items = [
  {
    id: 1,
    title: 'Depto Palermo',
    price: '$450.000',
    image:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200',
  },
  {
    id: 2,
    title: 'Loft Belgrano',
    price: '$620.000',
    image:
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200',
  },
  {
    id: 3,
    title: 'PH Caballito',
    price: '$390.000',
    image:
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200',
  },
  {
    id: 4,
    title: 'Casa Núñez',
    price: '$890.000',
    image:
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1200',
  },
  {
    id: 5,
    title: 'Recoleta Premium',
    price: '$1.200.000',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200',
  },
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
        paddingBottom: 80,
      }}
    >
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          gap: 40,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          padding: '60px 20vw',
          scrollbarWidth: 'none',
        }}
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex

          return (
            <div
              key={item.id}
              style={{
                flex: '0 0 320px',
                height: 440,
                borderRadius: 32,
                scrollSnapAlign: 'center',
                backgroundImage: `
                  linear-gradient(
                    to top,
                    rgba(0,0,0,0.75) 0%,
                    rgba(0,0,0,0.4) 40%,
                    rgba(0,0,0,0.05) 70%
                  ),
                  url(${item.image})
                `,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: isActive
                  ? '0 50px 120px rgba(0,0,0,0.25)'
                  : '0 20px 60px rgba(0,0,0,0.12)',
                transform: `scale(${isActive ? 1 : 0.82})`,
                opacity: isActive ? 1 : 0.5,
                transition: 'all 0.4s cubic-bezier(.4,0,.2,1)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: 28,
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 16,
                    opacity: 0.95,
                    color: '#fff',
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
