"use client"

import { FormEvent, useState, type ReactNode } from "react"
import { useParams, useRouter } from "next/navigation"
import VerloBrand from "@/components/VerloBrand"
const CONTACT_HREF =
  "https://mail.zoho.com/zm/#compose?to=hola@verlo.lat&subject=Consulta%20Verlo"

type DocType =
  | "dni_front"
  | "dni_back"
  | "selfie"
  | "income_proof"
  | "guarantee_proof"

type UploadedDocs = Partial<Record<DocType, string>>

const employmentOptions = [
  "Relación de dependencia",
  "Monotributista",
  "Autónomo",
  "Comerciante / emprendedor",
  "Jubilado",
  "Estudiante con garante",
  "Otro",
]

const incomeOptions = [
  "Menos de $500.000",
  "$500.000 a $800.000",
  "$800.000 a $1.200.000",
  "$1.200.000 a $1.800.000",
  "$1.800.000 a $2.500.000",
  "Más de $2.500.000",
]

const guaranteeOptions = [
  "Garantía propietaria",
  "Seguro de caución",
  "Recibos de sueldo",
  "Aval familiar",
  "Depósito adelantado",
  "Otro",
]

export default function TenantValidationPage() {
  const params = useParams()
  const router = useRouter()
  const token = String(params.token || "")

  const [documentNumber, setDocumentNumber] = useState("")
  const [employmentStatus, setEmploymentStatus] = useState("")
  const [incomeRange, setIncomeRange] = useState("")
  const [guaranteeType, setGuaranteeType] = useState("")
  const [moveNotes, setMoveNotes] = useState("")

  const [dniFront, setDniFront] = useState<File | null>(null)
  const [dniBack, setDniBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [incomeProof, setIncomeProof] = useState<File | null>(null)
  const [guaranteeProof, setGuaranteeProof] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function uploadDocument(docType: DocType, file: File) {
    const presignResponse = await fetch("/api/tenant-verification/presign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        docType,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    })

    const presignData = await presignResponse.json()

    if (!presignResponse.ok) {
      throw new Error(presignData?.error || "No se pudo preparar la subida")
    }

    const uploadResponse = await fetch(presignData.signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Falló la subida de ${file.name}`)
    }

    return presignData.path as string
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setError("")

    try {
      const documents: UploadedDocs = {}

      if (dniFront) {
        documents.dni_front = await uploadDocument("dni_front", dniFront)
      }

      if (dniBack) {
        documents.dni_back = await uploadDocument("dni_back", dniBack)
      }

      if (selfie) {
        documents.selfie = await uploadDocument("selfie", selfie)
      }

      if (incomeProof) {
        documents.income_proof = await uploadDocument(
          "income_proof",
          incomeProof
        )
      }

      if (guaranteeProof) {
        documents.guarantee_proof = await uploadDocument(
          "guarantee_proof",
          guaranteeProof
        )
      }

      const response = await fetch("/api/tenant-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          document_number: documentNumber,
          employment_status: employmentStatus,
          income_range: incomeRange,
          guarantee_type: guaranteeType,
          move_notes: moveNotes,
          documents,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo guardar la validación")
      }

      router.push(`/tenant/validacion/${token}/success`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="tenant-root">
      <style>{styles}</style>

      <nav className="nav">
        <div className="container nav-inner">
          <VerloBrand width={34} />

          <div className="nav-links">
            <a href="/">Inicio</a>
            <a href="#datos">Datos</a>
           <a href={CONTACT_HREF} target="_blank" rel="noopener noreferrer">
  Contacto
</a>
            <a href="#formulario" className="nav-cta">
              Validar
            </a>
          </div>
        </div>
      </nav>

      <section className="tenant-hero">
        <div className="container tenant-hero-grid">
          <div>
            <p className="eyebrow">Inquilinos / Verlo</p>

            <h1>Validá tu perfil para avanzar con propietarios compatibles.</h1>

            <p className="hero-copy">
              Esta información no se publica. La usamos para presentarte mejor
              ante propietarios y ordenar el proceso antes de una visita o
              contrato.
            </p>

            <div className="hero-actions">
              <a href="#formulario" className="primary-btn">
                Completar validación
              </a>
              <a href="/" className="secondary-btn">
                Volver al inicio
              </a>
            </div>

            <div className="trust-row">
              <span>Documentación privada</span>
              <span>Validación manual</span>
              <span>Mejor presentación ante owner</span>
              <span>Proceso trazable</span>
            </div>
          </div>

          <aside className="hero-card">
            <div className="hero-card-top">
              <p>Perfil</p>
              <strong>Validación</strong>
            </div>

            <div className="mini-demand-list">
              <div className="mini-demand-item">
                <span>DNI</span>
                <strong>Privado</strong>
              </div>

              <div className="mini-demand-item">
                <span>Ingresos</span>
                <strong>Revisado</strong>
              </div>

              <div className="mini-demand-item">
                <span>Garantía</span>
                <strong>Ordenada</strong>
              </div>

              <div className="mini-demand-item">
                <span>Owner</span>
                <strong>Filtrado</strong>
              </div>
            </div>

            <div className="hero-note">
              Cuanto más claro esté tu perfil, más fácil es avanzar con un
              propietario sin perder tiempo.
            </div>
          </aside>
        </div>
      </section>

      <section id="datos" className="section soft-section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Qué validamos</p>
            <h2>Datos mínimos para presentarte bien.</h2>
            <p>
              Verlo no comparte documentos sensibles de entrada. Primero ordena
              el perfil y después acompaña el avance con el propietario.
            </p>
          </div>

          <div className="steps-grid">
            <article>
              <b>1</b>
              <h3>Identidad</h3>
              <p>DNI frente, dorso y selfie para validar que sos una persona real.</p>
            </article>

            <article>
              <b>2</b>
              <h3>Ingresos</h3>
              <p>Situación laboral, rango de ingresos y comprobante disponible.</p>
            </article>

            <article>
              <b>3</b>
              <h3>Garantía</h3>
              <p>Garantía propietaria, seguro de caución, recibos o aval familiar.</p>
            </article>

            <article>
              <b>4</b>
              <h3>Presentación</h3>
              <p>Ordenamos tu perfil para avanzar con propietarios compatibles.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="formulario" className="section form-section">
        <div className="container form-grid">
          <div>
            <p className="eyebrow">Validación tenant</p>
            <h2>Completá tu perfil antes de avanzar</h2>
            <p>
              Estos datos ayudan a que Verlo pueda presentarte de forma seria y
              ordenada ante propietarios compatibles.
            </p>

            <div className="promise-card">
              <strong>Tu documentación queda privada</strong>
              <span>
                No se publica abierta. La usa Verlo para validar el perfil y
                coordinar el avance con mayor confianza.
              </span>
            </div>
          </div>

          <form className="tenant-form" onSubmit={handleSubmit}>
            <Field label="DNI / documento">
              <input
                value={documentNumber}
                onChange={(event) => setDocumentNumber(event.target.value)}
                placeholder="Ej: 30123456"
                required
              />
            </Field>

            <div className="form-row">
              <Field label="Situación laboral">
                <select
                  value={employmentStatus}
                  onChange={(event) => setEmploymentStatus(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Elegí una opción
                  </option>
                  {employmentOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Rango de ingresos">
                <select
                  value={incomeRange}
                  onChange={(event) => setIncomeRange(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Elegí una opción
                  </option>
                  {incomeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Garantía / respaldo">
              <select
                value={guaranteeType}
                onChange={(event) => setGuaranteeType(event.target.value)}
                required
              >
                <option value="" disabled>
                  Elegí una opción
                </option>
                {guaranteeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <div className="docs-grid">
              <FileField
                label="DNI frente"
                file={dniFront}
                setFile={setDniFront}
                required
              />

              <FileField
                label="DNI dorso"
                file={dniBack}
                setFile={setDniBack}
                required
              />

              <FileField
                label="Selfie"
                file={selfie}
                setFile={setSelfie}
                required
              />

              <FileField
                label="Comprobante de ingresos"
                file={incomeProof}
                setFile={setIncomeProof}
              />

              <FileField
                label="Garantía / seguro / caución"
                file={guaranteeProof}
                setFile={setGuaranteeProof}
              />
            </div>

            <Field label="Notas adicionales">
              <textarea
                value={moveNotes}
                onChange={(event) => setMoveNotes(event.target.value)}
                placeholder="Ej: fecha ideal de mudanza, si tenés mascotas, quién viviría en la propiedad, aclaraciones de garantía, etc."
                rows={4}
              />
            </Field>

            {error ? <p className="form-message error">{error}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar validación"}
            </button>

            <p className="upload-note">
              La carga puede tardar si los archivos son pesados. No cierres esta
              pantalla hasta terminar.
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
            <a href="/">Inicio</a>
            <a href="/propietarios">Propietarios</a>
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

function FileField({
  label,
  file,
  setFile,
  required = false,
}: {
  label: string
  file: File | null
  setFile: (file: File | null) => void
  required?: boolean
}) {
  return (
    <label className="file-field">
      <span>{label}</span>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        required={required}
        onChange={(event) => setFile(event.target.files?.[0] || null)}
      />

      {file ? (
        <small>
          {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
        </small>
      ) : (
        <small>JPG, PNG, WEBP o PDF</small>
      )}
    </label>
  )
}

const styles = `
  .tenant-root {
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

  .tenant-root * {
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
    min-width: 102px;
    text-align: center;
  }

  .tenant-hero {
    padding: 88px 0 76px;
  }

  .tenant-hero-grid {
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

  .tenant-form {
    padding: 28px;
    border-radius: 34px;
    background: rgba(255,255,255,.78);
    border: 1px solid rgba(5,0,2,.08);
    box-shadow: 0 26px 70px rgba(5,0,2,.08);
    display: grid;
    gap: 16px;
  }

  .tenant-form label {
    display: grid;
    gap: 8px;
    font-size: 13px;
    font-weight: 950;
    color: rgba(5,0,2,.72);
  }

  .tenant-form input,
  .tenant-form select,
  .tenant-form textarea {
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

  .tenant-form textarea {
    resize: vertical;
  }

  .tenant-form input:focus,
  .tenant-form select:focus,
  .tenant-form textarea:focus {
    border-color: var(--pink-dark);
    box-shadow: 0 0 0 4px rgba(242,168,169,.22);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

 .docs-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

  .file-field {
    padding: 18px;
    border-radius: 24px;
    background: #fffaf8;
    border: 1px dashed rgba(195, 121, 134, .42);
  }

  .file-field > span {
    font-size: 13px;
    font-weight: 950;
    color: rgba(5,0,2,.72);
  }

 .file-field input {
  width: 100%;
  max-width: 100%;
  padding: 12px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  overflow: hidden;
}

.file-field input::file-selector-button {
  max-width: 100%;
  margin-right: 8px;
  border: 0;
  border-radius: 999px;
  background: var(--black);
  color: white;
  padding: 10px 14px;
  font-weight: 950;
  cursor: pointer;
}

  .file-field input::file-selector-button {
    margin-right: 14px;
    border: 0;
    border-radius: 999px;
    background: var(--black);
    color: white;
    padding: 12px 18px;
    font-weight: 950;
    cursor: pointer;
  }

  .file-field input::file-selector-button:hover {
    background: var(--pink-dark);
  }

  .file-field small {
    color: rgba(5,0,2,.58);
    font-weight: 800;
    line-height: 1.35;
  }

  .tenant-form button {
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

  .tenant-form button:hover {
    background: var(--pink-dark);
  }

  .tenant-form button:disabled {
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

    .tenant-hero-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }

    .tenant-hero {
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
    .form-row,
    .docs-grid {
      grid-template-columns: 1fr;
    }

    .tenant-form {
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
