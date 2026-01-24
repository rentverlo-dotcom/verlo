// app/guardadas/page.tsx
export const dynamic = 'force-dynamic'

type SavedProperty = {
  id: string
  title: string
  short_description: string
  price: number
  cover_url: string
}

const saved: SavedProperty[] = [
  {
    id: '1',
    title: 'Depto 2 amb Palermo',
    short_description: 'Luminoso, moderno y cerca de todo.',
    price: 450000,
    cover_url:
      'https://images.unsplash.com/photo-1502673530728-f79b4cab31b1',
  },
  {
    id: '2',
    title: 'Monoambiente Recoleta',
    short_description: 'Ideal estudiantes o primera vivienda.',
    price: 380000,
    cover_url:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
  },
]

export default function GuardadasPage() {
  return (
    <div style={container}>
      <h1 style={title}>Propiedades guardadas</h1>

      <div style={grid}>
        {saved.map((p) => (
          <a key={p.id} href={`/guardadas/${p.id}`} style={card}>
            <div
              style={{
                ...image,
                backgroundImage: `url(${p.cover_url})`,
              }}
            />

            <div style={info}>
              <h3 style={{ marginBottom: '6px' }}>{p.title}</h3>
              <p style={{ fontSize: '14px', opacity: 0.85 }}>
                {p.short_description}
              </p>
              <strong style={{ marginTop: '8px', display: 'block' }}>
                ${p.price}
              </strong>

              <div style={actions}>
                <button style={{ ...btn, background: '#22c55e' }}>
                  Agendar visita
                </button>
                <button style={{ ...btn, background: '#2563eb' }}>
                  WhatsApp
                </button>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

const container: React.CSSProperties = {
  minHeight: '100vh',
  padding: '40px 20px',
  background: '#000',
  color: '#fff',
}

const title: React.CSSProperties = {
  fontSize: '28px',
  marginBottom: '32px',
  textAlign: 'center',
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '24px',
}

const card: React.CSSProperties = {
  background: '#111',
  borderRadius: '16px',
  overflow: 'hidden',
  textDecoration: 'none',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
}

const image: React.CSSProperties = {
  height: '180px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}

const info: React.CSSProperties = {
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
}

const actions: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginTop: '12px',
}

const btn: React.CSSProperties = {
  flex: 1,
  border: 'none',
  borderRadius: '8px',
  padding: '8px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '13px',
}
