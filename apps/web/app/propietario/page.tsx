'use client'

import { useRouter } from 'next/navigation'

export default function PropietarioPage() {
  const router = useRouter()

  return (
    <div
      className="container"
      style={{
        paddingTop: '140px',
        maxWidth: 640,
        textAlign: 'center',
      }}
    >
      <h1 className="section-title">
        Publicá tu propiedad con seguridad
      </h1>

      <p style={{ marginTop: 16, opacity: 0.85 }}>
        Verificamos inquilinos, generamos contratos
        y te acompañamos en todo el proceso.
      </p>

      <button
        className="button"
        style={{ marginTop: 32 }}
        onClick={() => router.push('/propietario/publicar')}
      >
        Publicar mi propiedad
      </button>
    </div>
  )
}
