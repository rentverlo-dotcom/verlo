"use client"

import {
  ChangeEvent,
  useState,
} from "react"
import { useParams } from "next/navigation"

type UploadedMedia = {
  key: string
  publicUrl: string | null
  filename: string
  contentType: string
  size: number
  mediaType: "photo" | "video"
}

export default function OwnerPropertyPage() {
  const params =
    useParams<{ token: string }>()

  const token =
    String(params?.token || "")

  const [files, setFiles] =
    useState<File[]>([])

  const [uploading, setUploading] =
    useState(false)

  const [progress, setProgress] =
    useState("")

  const [done, setDone] =
    useState(false)

  const [error, setError] =
    useState("")

  function handleFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      Array.from(
        event.target.files || []
      )

    setFiles(selected)
    setError("")
  }

  async function uploadAll() {
    if (!token) {
      setError("Link inválido.")
      return
    }

    if (files.length === 0) {
      setError(
        "Seleccioná al menos una foto."
      )
      return
    }

    setUploading(true)
    setError("")
    setDone(false)

    const uploaded: UploadedMedia[] = []

    try {
      for (
        let i = 0;
        i < files.length;
        i++
      ) {
        const file = files[i]

        setProgress(
          `Subiendo ${i + 1} de ${files.length}...`
        )

        // 1. PEDIR URL FIRMADA
        const signResponse =
          await fetch(
            "/api/owner-property-upload",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                token,
                filename: file.name,
                contentType: file.type,
              }),
            }
          )

        const signData =
          await signResponse.json()

        if (
          !signResponse.ok ||
          !signData?.upload_url
        ) {
          throw new Error(
            signData?.error ||
              "No se pudo preparar la carga."
          )
        }

        // 2. SUBIR DIRECTO A CLOUDFLARE R2
        const uploadResponse =
          await fetch(
            signData.upload_url,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  file.type,
              },
              body: file,
            }
          )

        if (!uploadResponse.ok) {
          throw new Error(
            `No se pudo subir ${file.name}.`
          )
        }

        uploaded.push({
          key: signData.key,
          publicUrl:
            signData.public_url || null,
          filename: file.name,
          contentType: file.type,
          size: file.size,
          mediaType:
            file.type.startsWith(
              "video/"
            )
              ? "video"
              : "photo",
        })
      }

      setProgress(
        "Guardando tu propiedad..."
      )

      // 3. REGISTRAR MULTIMEDIA EN SUPABASE
      // Este endpoint lo adaptamos en el siguiente paso.
      const completeResponse =
        await fetch(
          "/api/owner-completion",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              token,
              media: uploaded,
            }),
          }
        )

      const completeData =
        await completeResponse.json()

      if (!completeResponse.ok) {
        throw new Error(
          completeData?.error ||
            "Las fotos se subieron pero no pudimos finalizar."
        )
      }

      setDone(true)
      setProgress("")
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error."
      )
    } finally {
      setUploading(false)
    }
  }

  if (done) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>
            VERLO
          </div>

          <div style={styles.success}>
            ✓
          </div>

          <h1 style={styles.title}>
            ¡Listo!
          </h1>

          <p style={styles.text}>
            Tu propiedad ya está lista
            para mostrarse a las personas
            compatibles.
          </p>

          <p style={styles.highlight}>
            Vamos a avisarles ahora.
          </p>

          <p style={styles.small}>
            No necesitás hacer nada más.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          VERLO
        </div>

        <h1 style={styles.title}>
          Mostrá tu propiedad
        </h1>

        <p style={styles.text}>
          Ya encontramos personas
          compatibles con tu propiedad.
        </p>

        <p style={styles.text}>
          Subí fotos para que puedan verla
          y avanzar con una visita.
        </p>

        <label style={styles.uploadBox}>
          <span style={styles.uploadIcon}>
            📷
          </span>

          <strong>
            Seleccionar fotos o videos
          </strong>

          <span style={styles.small}>
            Podés elegir varios archivos
            juntos.
          </span>

          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFiles}
            style={{
              display: "none",
            }}
          />
        </label>

        {files.length > 0 && (
          <div style={styles.fileInfo}>
            {files.length}{" "}
            {files.length === 1
              ? "archivo seleccionado"
              : "archivos seleccionados"}
          </div>
        )}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {progress && (
          <div style={styles.progress}>
            {progress}
          </div>
        )}

        <button
          onClick={uploadAll}
          disabled={
            uploading ||
            files.length === 0
          }
          style={{
            ...styles.button,
            opacity:
              uploading ||
              files.length === 0
                ? 0.5
                : 1,
          }}
        >
          {uploading
            ? "Subiendo..."
            : "Publicar fotos"}
        </button>

        <p style={styles.footer}>
          Para propietarios, VERLO no
          tiene costo.
        </p>
      </div>
    </main>
  )
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#f6f6f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "520px",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "32px",
    boxShadow:
      "0 12px 40px rgba(0,0,0,0.08)",
  },

  logo: {
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "3px",
    marginBottom: "28px",
  },

  title: {
    fontSize: "30px",
    lineHeight: 1.1,
    margin: "0 0 18px",
  },

  text: {
    fontSize: "17px",
    lineHeight: 1.5,
    color: "#444",
  },

  uploadBox: {
    marginTop: "28px",
    minHeight: "170px",
    border:
      "2px dashed #111",
    borderRadius: "18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    padding: "20px",
    textAlign: "center",
  },

  uploadIcon: {
    fontSize: "36px",
  },

  small: {
    fontSize: "14px",
    color: "#777",
  },

  fileInfo: {
    marginTop: "18px",
    padding: "12px",
    background: "#f4f4f4",
    borderRadius: "12px",
    textAlign: "center",
  },

  progress: {
    marginTop: "18px",
    fontWeight: 600,
    textAlign: "center",
  },

  error: {
    marginTop: "18px",
    padding: "12px",
    background: "#fff0f0",
    borderRadius: "12px",
    color: "#9b111e",
  },

  button: {
    marginTop: "24px",
    width: "100%",
    border: 0,
    borderRadius: "14px",
    padding: "17px",
    background: "#111",
    color: "#fff",
    fontSize: "17px",
    fontWeight: 700,
    cursor: "pointer",
  },

  footer: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#777",
    textAlign: "center",
  },

  success: {
    width: "68px",
    height: "68px",
    borderRadius: "50%",
    background: "#111",
    color: "#fff",
    fontSize: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
  },

  highlight: {
    fontSize: "18px",
    fontWeight: 700,
  },
}
