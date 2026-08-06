"use client"

import { FormEvent, useState } from "react"
import { useParams } from "next/navigation"

type UploadedMedia = {
  key: string
  publicUrl: string | null
  filename: string
  contentType: string
  size: number
  mediaType: "photo" | "video"
}

export default function OwnerCompletionPage() {
  const params = useParams()
  const token = String(params.token || "")

  const [privateAddress, setPrivateAddress] = useState("")
  const [floorUnit, setFloorUnit] = useState("")
  const [expensesAmount, setExpensesAmount] = useState("")
  const [availabilityStatus, setAvailabilityStatus] = useState("")
  const [requirements, setRequirements] = useState("")
  const [visitConditions, setVisitConditions] = useState("")
  const [propertyNotes, setPropertyNotes] = useState("")
  const [files, setFiles] = useState<File[]>([])

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function uploadFile(file: File): Promise<UploadedMedia> {
    const presignResponse = await fetch("/api/r2/presign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        folder: "owner-media",
        id: token,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    })

    const presignData = await presignResponse.json()

    if (!presignResponse.ok) {
      throw new Error(presignData?.error || "No se pudo preparar la subida")
    }

    const uploadResponse = await fetch(presignData.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Falló la subida de ${file.name}`)
    }

    return {
      key: presignData.key,
      publicUrl: presignData.publicUrl || null,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      mediaType: file.type?.startsWith("video/") ? "video" : "photo",
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setError("")
    setMessage("")

    try {
      const uploadedMedia: UploadedMedia[] = []

      for (const file of files) {
        const uploaded = await uploadFile(file)
        uploadedMedia.push(uploaded)
      }

      const response = await fetch("/api/owner-completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          private_address: privateAddress,
          floor_unit: floorUnit,
          expenses_amount: expensesAmount,
          availability_status: availabilityStatus,
          requirements,
          visit_conditions: visitConditions,
          property_notes: propertyNotes,
          media: uploadedMedia,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo guardar la información")
      }

      setMessage("Listo. Recibimos la información de la propiedad.")
      setFiles([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-5 py-10 text-[#1f1a14]">
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#8a6a3f]">
            Verlo
          </p>

          <h1 className="text-3xl font-bold">
            Completá los datos de tu propiedad
          </h1>

          <p className="mt-3 text-base text-[#5d554b]">
            Esta información no se publica abierta. La usamos para validar la
            oportunidad y coordinar solo con inquilinos compatibles.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block font-medium">Dirección exacta</span>
            <input
              value={privateAddress}
              onChange={(event) => setPrivateAddress(event.target.value)}
              placeholder="Ej: Av. Cabildo 1234"
              className="w-full rounded-xl border border-[#ddd3c3] px-4 py-3 outline-none focus:border-[#8a6a3f]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-medium">Piso / unidad</span>
            <input
              value={floorUnit}
              onChange={(event) => setFloorUnit(event.target.value)}
              placeholder="Ej: 4B"
              className="w-full rounded-xl border border-[#ddd3c3] px-4 py-3 outline-none focus:border-[#8a6a3f]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-medium">Expensas aproximadas</span>
            <input
              value={expensesAmount}
              onChange={(event) => setExpensesAmount(event.target.value)}
              placeholder="Ej: 85000"
              inputMode="numeric"
              className="w-full rounded-xl border border-[#ddd3c3] px-4 py-3 outline-none focus:border-[#8a6a3f]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-medium">Disponibilidad</span>
            <select
              value={availabilityStatus}
              onChange={(event) => setAvailabilityStatus(event.target.value)}
              className="w-full rounded-xl border border-[#ddd3c3] px-4 py-3 outline-none focus:border-[#8a6a3f]"
            >
              <option value="">Seleccionar</option>
              <option value="Ahora">Ahora</option>
              <option value="En 1 a 3 meses">En 1 a 3 meses</option>
              <option value="En 6 meses o más">En 6 meses o más</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-medium">Requisitos</span>
            <textarea
              value={requirements}
              onChange={(event) => setRequirements(event.target.value)}
              placeholder="Ej: garantía propietaria, seguro de caución, recibos, etc."
              rows={4}
              className="w-full rounded-xl border border-[#ddd3c3] px-4 py-3 outline-none focus:border-[#8a6a3f]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-medium">
              Condiciones para visita
            </span>
            <textarea
              value={visitConditions}
              onChange={(event) => setVisitConditions(event.target.value)}
              placeholder="Ej: se puede visitar por la tarde, coordinar con 24 hs, etc."
              rows={4}
              className="w-full rounded-xl border border-[#ddd3c3] px-4 py-3 outline-none focus:border-[#8a6a3f]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-medium">Notas adicionales</span>
            <textarea
              value={propertyNotes}
              onChange={(event) => setPropertyNotes(event.target.value)}
              placeholder="Detalles útiles: luminosidad, mascotas, estado, amoblado, etc."
              rows={4}
              className="w-full rounded-xl border border-[#ddd3c3] px-4 py-3 outline-none focus:border-[#8a6a3f]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-medium">Fotos / videos</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(event) =>
                setFiles(Array.from(event.target.files || []))
              }
              className="w-full rounded-xl border border-dashed border-[#b9a98f] bg-[#fbf8f1] px-4 py-5"
            />
            <span className="mt-2 block text-sm text-[#6d6256]">
              Podés subir varias fotos y videos cortos.
            </span>
          </label>

          {files.length > 0 && (
            <div className="rounded-xl bg-[#fbf8f1] p-4 text-sm">
              <p className="mb-2 font-semibold">Archivos seleccionados:</p>
              <ul className="space-y-1">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}`}>
                    {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#1f1a14] px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar información"}
          </button>
        </form>
      </section>
    </main>
  )
}
