// app/guardadas/[id]/page.tsx
export const dynamic = 'force-dynamic'

type Property = {
  id: string
  title: string
  short_description: string
  description: string
  price: number
  cover_url: string
}

const DATA: Property[] = [
  {
    id: '1',
    title: 'Depto 2 amb Palermo',
    short_description: 'Luminoso, moderno y cerca de todo.',
    description:
      'Departamento de dos ambientes ubicado en el corazón de Palermo. Cuenta con excelente iluminación natural, balcón, cocina integrada y dormitorio con placard. Ideal para quienes buscan comodidad, ubicación y estilo.',
    price: 450000,
    cover_url:
      'https://images.unsplash.com/photo-1502673530728-f79b4cab31b1',
  },
  {
    id: '2',
    title: 'Monoambiente Recoleta',
    short_description: 'Ideal estudiantes o primera vivienda.',
    description:
      'Monoambiente funcional en Recoleta, a metros de universidades y medios de transporte. Ambiente amplio, cocina separada y baño completo. Perfecto para una vida urbana práctica.',
    price: 380000,
    cover_url:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
  },
]

export default function GuardadaDetalle({
  params,
}: {
  params: { id: string }
}) {
  const property = DATA.find((p) => p.id === params.id)

  if (!property) {
    return (
      <div style={container}>
        <p style={{ color: '#fff' }}>Propiedad no encontrada</p>
      </div>
    )
  }

  return (
    <div style={container}>
      <div
        style={{
          ...hero,
          backgroundImage: `url(${property.cover_url})`,
        }}
      />

      <div style={content}>
        <h1 style={title}>{property.title}</h1>

        <p style={short}>{property.short_description}</p>

        <p style={description}>{property.description}</p>

        <strong style={price}>${property.price}</strong>

        <div style={actions}>
          <button style={{ ...btn, background: '#22c55e' }}>
            Agendar visita
          </button>

          <button style={{ ...btn, background: '#2563eb' }}>
            WhatsApp
          </button>

          <button style={{ ...btn, background: '#9333ea' }}>
            Videollamada
          </button>
        </div>
      </div>
    </div>
  )
}

const container: React.CSSProperties = {
  minHeight: '100vh',
  background: '#000',
  color: '#fff',
}

const hero: React.CSSProperties = {
  height: '320px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}

const content: React.CSSProperties = {
  padding: '24px',
  maxWidth: '720px',
  margin: '0 auto',
}

const title: React.CSSProperties = {
  fontSize: '28px',
  marginBottom: '8px',
}

const short: React.CSSProperties = {
  fontSize: '16px',
  opacity: 0.85,
  marginBottom: '16px',
}

const description: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.6,
  opacity: 0.9,
  marginBottom: '24px',
}

const price: React.CSSProperties = {
  fontSize: '22px',
  display: 'block',
  marginBottom: '24px',
}

const actions: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
}

const btn: React.CSSProperties = {
  border: 'none',
  borderRadius: '10px',
  padding: '12px 16px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '14px',
}
