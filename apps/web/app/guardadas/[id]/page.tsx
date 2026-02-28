// app/guardadas/[id]/page.tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import FlowHeader from '@/components/FlowHeader'
import IdentityVerificationModal from '@/components/IdentityVerificationModal' // 🆕 AGREGADO

const OWNER_PHONE = '5491112345678' // después viene de la DB

type Media = {
  id: string
  type: 'image' | 'video'
  url: string
}

type Property = {
  id: string
  title: string
  full_description: string
  address: string
  price: number
  media: Media[]
}

// 👉 MOCK TEMPORAL
const MOCK_PROPERTY: Property = {
  id: '1',
  title: 'Depto 2 amb Palermo',
  full_description:
    'Departamento luminoso, moderno y silencioso. Ideal para vivir cómodo en una de las mejores zonas de la ciudad. Listo para entrar.',
  address: 'Palermo, CABA',
  price: 450000,
  media: [
    {
      id: 'm1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1502673530728-f79b4cab31b1',
    },
    {
      id: 'm2',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
    },
    {
      id: 'm3',
      type: 'video',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
  ],
}

export default function GuardadaDetallePage() {
  const params = useParams()
  const property = MOCK_PROPERTY

  const [index, setIndex] = useState(0)
  const current = property.media[index]

  const [showVerify, setShowVerify] = useState(false) // 🆕 AGREGADO
  const [pendingAction, setPendingAction] = useState<
    'visit' | 'whatsapp' | null
  >(null) // 🆕 AGREGADO

  // ✅ WHATSAPP URL
  const whatsappUrl = `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(
    `Hola! Vi la propiedad "${property.title}" en VERLO y me interesa. ¿Podemos coordinar una visita?`
  )}`

  // 🆕 FUNCIÓN CENTRAL PARA VALIDAR IDENTIDAD
  async function checkIdentity(action: 'visit' | 'whatsapp') {
    const res = await fetch('/api/identity-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_id: 'FAKE_TENANT_ID', // después auth real
      }),
    })

    const data = await res.json()

    if (!data.verified) {
      setPendingAction(action)
      setShowVerify(true)
      return false
    }

    return true
  }

  // 🆕 INICIA VERIFICACIÓN
  async function startVerification() {
    await fetch('/api/identity-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_id: 'FAKE_TENANT_ID', // después auth real
      }),
    })

    alert('Redirigir a verificación de identidad (Truora)')
    setShowVerify(false)
  }

  return (
    <div style={page}>
      {/* HEADER DE FLOW */}
      <FlowHeader title="Detalle de la propiedad" />

      {/* GALERÍA */}
      <div style={gallery}>
        {current.type === 'image' ? (
          <img src={current.url} style={media} />
        ) : (
          <video src={current.url} style={media} controls />
        )}

        <div style={dots}>
          {property.media.map((_, i) => (
            <span
              key={i}
              onClick={() => setIndex(i)}
              style={{ ...dot, opacity: i === index ? 1 : 0.4 }}
            />
          ))}
        </div>
      </div>

      {/* INFO */}
      <div style={info}>
        <h1>{property.title}</h1>
        <p style={{ opacity: 0.8 }}>{property.address}</p>
        <strong style={{ fontSize: '20px' }}>
          ${property.price.toLocaleString('es-AR')}
        </strong>

        <p style={{ marginTop: '16px', lineHeight: 1.5 }}>
          {property.full_description}
        </p>

        {/* CTA */}
        <div style={actions}>
          <button
            style={primaryBtn}
            onClick={async () => {
              const ok = await checkIdentity('visit')
              if (!ok) return

              await fetch('/api/visit-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  property_id: property.id,
                  tenant_id: 'FAKE_TENANT_ID',
                }),
              })

              alert('Solicitud enviada. Te contactamos para coordinar la visita.')
            }}
          >
            Agendar visita
          </button>

          <button
            style={secondaryBtn}
            onClick={async () => {
              const ok = await checkIdentity('whatsapp')
              if (!ok) return

              window.open(whatsappUrl, '_blank')
            }}
          >
            Hablar por WhatsApp
          </button>
        </div>
      </div>

      {/* 🆕 MODAL DE VERIFICACIÓN */}
      <IdentityVerificationModal
        open={showVerify}
        onClose={() => {
          setShowVerify(false)
          setPendingAction(null)
        }}
        onVerify={startVerification}
      />
    </div>
  )
}


/* ================== STYLES ================== */

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#000',
  color: '#fff',
}

const gallery: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '60vh',
  overflow: 'hidden',
}

const media: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const dots: React.CSSProperties = {
  position: 'absolute',
  bottom: '12px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: '8px',
}

const dot: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#fff',
  cursor: 'pointer',
}

const info: React.CSSProperties = {
  padding: '20px',
}

const actions: React.CSSProperties = {
  marginTop: '24px',
  display: 'flex',
  gap: '12px',
}

const primaryBtn: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  borderRadius: '12px',
  background: '#22c55e',
  border: 'none',
  fontSize: '16px',
  cursor: 'pointer',
}

const secondaryBtn: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  borderRadius: '12px',
  background: '#2563eb',
  border: 'none',
  fontSize: '16px',
  cursor: 'pointer',
}
