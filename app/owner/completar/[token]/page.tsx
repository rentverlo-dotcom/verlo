"use client"

import { FormEvent, useMemo, useState, type ReactNode } from "react"
import { useParams } from "next/navigation"
import VerloBrand from "@/components/VerloBrand"

type UploadedMedia = {
  key: string
  publicUrl: string | null
  filename: string
  contentType: string
  size: number
  mediaType: "photo" | "video"
}

const AVAILABILITY_OPTIONS = [
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
          requirements:
            [
              depositAmount ? `Depósito requerido: ${depositAmount}` : "",
              requirements,
            ]
              .filter(Boolean)
              .join("\n\n") || null,
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
    <main className="owners-root">
      <style>{styles}</style>

      <nav className="nav">
        <div className="container nav-inner">
          <VerloBrand width={34} />

          <div className="nav-links">
            <a href="#datos">Datos</a>
            <a href="mailto:hola@verlo.lat">Contacto</a>
            <a href="#formulario" className="nav-cta">
              Completar
            </a>
          </div>
        </div>
      </nav>

      <section className="owner-hero">
        <div className="container owner-hero-grid">
          <div>
            <p className="eyebrow">Propietarios / Verlo</p>

            <h1>Completá tu propiedad para avanzar con matches reales.</h1>

            <p className="hero-copy">
              Esta información no se publica abierta. La usamos para validar la
              oportunidad y coordinar solo con inquilinos compatibles.
            </p>

            <div className="hero-actions">
              <a href="#formulario" className="primary-btn">
                Cargar información
              </a>
              <a href="/propietarios" className="secondary-btn">
                Volver a propietarios
              </a>
            </div>

            <div className="trust-row">
              <span>Tu dirección queda privada</span>
              <span>Verlo filtra interesados</span>
              <span>Sin grupo de WhatsApp</span>
              <span>Coordinación trazable</span>
            </div>
          </div>

          <aside className="hero-card">
            <div className="hero-card-top">
              <p>Estado</p>
              <strong>Validación</strong>
            </div>

            <div className="mini-demand-list">
              <div className="mini-demand-item">
                <span>Dirección</span>
                <strong>Privada</strong>
              </div>

              <div className="mini-demand-item">
                <span>Fotos / videos</span>
                <strong>R2</strong>
              </div>

              <div className="mini-demand-item">
                <span>Inquilinos</span>
                <strong>Filtrados</strong>
              </div>

              <div className="mini-demand-item">
                <span>Contacto</span>
                <strong>Verlo</strong>
              </div>
            </div>

            <div className="hero-note">
              Subí fotos claras y datos reales. Con eso podemos presentar mejor
              tu propiedad y evitar visitas inútiles.
            </div>
          </aside>
        </div>
      </section>

      <section id="datos" className="section soft-section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Qué necesitamos</p>
            <h2>Datos privados para coordinar mejor.</h2>
            <p>
              No es una publicación abierta. La dirección, condiciones y material
              visual se usan para validar la oportunidad antes de presentarla a
              inquilinos compatibles.
            </p>
          </div>

          <div className="steps-grid">
            <article>
              <b>1</b>
              <h3>Datos internos</h3>
              <p>
                Dirección exacta, piso, expensas, depósito y disponibilidad real
                de la propiedad.
              </p>
            </article>

            <article>
              <b>2</b>
              <h3>Condiciones</h3>
              <p>
                Requisitos, garantías aceptadas, condiciones para visitar y notas
                importantes.
              </p>
            </article>

            <article>
              <b>3</b>
              <h3>Fotos y videos</h3>
              <p>
                Material visual para evaluar y presentar correctamente la
                oportunidad.
              </p>
            </article>

            <article>
              <b>4</b>
              <h3>Coordinación</h3>
              <p>
                Verlo valida el match y coordina el avance con trazabilidad, sin
                exponer tus datos de entrada.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="formulario" className="section form-section">
        <div className="container form-grid">
          <div>
            <p className="eyebrow">Completar propiedad</p>
            <h2>Información para avanzar con inquilinos compatibles</h2>
            <p>
              Completá estos datos para que Verlo pueda revisar la oportunidad,
              ordenar la información y avanzar solo con perfiles compatibles.
            </p>

            <div className="promise-card">
              <strong>Tu propiedad no se publica abierta</strong>
              <span>
                La usamos internamente para coordinar mejor, validar el match y
                evitar exposición innecesaria.
              </span>
            </div>
          </div>

          <form className="owner-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <Field label="Dirección exacta">
                <input
                  value={privateAddress}
                  onChange={(event) => setPrivateAddress(event.target.value)}
                  placeholder="Ej: Av. Cabildo 1234"
                  required
                />
              </Field>

              <Field label="Piso / unidad">
                <input
                  value={floorUnit}
                  onChange={(event) => setFloorUnit(event.target.value)}
                  placeholder="Ej: 4B"
                />
              </Field>
            </div>

            <div className="form-row">
              <Field label="Expensas aproximadas">
                <input
                  value={expensesAmount}
                  onChange={(event) => setExpensesAmount(event.target.value)}
                  placeholder="Ej: 85000"
                  inputMode="numeric"
                />
              </Field>

              <Field label="Depósito requerido">
                <input
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(event.target.value)}
                  placeholder="Ej: 1 mes / $750.000"
                />
              </Field>
            </div>

            <Field label="Disponibilidad">
              <select
                value={availabilityStatus}
                onChange={(event) => setAvailabilityStatus(event.target.value)}
                required
              >
                <option value="" disabled>
                  Elegí una opción
                </option>
                {AVAILABILITY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Requisitos">
              <textarea
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
                placeholder="Ej: garantía propietaria, seguro de caución, recibos, mascotas, contrato mínimo, etc."
                rows={4}
              />
            </Field>

            <Field label="Condiciones para visita">
              <textarea
                value={visitConditions}
                onChange={(event) => setVisitConditions(event.target.value)}
                placeholder="Ej: se puede visitar por la tarde, coordinar con 24 hs, días disponibles, etc."
                rows={4}
              />
            </Field>

            <Field label="Notas adicionales">
              <textarea
                value={propertyNotes}
                onChange={(event) => setPropertyNotes(event.target.value)}
                placeholder="Detalles útiles: luminosidad, estado, amoblado, orientación, amenities, mascotas, etc."
                rows={4}
              />
            </Field>

            <label className="media-box">
              <span>Fotos / videos</span>

              <div className="file-drop">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(event) =>
                    setFiles(Array.from(event.target.files || []))
                  }
                />

                <p>
                  Subí fotos claras del ambiente, cocina, baño, vista y detalles
                  relevantes. También podés subir videos cortos.
                </p>
              </div>
            </label>

            {files.length > 0 ? (
              <div className="selected-files">
                <div className="selected-files-head">
                  <strong>
                    {selectedFileStats.count} archivo
                    {selectedFileStats.count === 1 ? "" : "s"} seleccionado
                    {selectedFileStats.count === 1 ? "" : "s"}
                  </strong>
                  <span>{selectedFileStats.mb} MB</span>
                </div>

                <ul>
                  {files.map((file) => (
                    <li key={`${file.name}-${file.size}`}>
                      <span>{file.name}</span>
                      <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {error ? <p className="form-message error">{error}</p> : null}
            {message ? <p className="form-message success">{message}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar información"}
            </button>

            <p className="upload-note">
              La carga puede tardar si subís videos pesados. No cierres esta
              pantalla hasta ver la confirmación.
            </p>
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <VerloBrand width={86} />
            <p>Alquiler directo, seguro y sin comisión.</p>
          </div>

          <nav className="footer-links">
            <a href="/terminos">Términos y condiciones</a>
            <a href="/privacidad">Política de privacidad</a>
            <a href="mailto:hola@verlo.lat">Contacto</a>
          </nav>
        </div>
      </footer>
    </main>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label>
      {label}
      {children}
    </label>
  )
}

const styles = `
  .owners-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --paper: #fffaf8;
    min-height: 100vh;
    background:
      radial-gradient(circle at 84% 10%, rgba(242,168,169,.48), transparent 28%),
      radial-gradient(circle at 10% 48%, rgba(195,121,134,.16), transparent 26%),
      var(--soft);
    color: var(--black);
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .owners-root * {
    box-sizing: border-box;
  }

  .container {
    width: min(1160px, calc(100% - 40px));
    margin: 0 auto;
  }

  .nav {
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(18px);
    background: rgba(242, 235, 236, 0.84);
    border-bottom: 1px solid rgba(5, 0, 2, 0.08);
  }

  .nav-inner {
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 18px;
    font-size: 14px;
  }

  .nav-links a {
    color: rgba(5, 0, 2, 0.72);
    text-decoration: none;
    font-weight: 900;
  }

  .nav-cta {
    padding: 10px 18px;
    border-radius: 999px;
    background: var(--black);
    color: white !important;
    min-width: 118px;
    text-align: center;
  }

  .owner-hero {
    padding: 88px 0 76px;
  }

  .owner-hero-grid {
    display: grid;
    grid-template-columns: 1.04fr 0.96fr;
    gap: 56px;
    align-items: center;
  }

  .eyebrow {
    margin: 0;
    color: var(--pink-dark);
    text-transform: uppercase;
    letter-spacing: .14em;
    font-size: 12px;
    font-weight: 950;
  }

  h1 {
    margin: 18px 0 0;
    font-size: clamp(48px, 7vw, 92px);
    line-height: .88;
    letter-spacing: -.085em;
    max-width: 900px;
  }

  h2 {
    margin: 10px 0 0;
    font-size: clamp(34px, 4.6vw, 64px);
    line-height: .92;
    letter-spacing: -.075em;
  }

  h3 {
    margin: 16px 0 0;
    font-size: 22px;
    line-height: 1;
    letter-spacing: -.045em;
  }

  .hero-copy {
    margin: 24px 0 0;
    max-width: 720px;
    color: rgba(5, 0, 2, .68);
    font-size: 20px;
    line-height: 1.48;
    font-weight: 650;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 30px;
  }

  .primary-btn,
  .secondary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 54px;
    padding: 0 22px;
    border-radius: 999px;
    font-weight: 950;
    text-decoration: none;
  }

  .primary-btn {
    background: var(--black);
    color: white;
    box-shadow: 0 18px 42px rgba(5,0,2,.18);
  }

  .secondary-btn {
    color: var(--black);
    background: rgba(255,255,255,.62);
    border: 1px solid rgba(5,0,2,.1);
  }

  .trust-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 26px;
  }

  .trust-row span {
    padding: 9px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,.58);
    border: 1px solid rgba(5,0,2,.08);
    color: rgba(5,0,2,.64);
    font-size: 13px;
    font-weight: 850;
  }

  .hero-card {
    padding: 28px;
    border-radius: 38px;
    background: rgba(255,255,255,.78);
    border: 1px solid rgba(5,0,2,.09);
    box-shadow: 0 28px 80px rgba(5,0,2,.1);
  }

  .hero-card-top {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .hero-card-top p {
    margin: 0;
    color: var(--pink-dark);
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .12em;
    font-size: 11px;
  }

  .hero-card-top strong {
    font-size: 22px;
    letter-spacing: -.05em;
  }

  .mini-demand-list {
    display: grid;
    gap: 12px;
  }

  .mini-demand-item {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    padding: 16px;
    border-radius: 22px;
    background: var(--paper);
    border: 1px solid rgba(5,0,2,.08);
  }

  .mini-demand-item span {
    font-weight: 950;
    letter-spacing: -.03em;
  }

  .mini-demand-item strong {
    color: var(--pink-dark);
    font-size: 20px;
    font-weight: 950;
  }

  .hero-note {
    margin-top: 18px;
    padding: 18px;
    border-radius: 24px;
    background: var(--black);
    color: white;
    font-weight: 850;
    line-height: 1.35;
  }

  .section {
    padding: 74px 0;
  }

  .soft-section {
    background: rgba(255,255,255,.34);
    border-block: 1px solid rgba(5,0,2,.06);
  }

  .section-head {
    max-width: 860px;
    margin-bottom: 30px;
  }

  .section-head p:not(.eyebrow) {
    margin: 16px 0 0;
    color: rgba(5,0,2,.62);
    font-size: 18px;
    line-height: 1.5;
  }

  .steps-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .steps-grid article {
    padding: 24px;
    min-height: 280px;
    border-radius: 30px;
    background: rgba(255,255,255,.74);
    border: 1px solid rgba(5,0,2,.08);
  }

  .steps-grid b {
    display: inline-flex;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    background: var(--black);
    color: white;
    font-size: 18px;
  }

  .steps-grid p {
    margin: 14px 0 0;
    color: rgba(5,0,2,.62);
    line-height: 1.45;
  }

  .form-section {
    padding-bottom: 94px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: .85fr 1.15fr;
    gap: 48px;
    align-items: start;
  }

  .form-grid > div > p:not(.eyebrow) {
    margin: 18px 0 0;
    color: rgba(5,0,2,.64);
    font-size: 19px;
    line-height: 1.5;
  }

  .promise-card {
    margin-top: 28px;
    padding: 22px;
    border-radius: 28px;
    background: var(--black);
    color: white;
    display: grid;
    gap: 8px;
  }

  .promise-card strong {
    font-size: 20px;
    letter-spacing: -.04em;
  }

  .promise-card span {
    color: rgba(255,255,255,.76);
    line-height: 1.4;
  }

  .owner-form {
    padding: 28px;
    border-radius: 34px;
    background: rgba(255,255,255,.78);
    border: 1px solid rgba(5,0,2,.08);
    box-shadow: 0 26px 70px rgba(5,0,2,.08);
    display: grid;
    gap: 16px;
  }

  .owner-form label,
  .media-box {
    display: grid;
    gap: 8px;
    font-size: 13px;
    font-weight: 950;
    color: rgba(5,0,2,.72);
  }

  .owner-form input,
  .owner-form select,
  .owner-form textarea {
    width: 100%;
    border: 1px solid rgba(5,0,2,.12);
    border-radius: 18px;
    background: #fffaf8;
    color: var(--black);
    font: inherit;
    font-size: 15px;
    padding: 15px 16px;
    outline: none;
  }

  .owner-form textarea {
    resize: vertical;
  }

  .owner-form input:focus,
  .owner-form select:focus,
  .owner-form textarea:focus {
    border-color: var(--pink-dark);
    box-shadow: 0 0 0 4px rgba(242,168,169,.22);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .file-drop {
    padding: 18px;
    border-radius: 26px;
    background: #fffaf8;
    border: 1px dashed rgba(195, 121, 134, .42);
  }

  .file-drop input {
    padding: 12px;
    background: white;
    cursor: pointer;
  }

  .file-drop input::file-selector-button {
    margin-right: 14px;
    border: 0;
    border-radius: 999px;
    background: var(--black);
    color: white;
    padding: 12px 18px;
    font-weight: 950;
    cursor: pointer;
  }

  .file-drop input::file-selector-button:hover {
    background: var(--pink-dark);
  }

  .file-drop p {
    margin: 12px 0 0;
    color: rgba(5,0,2,.58);
    line-height: 1.45;
    font-weight: 750;
  }

  .selected-files {
    padding: 18px;
    border-radius: 26px;
    background: var(--black);
    color: white;
  }

  .selected-files-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    margin-bottom: 12px;
  }

  .selected-files-head strong {
    font-size: 15px;
    letter-spacing: -.02em;
  }

  .selected-files-head span {
    display: inline-flex;
    padding: 7px 10px;
    border-radius: 999px;
    background: var(--pink);
    color: var(--black);
    font-size: 12px;
    font-weight: 950;
  }

  .selected-files ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }

  .selected-files li {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: center;
    padding: 12px 14px;
    border-radius: 18px;
    background: rgba(255,255,255,.08);
  }

  .selected-files li span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: rgba(255,255,255,.88);
  }

  .selected-files li small {
    flex-shrink: 0;
    color: var(--pink);
    font-weight: 900;
  }

  .owner-form button {
    margin-top: 4px;
    min-height: 58px;
    border: 0;
    border-radius: 999px;
    background: var(--black);
    color: white;
    font-size: 16px;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
  }

  .owner-form button:hover {
    background: var(--pink-dark);
  }

  .owner-form button:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .upload-note {
    margin: -2px 0 0;
    color: rgba(5,0,2,.58);
    font-size: 13px;
    line-height: 1.4;
    font-weight: 750;
  }

  .form-message {
    margin: 0;
    padding: 14px 16px;
    border-radius: 18px;
    font-weight: 850;
    line-height: 1.35;
  }

  .form-message.success {
    background: rgba(92, 180, 126, .16);
    color: #245b38;
  }

  .form-message.error {
    background: rgba(195, 70, 70, .13);
    color: #802727;
  }

  .footer {
    padding: 54px 0;
    border-top: 1px solid rgba(5, 0, 2, 0.1);
    background: rgba(255, 255, 255, 0.34);
  }

  .footer-inner {
    display: flex;
    justify-content: space-between;
    gap: 32px;
    align-items: flex-start;
    color: rgba(5, 0, 2, 0.58);
    font-size: 14px;
  }

  .footer-brand {
    display: grid;
    gap: 12px;
  }

  .footer-brand p {
    margin: 0;
    max-width: 280px;
    line-height: 1.45;
    color: rgba(5, 0, 2, 0.62);
    font-weight: 700;
  }

  .footer-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 16px 22px;
  }

  .footer-links a {
    color: rgba(5, 0, 2, 0.66);
    text-decoration: none;
    font-weight: 800;
  }

  @media (max-width: 900px) {
    .nav-links a:not(.nav-cta) {
      display: none;
    }

    .owner-hero-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }

    .owner-hero {
      padding-top: 58px;
    }

    .steps-grid {
      grid-template-columns: 1fr 1fr;
    }

    .footer-inner {
      align-items: flex-start;
      flex-direction: column;
    }

    .footer-links {
      justify-content: flex-start;
    }
  }

  @media (max-width: 620px) {
    .container {
      width: min(100% - 26px, 1160px);
    }

    .nav-inner {
      height: 68px;
    }

    h1 {
      font-size: 48px;
    }

    h2 {
      font-size: 38px;
    }

    .steps-grid,
    .form-row {
      grid-template-columns: 1fr;
    }

    .owner-form {
      padding: 20px;
      border-radius: 28px;
    }

    .hero-actions {
      display: grid;
    }

    .primary-btn,
    .secondary-btn {
      width: 100%;
    }
  }
`
