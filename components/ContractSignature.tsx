'use client'

import { useRef, useState, useEffect } from 'react'

type Props = {
  onConfirm: (signatureDataUrl: string) => void
  loading?: boolean
}

export default function ContractSignature({ onConfirm, loading }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [drawing, setDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'
  }, [])

  function startDrawing(e: React.PointerEvent) {
    setDrawing(true)
    draw(e)
  }

  function endDrawing() {
    setDrawing(false)
    const ctx = canvasRef.current?.getContext('2d')
    ctx?.beginPath()
  }

  function draw(e: React.PointerEvent) {
    if (!drawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  function clearSignature() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  function handleConfirm() {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    onConfirm(dataUrl)
  }

  return (
    <div className="space-y-4">

      <div className="border border-black rounded bg-white">
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          className="w-full touch-none"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={clearSignature}
          className="border border-black px-4 py-2 text-sm"
        >
          Limpiar
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleConfirm}
          className="bg-black text-white px-6 py-2 text-sm"
        >
          {loading ? 'Firmando…' : 'Confirmar firma'}
        </button>
      </div>

    </div>
  )
}
