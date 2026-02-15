'use client'

import SignatureCanvas from 'react-signature-canvas'
import { useRef } from 'react'

type ContractSignatureProps = {
  onSign: (signature: string) => Promise<void>
}

export default function ContractSignature({ onSign }: ContractSignatureProps) {
  const sigRef = useRef<SignatureCanvas>(null)

  const handleSave = async () => {
    if (!sigRef.current) return

    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png')

    await onSign(dataUrl)
  }

  const handleClear = () => {
    sigRef.current?.clear()
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="border border-neutral-400 rounded bg-white">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            width: 500,
            height: 200,
            className: 'w-full h-48'
          }}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleClear}
          className="border border-black px-4 py-2 text-sm"
        >
          Limpiar
        </button>

        <button
          onClick={handleSave}
          className="bg-black text-white px-6 py-2 text-sm"
        >
          Firmar
        </button>
      </div>
    </div>
  )
}
