// app/guardadas/page.tsx
import Link from 'next/link'

type Property = {
  id: string
  title: string
  short_description: string
  price: number
  cover_url: string
}

const savedProperties: Property[] = [
  {
    id: '1',
    title: 'Depto 2 amb Palermo',
    short_description: 'Luz natural todo el día, balcón y ubicación premium.',
    price: 450000,
    cover_url:
      'https://images.unsplash.com/photo-1502673530728-f79b4cab31b1',
  },
  {
    id: '2',
    title: 'Monoambiente Recoleta',
    short_description: 'Ideal para vivir solo, moderno y bien conectado.',
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
        {savedProperties.map((p) => (
          <Link key={p.id} href={`/guardadas/${p.id}`} style={card}>
            <div
              style={{
                ...image,
                backgroundImage: `url(${p.cover_url})`,
              }}
            />
            <div style={info}>
              <h2>{p.title}</h2>
              <p style={desc}>{p.short_description}</p>
              <strong>${p.price}</strong>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

const container: React.CSSProperties = {
  minHeight: '100vh',
  background: '#000',
  color: '#fff',
  padding: '40px 20px',
}

const title: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '32px',
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '20px',
}

const card: React.CSSProperties = {
  background: '#111',
  borderRadius: '16px',
  overflow: 'hidden',
  textDecoration: 'none',
  color: '#fff',
}

const image: React.CSSProperties = {
  height: '180px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}

const info: React.CSSProperties = {
  padding: '14px',
}

const desc: React.CSSProperties = {
  fontSize: '14px',
  opacity: 0.85,
  marginBottom: '8px',
}
