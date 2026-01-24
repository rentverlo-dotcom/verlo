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
  height: '56px',
  background: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  zIndex: 100,
}

const backBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#fff',
  fontSize: '22px',
  cursor: 'pointer',
}

const center: React.CSSProperties = {
  flex: 1,
  textAlign: 'center',
}

const titleStyle: React.CSSProperties = {
  fontSize: '14px',
  opacity: 0.85,
}

const right: React.CSSProperties = {
  width: '40px',
  textAlign: 'right',
}

const savedBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#fff',
  fontSize: '20px',
  cursor: 'pointer',
}
