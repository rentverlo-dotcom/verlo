//components/FlowHeader.tsx
'use client'

import { useRouter } from 'next/navigation'

type Props = {
  title?: string
  showSaved?: boolean
}

export default function FlowHeader({ title, showSaved }: Props) {
  const router = useRouter()

  return (
    <div style={header}>
      <button onClick={() => router.back()} style={backBtn}>
        ←
      </button>

      <div style={center}>
        {title && <span style={titleStyle}>{title}</span>}
      </div>

      <div style={right}>
        {showSaved && (
          <button
            onClick={() => router.push('/guardadas')}
            style={savedBtn}
            title="Ver guardadas"
          >
            👁️
          </button>
        )}
      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const header: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '64px',
  background: 'rgba(255,255,255,0.8)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  padding: '0 24px',
  zIndex: 100,
  borderBottom: '1px solid #e2e8f0',
}

const backBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#0f172a',
  fontSize: '20px',
  cursor: 'pointer',
  opacity: 0.8,
}

const center: React.CSSProperties = {
  flex: 1,
  textAlign: 'center',
}

const titleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#0f172a',
  fontWeight: 600,
  letterSpacing: '0.3px',
}

const right: React.CSSProperties = {
  width: '40px',
  textAlign: 'right',
}

const savedBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#0f172a',
  fontSize: '18px',
  cursor: 'pointer',
  opacity: 0.8,
}
