'use client'

type Card = {
  id: string
  title: string
  cover_url: string
  price: number
  publish_status: string
}

export default function OwnerDeck({ cards }: { cards: Card[] }) {
  if (!cards.length) {
    return (
      <div style={empty}>
        <p>No publicaste propiedades todavía</p>
      </div>
    )
  }

  return (
    <div style={container}>
      {cards.map(card => (
        <div
          key={card.id}
          style={{
            ...cardStyle,
            backgroundImage: `url(${card.cover_url})`,
          }}
          onClick={() =>
            (window.location.href = `/propiedades/${card.id}`)
          }
        >
          <div style={overlay} />

          <div style={info}>
            <h2>{card.title}</h2>
            <strong>${card.price}</strong>
            <span style={status(card.publish_status)}>
              {card.publish_status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
