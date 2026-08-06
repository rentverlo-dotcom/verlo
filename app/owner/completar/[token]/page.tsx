"use client"

import { FormEvent, useMemo, useState } from "react"
import { useParams } from "next/navigation"

type UploadedMedia = {
  key: string
  publicUrl: string | null
  filename: string
  contentType: string
  size: number
  mediaType: "photo" | "video"
}

const availabilityOptions = [
  "Ahora",
  "En 1 a 3 meses",
  "En 6 meses o más",
]

export default function OwnerCompletionPage() {
  const params = useParams()
  const token = String(params.token || "")

  const [privateAddress, setPrivateAddress] = useState("")
  const [floorUnit, setFloorUnit] = useState("")
  const [expensesAmount, setExpensesAmount] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [availabilityStatus, setAvailabilityStatus] = useState("")
  const [requirements, setRequirements] = useState("")
  const [visitConditions, setVisitConditions] = useState("")
  const [propertyNotes, setPropertyNotes] = useState("")
  const [files, setFiles] = useState<File[]>([])

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const selectedFileStats = useMemo(() => {
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
    return {
      count: files.length,
      mb: (totalBytes / 1024 / 1024).toFixed(2),
    }
  }, [files])

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
          deposit_amount: depositAmount,
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

      setMessage("Listo. Recibimos la información de tu propiedad.")
      setFiles([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5efe4] text-[#15120d]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-20%] h-[520px] w-[520px] rounded-full bg-[#d8b46a]/30 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-12%] h-[620px] w-[620px] rounded-full bg-[#ead7b2]/70 blur-3xl" />
        <div className="absolute left-[45%] top-[18%] h-[360px] w-[360px] rounded-full bg-white/60 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-8 md:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.35fr]">
          <aside className="rounded-[2rem] border border-white/60 bg-[#18140f] p-7 text-white shadow-2xl shadow-[#6f5630]/20 md:p-9">
            <p className="mb-8 text-sm font-semibold uppercase tracking-[0.32em] text-[#d8b46a]">
              Verlo
            </p>

            <h1 className="text-4xl font-black leading-[0.95] tracking-[-0.06em] md:text-5xl">
              Completá tu propiedad
            </h1>

            <p className="mt-5 text-base leading-7 text-[#e8decb]">
              Esta información no se publica abierta. La usamos para validar la
              oportunidad y coordinar solo con inquilinos compatibles.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Sin comisión inmobiliaria para el inquilino.",
                "Tu dirección queda privada.",
                "Verlo coordina con perfiles compatibles.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10"
                >
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d8b46a] text-xs font-black text-[#18140f]">
                    ✓
                  </span>
                  <p className="text-sm leading-6 text-[#f7efe0]">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl bg-[#d8b46a] p-5 text-[#18140f]">
              <p className="text-sm font-black uppercase tracking-[0.2em]">
                Importante
              </p>
              <p className="mt-2 text-sm font-semibold leading-6">
                Subí fotos claras y datos reales. Con eso podemos presentar
                mejor tu propiedad y evitar visitas inútiles.
              </p>
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-white/70 bg-white/82 p-5 shadow-2xl shadow-[#8a6a3f]/15 backdrop-blur md:p-8"
          >
            <div className="mb-7 flex flex-col gap-2 border-b border-[#eadfcd] pb-6">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#8a6a3f]">
                Datos privados
              </p>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-[#15120d] md:text-3xl">
                Información para avanzar con inquilinos compatibles
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Dirección exacta">
                <input
                  value={privateAddress}
                  onChange={(event) => setPrivateAddress(event.target.value)}
                  placeholder="Ej: Av. Cabildo 1234"
                  className="field-input"
                />
              </Field>

              <Field label="Piso / unidad">
                <input
                  value={floorUnit}
                  onChange={(event) => setFloorUnit(event.target.value)}
                  placeholder="Ej: 4B"
                  className="field-input"
                />
              </Field>

              <Field label="Expensas aproximadas">
                <input
                  value={expensesAmount}
                  onChange={(event) => setExpensesAmount(event.target.value)}
                  placeholder="Ej: 85000"
                  inputMode="numeric"
                  className="field-input"
                />
              </Field>

              <Field label="Depósito requerido">
                <input
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(event.target.value)}
                  placeholder="Ej: 1 mes / $750.000"
                  className="field-input"
                />
              </Field>

              <Field label="Disponibilidad">
                <select
                  value={availabilityStatus}
                  onChange={(event) =>
                    setAvailabilityStatus(event.target.value)
                  }
                  className="field-input"
                >
                  <option value="">Seleccionar</option>
                  {availabilityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="hidden md:block" />

              <Field label="Requisitos" wide>
                <textarea
                  value={requirements}
                  onChange={(event) => setRequirements(event.target.value)}
                  placeholder="Ej: garantía propietaria, seguro de caución, recibos, mascotas, etc."
                  rows={4}
                  className="field-input min-h-[118px] resize-none"
                />
              </Field>

              <Field label="Condiciones para visita" wide>
                <textarea
                  value={visitConditions}
                  onChange={(event) => setVisitConditions(event.target.value)}
                  placeholder="Ej: se puede visitar por la tarde, coordinar con 24 hs, etc."
                  rows={4}
                  className="field-input min-h-[118px] resize-none"
                />
              </Field>

              <Field label="Notas adicionales" wide>
                <textarea
                  value={propertyNotes}
                  onChange={(event) => setPropertyNotes(event.target.value)}
                  placeholder="Detalles útiles: luminosidad, estado, amoblado, orientación, amenities, etc."
                  rows={4}
                  className="field-input min-h-[118px] resize-none"
                />
              </Field>

              <div className="md:col-span-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-black uppercase tracking-[0.14em] text-[#5c4a2d]">
                    Fotos / videos
                  </span>

                  <div className="rounded-3xl border border-dashed border-[#c7ad78] bg-[#fbf7ef] p-5">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={(event) =>
                        setFiles(Array.from(event.target.files || []))
                      }
                      className="block w-full cursor-pointer rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm font-semibold text-[#15120d] file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#18140f] file:px-5 file:py-3 file:text-sm file:font-black file:text-white hover:file:bg-[#8a6a3f]"
                    />

                    <p className="mt-3 text-sm font-medium leading-6 text-[#6d6256]">
                      Subí fotos claras del ambiente, cocina, baño, vista y
                      detalles relevantes. También podés subir videos cortos.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-5 rounded-3xl bg-[#18140f] p-5 text-white">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-black">
                    {selectedFileStats.count} archivo
                    {selectedFileStats.count === 1 ? "" : "s"} seleccionado
                    {selectedFileStats.count === 1 ? "" : "s"}
                  </p>
                  <p className="rounded-full bg-[#d8b46a] px-3 py-1 text-xs font-black text-[#18140f]">
                    {selectedFileStats.mb} MB
                  </p>
                </div>

                <ul className="grid gap-2 text-sm text-[#f3ead9]">
                  {files.map((file) => (
                    <li
                      key={`${file.name}-${file.size}`}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white/8 px-4 py-3"
                    >
                      <span className="truncate">{file.name}</span>
                      <span className="shrink-0 text-[#d8b46a]">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                {message}
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#18140f] px-7 py-4 text-base font-black text-white shadow-xl shadow-[#18140f]/20 transition hover:-translate-y-0.5 hover:bg-[#8a6a3f] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Enviando..." : "Enviar información"}
              </button>

              <p className="text-sm font-medium leading-6 text-[#6d6256]">
                La carga puede tardar si subís videos pesados.
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <label className={wide ? "block md:col-span-2" : "block"}>
      <span className="mb-2 block text-sm font-black uppercase tracking-[0.14em] text-[#5c4a2d]">
        {label}
      </span>
      {children}
    </label>
  )
}
