'use client'

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

        <p style={{ opacity: 0.85, lineHeight: 1.4 }}>
          Para habilitar contacto, visitas y datos privados necesitamos confirmar
          tu identidad.  
          Es un proceso único y rápido.
        </p>

        <ul style={{ marginTop: 12, fontSize: 14, opacity: 0.9 }}>
          <li>✔️ Se hace una sola vez</li>
          <li>✔️ Menos de 2 minutos</li>
          <li>✔️ Datos protegidos</li>
        </ul>

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
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
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
