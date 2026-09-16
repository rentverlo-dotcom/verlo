"use client"

import {
  FormEvent,
  useState,
} from "react"

type DocType =
  | "dni_front"
  | "dni_back"
  | "selfie"
  | "income_proof"
  | "guarantee_proof"

type UploadedDocuments =
  Partial<
    Record<
      DocType,
      string
    >
  >

type Props = {
  token: string
  onCompleted: () => void | Promise<void>
}

export default function TenantVerificationCard({
  token,
  onCompleted,
}: Props) {
  const [
    documentNumber,
    setDocumentNumber,
  ] =
    useState("")

  const [
    employmentStatus,
    setEmploymentStatus,
  ] =
    useState("")

  const [
    incomeRange,
    setIncomeRange,
  ] =
    useState("")

  const [
    guaranteeType,
    setGuaranteeType,
  ] =
    useState("")

  const [
    moveNotes,
    setMoveNotes,
  ] =
    useState("")

  const [
    dniFront,
    setDniFront,
  ] =
    useState<File | null>(
      null
    )

  const [
    dniBack,
    setDniBack,
  ] =
    useState<File | null>(
      null
    )

  const [
    selfie,
    setSelfie,
  ] =
    useState<File | null>(
      null
    )

  const [
    incomeProof,
    setIncomeProof,
  ] =
    useState<File | null>(
      null
    )

  const [
    guaranteeProof,
    setGuaranteeProof,
  ] =
    useState<File | null>(
      null
    )

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState("")

  async function uploadDocument(
    docType: DocType,
    file: File
  ) {
    const response =
      await fetch(
        "/api/tenant-document-upload",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              token,

              docType,

              filename:
                file.name,

              contentType:
                file.type ||
                "application/octet-stream",
            }),
        }
      )

    const json =
      await response
        .json()
        .catch(
          () => null
        )

    if (
      !response.ok ||
      !json?.ok ||
      !json?.upload_url ||
      !json?.key
    ) {
      throw new Error(
        json?.error ||
          "No pudimos preparar la carga del archivo."
      )
    }

    const uploadResponse =
      await fetch(
        json.upload_url,
        {
          method:
            "PUT",

          headers: {
            "Content-Type":
              file.type ||
              "application/octet-stream",
          },

          body:
            file,
        }
      )

    if (
      !uploadResponse.ok
    ) {
      throw new Error(
        `No pudimos subir ${file.name}.`
      )
    }

    return String(
      json.key
    )
  }

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (
      !documentNumber.trim()
    ) {
      setError(
        "Ingresá tu DNI."
      )

      return
    }

    if (
      !employmentStatus
    ) {
      setError(
        "Elegí tu situación laboral."
      )

      return
    }

    if (
      !incomeRange
    ) {
      setError(
        "Elegí tu rango de ingresos."
      )

      return
    }

    if (
      !guaranteeType
    ) {
      setError(
        "Elegí tu tipo de garantía."
      )

      return
    }

    if (
      !dniFront ||
      !dniBack ||
      !selfie
    ) {
      setError(
        "Necesitamos DNI frente, DNI dorso y selfie."
      )

      return
    }

    try {
      setSaving(true)
      setError("")

      const documents:
        UploadedDocuments =
        {}

      documents.dni_front =
        await uploadDocument(
          "dni_front",
          dniFront
        )

      documents.dni_back =
        await uploadDocument(
          "dni_back",
          dniBack
        )

      documents.selfie =
        await uploadDocument(
          "selfie",
          selfie
        )

      if (
        incomeProof
      ) {
        documents.income_proof =
          await uploadDocument(
            "income_proof",
            incomeProof
          )
      }

      if (
        guaranteeProof
      ) {
        documents.guarantee_proof =
          await uploadDocument(
            "guarantee_proof",
            guaranteeProof
          )
      }

      const response =
        await fetch(
          "/api/tenant-verification",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token,

                document_number:
                  documentNumber,

                employment_status:
                  employmentStatus,

                income_range:
                  incomeRange,

                guarantee_type:
                  guaranteeType,

                move_notes:
                  moveNotes,

                documents,
              }),
          }
        )

      const json =
        await response
          .json()
          .catch(
            () => null
          )

      if (
        !response.ok ||
        !json?.ok
      ) {
        throw new Error(
          json?.error ||
            "No pudimos guardar tu documentación."
        )
      }

      await onCompleted()
    } catch (
      err
    ) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos guardar tu documentación."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="verlo-card no-print tenant-verification-card">
      <span className="card-kicker">
        VALIDACIÓN DEL INQUILINO
      </span>

      <h2>
        Completá tu documentación
      </h2>

      <p>
        Ahora que los dos decidieron avanzar,
        cargá tu identidad y respaldo para que
        el propietario pueda revisarlos dentro
        de esta operación.
      </p>

      <form
        className="tenant-verification-form"
        onSubmit={
          submit
        }
      >
        <div className="form-grid">
          <label className="field">
            <span>
              DNI
            </span>

            <input
              value={
                documentNumber
              }
              required
              placeholder="Ej. 30123456"
              onChange={
                event =>
                  setDocumentNumber(
                    event.target.value
                  )
              }
            />
          </label>

          <label className="field">
            <span>
              Situación laboral
            </span>

            <select
              value={
                employmentStatus
              }
              required
              onChange={
                event =>
                  setEmploymentStatus(
                    event.target.value
                  )
              }
            >
              <option value="">
                Seleccionar
              </option>

              <option value="Relación de dependencia">
                Relación de dependencia
              </option>

              <option value="Monotributista">
                Monotributista
              </option>

              <option value="Autónomo">
                Autónomo
              </option>

              <option value="Comerciante / emprendedor">
                Comerciante / emprendedor
              </option>

              <option value="Jubilado">
                Jubilado
              </option>

              <option value="Estudiante con garante">
                Estudiante con garante
              </option>

              <option value="Otro">
                Otro
              </option>
            </select>
          </label>

          <label className="field">
            <span>
              Rango de ingresos
            </span>

            <select
              value={
                incomeRange
              }
              required
              onChange={
                event =>
                  setIncomeRange(
                    event.target.value
                  )
              }
            >
              <option value="">
                Seleccionar
              </option>

              <option value="Menos de $500.000">
                Menos de $500.000
              </option>

              <option value="$500.000 a $800.000">
                $500.000 a $800.000
              </option>

              <option value="$800.000 a $1.200.000">
                $800.000 a $1.200.000
              </option>

              <option value="$1.200.000 a $1.800.000">
                $1.200.000 a $1.800.000
              </option>

              <option value="$1.800.000 a $2.500.000">
                $1.800.000 a $2.500.000
              </option>

              <option value="Más de $2.500.000">
                Más de $2.500.000
              </option>
            </select>
          </label>

          <label className="field">
            <span>
              Garantía
            </span>

            <select
              value={
                guaranteeType
              }
              required
              onChange={
                event =>
                  setGuaranteeType(
                    event.target.value
                  )
              }
            >
              <option value="">
                Seleccionar
              </option>

              <option value="Garantía propietaria">
                Garantía propietaria
              </option>

              <option value="Seguro de caución">
                Seguro de caución
              </option>

              <option value="Recibos de sueldo">
                Recibos de sueldo
              </option>

              <option value="Aval familiar">
                Aval familiar
              </option>

              <option value="Depósito adelantado">
                Depósito adelantado
              </option>

              <option value="Otro">
                Otro
              </option>
            </select>
          </label>
        </div>

        <div className="verification-files">
          <VerificationFile
            label="DNI frente"
            file={
              dniFront
            }
            required
            onChange={
              setDniFront
            }
          />

          <VerificationFile
            label="DNI dorso"
            file={
              dniBack
            }
            required
            onChange={
              setDniBack
            }
          />

          <VerificationFile
            label="Selfie"
            file={
              selfie
            }
            required
            onChange={
              setSelfie
            }
          />

          <VerificationFile
            label="Comprobante de ingresos"
            file={
              incomeProof
            }
            onChange={
              setIncomeProof
            }
          />

          <VerificationFile
            label="Comprobante de garantía"
            file={
              guaranteeProof
            }
            onChange={
              setGuaranteeProof
            }
          />
        </div>

        <label className="field verification-notes">
          <span>
            Información adicional
          </span>

          <textarea
            value={
              moveNotes
            }
            placeholder="Aclaraciones sobre ingresos, garantía o mudanza."
            onChange={
              event =>
                setMoveNotes(
                  event.target.value
                )
            }
          />
        </label>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="primary-button verification-submit"
          disabled={
            saving
          }
        >
          {saving
            ? "CARGANDO DOCUMENTACIÓN..."
            : "GUARDAR DOCUMENTACIÓN"}
        </button>
      </form>

      <style jsx>{`
        .tenant-verification-form {
          margin-top: 28px;
        }

        .verification-files {
          margin-top: 24px;
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );
          gap: 12px;
        }

        .verification-notes {
          margin-top: 24px;
        }

        .verification-submit {
          width: 100%;
          margin-top: 24px;
        }

        @media (
          max-width: 640px
        ) {
          .verification-files {
            grid-template-columns:
              1fr;
          }
        }
      `}</style>
    </article>
  )
}

function VerificationFile({
  label,
  file,
  required = false,
  onChange,
}: {
  label: string
  file: File | null
  required?: boolean
  onChange: (
    file: File | null
  ) => void
}) {
  return (
    <label className="verification-file">
      <span>
        {label}
        {required
          ? " *"
          : ""}
      </span>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        required={
          required
        }
        onChange={
          event =>
            onChange(
              event.target
                .files?.[0] ||
                null
            )
        }
      />

      <small>
        {file
          ? file.name
          : "JPG, PNG, WEBP o PDF"}
      </small>

      <style jsx>{`
        .verification-file {
          padding: 15px;
          display: block;
          border: 1px solid #e4d9dc;
          border-radius: 14px;
          background: #fffdfb;
        }

        .verification-file > span {
          display: block;
          margin-bottom: 10px;
          font-size: 12px;
          font-weight: 800;
        }

        .verification-file input {
          width: 100%;
        }

        .verification-file small {
          display: block;
          margin-top: 8px;
          color: #8a8184;
          font-size: 11px;
        }
      `}</style>
    </label>
  )
}
