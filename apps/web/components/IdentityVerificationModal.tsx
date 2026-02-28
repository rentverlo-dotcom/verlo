'use client'

import Link from 'next/link'

type Props = {
  open: boolean
  onClose: () => void
  onVerify: () => void
}

export default function IdentityVerificationModal({
  open,
  onClose,
  onVerify,
}: Props) {
  if (!open) return null

  return (
    <div style={backdrop}>
      <div style={modal}>
        <h2 style={{ marginBottom: 8 }}>Verificación de identidad</h2>

        <p style={{ opacity: 0.9, lineHeight: 1.5 }}>
          Para habilitar contacto, visitas y datos privados necesitamos confirmar
          tu identidad.  
          Es un proceso único, rápido y seguro.
        </p>

        <ul style={{ marginTop: 12, fontSize: 14, opacity: 0.9 }}>
          <li>✔️ Se hace una sola vez</li>
          <li>✔️ Dura menos de 2 minutos</li>
          <li>✔️ No guardamos tus datos biométricos</li>
        </ul>

        <p style={consent}>
          Al continuar, autorizás la verificación de tu identidad conforme a
          nuestros{' '}
          <Link href="/terminos">Términos</Link> y{' '}
          <Link href="/privacidad">Política de Privacidad</Link>.
        </p>

        <div style={actions}>
          <button style={secondary} onClick={onClose}>
            Ahora no
          </button>
          <button style={primary} onClick={onVerify}>
            Verificar identidad
          </button>
        </div>
      </div>
    </div>
  )
}

const backdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
}

const modal: React.CSSProperties = {
  width: 360,
  background: '#111',
  color: '#fff',
  borderRadius: 16,
  padding: 20,
}

const actions: React.CSSProperties = {
  marginTop: 20,
  display: 'flex',
  gap: 12,
}

const primary: React.CSSProperties = {
  flex: 1,
  background: '#22c55e',
  border: 'none',
  borderRadius: 10,
  padding: 12,
  cursor: 'pointer',
  fontWeight: 600,
}

const secondary: React.CSSProperties = {
  flex: 1,
  background: '#333',
  border: 'none',
  borderRadius: 10,
  padding: 12,
  cursor: 'pointer',
  color: '#fff',
}

const consent: React.CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  opacity: 0.75,
}
