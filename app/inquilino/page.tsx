'use client'

import { useRouter } from 'next/navigation'

export default function InquilinoPage() {
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
        Buscá alquiler con respaldo real
      </h1>

      <p style={{ marginTop: 16, opacity: 0.85 }}>
        En Verlo tu perfil es verificado y el contrato se genera
        solo cuando hay un match real con un propietario.
      </p>

      <button
        className="button"
        style={{ marginTop: 32 }}
        onClick={() => router.push('/buscar')}
      >
        Buscar propiedades
      </button>
    </div>
  )
}
