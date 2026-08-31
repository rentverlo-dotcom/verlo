"use client"

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useParams,
} from "next/navigation"

import VerloBrand from "@/components/VerloBrand"

type UploadedMedia = {
  key: string
  publicUrl: string | null
  filename: string
  contentType: string
  size: number
  mediaType: "photo" | "video"
}

const MAX_DIRECT_SERVER_FILE_SIZE =
  3 * 1024 * 1024

const MAX_IMAGE_DIMENSION =
  1800

function createImageElement(
  url: string
) {
  return new Promise<HTMLImageElement>(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image()

      image.onload =
        () =>
          resolve(
            image
          )

      image.onerror =
        () =>
          reject(
            new Error(
              "No pudimos procesar esta imagen."
            )
          )

      image.src =
        url
    }
  )
}

async function compressImage(
  file: File
) {
  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    return file
  }

  if (
    file.size <=
    MAX_DIRECT_SERVER_FILE_SIZE
  ) {
    return file
  }

  const objectUrl =
    URL.createObjectURL(
      file
    )

  try {
    const image =
      await createImageElement(
        objectUrl
      )

    let width =
      image.naturalWidth

    let height =
      image.naturalHeight

    if (
      width >
        MAX_IMAGE_DIMENSION ||
      height >
        MAX_IMAGE_DIMENSION
    ) {
      const scale =
        Math.min(
          MAX_IMAGE_DIMENSION /
            width,

          MAX_IMAGE_DIMENSION /
            height
        )

      width =
        Math.round(
          width *
            scale
        )

      height =
        Math.round(
          height *
            scale
        )
    }

    const canvas =
      document.createElement(
        "canvas"
      )

    canvas.width =
      width

    canvas.height =
      height

    const context =
      canvas.getContext(
        "2d"
      )

    if (
      !context
    ) {
      throw new Error(
        "No pudimos preparar la imagen."
      )
    }

    context.drawImage(
      image,
      0,
      0,
      width,
      height
    )

    const createBlob =
      (
        quality:
          number
      ) =>
        new Promise<Blob | null>(
          (
            resolve
          ) => {
            canvas.toBlob(
              resolve,
              "image/jpeg",
              quality
            )
          }
        )

    let quality =
      0.86

    let blob =
      await createBlob(
        quality
      )

    while (
      blob &&
      blob.size >
        MAX_DIRECT_SERVER_FILE_SIZE &&
      quality >
        0.5
    ) {
      quality -=
        0.08

      blob =
        await createBlob(
          quality
        )
    }

    if (!blob) {
      throw new Error(
        "No pudimos comprimir la imagen."
      )
    }

    if (
      blob.size >
      MAX_DIRECT_SERVER_FILE_SIZE
    ) {
      throw new Error(
        "La foto es demasiado pesada. Elegí otra foto."
      )
    }

    const baseName =
      file.name.replace(
        /\.[^.]+$/,
        ""
      )

    return new File(
      [
        blob,
      ],
      `${baseName}.jpg`,
      {
        type:
          "image/jpeg",

        lastModified:
          Date.now(),
      }
    )
  } finally {
    URL.revokeObjectURL(
      objectUrl
    )
  }
}

export default function OwnerPropertyPage() {
  const params =
    useParams<{
      token: string
    }>()

  const token =
    String(
      params?.token ||
        ""
    )

  const [
    files,
    setFiles,
  ] =
    useState<File[]>(
      []
    )

  const [
    uploading,
    setUploading,
  ] =
    useState(
      false
    )

  const [
    progress,
    setProgress,
  ] =
    useState(
      ""
    )

  const [
    done,
    setDone,
  ] =
    useState(
      false
    )

  const [
    error,
    setError,
  ] =
    useState(
      ""
    )

  const previews =
    useMemo(
      () =>
        files.map(
          (
            file
          ) => ({
            file,

            url:
              URL.createObjectURL(
                file
              ),
          })
        ),

      [
        files,
      ]
    )

  useEffect(
    () => {
      if (
        !token
      ) {
        return
      }

      async function trackOpen() {
        try {
          const response =
            await fetch(
              "/api/match-link-open",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    {
                      token,

                      role:
                        "owner",
                    }
                  ),
              }
            )

          if (
            !response.ok
          ) {
            const text =
              await response
                .text()
                .catch(
                  () =>
                    ""
                )

            console.error(
              "owner match link open tracking failed:",
              response.status,
              text
            )
          }
        } catch (
          err
        ) {
          console.error(
            "owner match link open tracking error:",
            err
          )
        }
      }

      trackOpen()
    },

    [
      token,
    ]
  )

  function handleFiles(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      Array.from(
        event
          .target
          .files ||
          []
      )

    setFiles(
      selected
    )

    setError(
      ""
    )
  }

  async function uploadAll() {
    if (
      !token
    ) {
      setError(
        "Link inválido."
      )

      return
    }

    if (
      files.length ===
      0
    ) {
      setError(
        "Seleccioná al menos una foto o video."
      )

      return
    }

    setUploading(
      true
    )

    setError(
      ""
    )

    setDone(
      false
    )

    const uploaded:
      UploadedMedia[] =
      []

    let stage =
      "INICIO"

    try {
      for (
        let i = 0;
        i <
        files.length;
        i++
      ) {
        const originalFile =
          files[i]

        setProgress(
          `Preparando ${i + 1} de ${files.length}...`
        )

        // =====================================================
        // ETAPA 1
        // PREPARAR ARCHIVO
        //
        // Fotos chicas quedan intactas.
        // Fotos grandes se reducen antes de enviarse a Vercel.
        // =====================================================

        stage =
          `ETAPA 1 - preparar archivo ${i + 1}`

        let file =
          originalFile

        if (
          originalFile.type.startsWith(
            "image/"
          )
        ) {
          file =
            await compressImage(
              originalFile
            )
        }

        if (
          file.type.startsWith(
            "video/"
          ) &&
          file.size >
            MAX_DIRECT_SERVER_FILE_SIZE
        ) {
          throw new Error(
            `ETAPA 1 - El video ${file.name} es demasiado pesado para esta carga. Probá primero con fotos.`
          )
        }

        setProgress(
          `Subiendo ${i + 1} de ${files.length}...`
        )

        // =====================================================
        // ETAPA 2
        // MÓVIL / BROWSER -> VERLO
        //
        // YA NO EXISTE UN FETCH DIRECTO A R2.
        // =====================================================

        stage =
          `ETAPA 2 - subir a Verlo - archivo ${i + 1}`

        const uploadFormData =
          new FormData()

        uploadFormData.append(
          "token",
          token
        )

        uploadFormData.append(
          "file",
          file,
          file.name
        )

        let uploadResponse:
          Response

        try {
          uploadResponse =
            await fetch(
              "/api/owner-property-upload",
              {
                method:
                  "POST",

                body:
                  uploadFormData,
              }
            )
        } catch (
          fetchError
        ) {
          throw new Error(
            `${stage}: FETCH FALLÓ. ${
              fetchError instanceof
              Error
                ? fetchError.message
                : String(
                    fetchError
                  )
            }`
          )
        }

        let uploadData:
          any =
          null

        try {
          uploadData =
            await uploadResponse.json()
        } catch {
          const raw =
            await uploadResponse
              .text()
              .catch(
                () =>
                  ""
              )

          throw new Error(
            `${stage}: respuesta inválida. HTTP ${uploadResponse.status}. ${raw}`
          )
        }

        if (
          !uploadResponse.ok ||
          !uploadData?.ok ||
          !uploadData?.key
        ) {
          throw new Error(
            `${stage}: HTTP ${uploadResponse.status}. ${
              uploadData?.error ||
              "No se pudo subir el archivo."
            }${
              uploadData?.detail
                ? ` ${uploadData.detail}`
                : ""
            }`
          )
        }

        uploaded.push(
          {
            key:
              uploadData.key,

            publicUrl:
              uploadData.public_url ||
              null,

            filename:
              uploadData.filename ||
              file.name,

            contentType:
              uploadData.content_type ||
              file.type,

            size:
              Number(
                uploadData.size ||
                  file.size
              ),

            mediaType:
              uploadData.media_type ===
              "video"
                ? "video"
                : "photo",
          }
        )
      }

      setProgress(
        "Guardando tu propiedad..."
      )

      // =======================================================
      // ETAPA 3
      // FINALIZAR COMPLETION
      // =======================================================

      stage =
        "ETAPA 3 - owner-completion"

      let completeResponse:
        Response

      try {
        completeResponse =
          await fetch(
            "/api/owner-completion",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    token,

                    media:
                      uploaded,
                  }
                ),
            }
          )
      } catch (
        fetchError
      ) {
        throw new Error(
          `${stage}: FETCH FALLÓ. ${
            fetchError instanceof
            Error
              ? fetchError.message
              : String(
                  fetchError
                )
          }`
        )
      }

      let completeData:
        any =
        null

      try {
        completeData =
          await completeResponse.json()
      } catch {
        const raw =
          await completeResponse
            .text()
            .catch(
              () =>
                ""
            )

        throw new Error(
          `${stage}: respuesta inválida. HTTP ${completeResponse.status}. ${raw}`
        )
      }

      if (
        !completeResponse.ok
      ) {
        throw new Error(
          `${stage}: HTTP ${completeResponse.status}. ${
            completeData?.error ||
            "Las fotos se subieron pero no pudimos finalizar."
          }`
        )
      }

      setDone(
        true
      )

      setProgress(
        ""
      )
    } catch (
      err
    ) {
      console.error(
        "OWNER UPLOAD ERROR",
        {
          stage,
          error:
            err,
        }
      )

      setProgress(
        ""
      )

      setError(
        err instanceof
        Error
          ? err.message
          : `${stage}: Ocurrió un error.`
      )
    } finally {
      setUploading(
        false
      )
    }
  }

  if (
    done
  ) {
    return (
      <>
        <style jsx global>{`
          :root {
            --pink: #f2a8a9;
            --pink-dark: #c37986;
            --black: #050002;
            --soft: #f2ebec;
            --blue: #74bedc;
            --yellow: #e7c776;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: var(--soft);
            color: var(--black);
            font-family:
              Inter,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }
        `}</style>

        <main className="owner-page">
          <div className="glow glow-pink" />
          <div className="glow glow-blue" />

          <section className="shell success-shell">
            <div className="brand-row">
              <VerloBrand />
            </div>

            <div className="success-mark">
              ✓
            </div>

            <div className="eyebrow">
              PROPIEDAD LISTA
            </div>

            <h1>
              Ya podemos
              <br />
              <em>mostrarla.</em>
            </h1>

            <p className="lead">
              Tus fotos ya quedaron cargadas
              correctamente.
            </p>

            <div className="success-card">
              <strong>
                Vamos a avisar a las personas
                compatibles.
              </strong>

              <span>
                No necesitás hacer nada más por
                ahora.
              </span>
            </div>
          </section>
        </main>

        <style jsx>{`
          .owner-page {
            min-height: 100vh;
            position: relative;
            overflow: hidden;
            background:
              radial-gradient(
                circle at 15% 15%,
                rgba(242, 168, 169, 0.5),
                transparent 28%
              ),
              radial-gradient(
                circle at 88% 80%,
                rgba(116, 190, 220, 0.28),
                transparent 30%
              ),
              var(--soft);
            padding: 28px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .shell {
            position: relative;
            z-index: 2;
            width: min(760px, 100%);
            background: rgba(255, 255, 255, 0.78);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(5, 0, 2, 0.08);
            border-radius: 34px;
            padding: 34px;
            box-shadow:
              0 30px 100px rgba(5, 0, 2, 0.12);
          }

          .brand-row {
            margin-bottom: 40px;
          }

          .success-mark {
            width: 72px;
            height: 72px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background: var(--black);
            color: white;
            font-size: 34px;
            font-weight: 900;
            margin-bottom: 26px;
          }

          .eyebrow {
            font-size: 12px;
            letter-spacing: 0.16em;
            font-weight: 950;
            margin-bottom: 14px;
          }

          h1 {
            margin: 0;
            font-size: clamp(
              48px,
              8vw,
              84px
            );
            line-height: 0.94;
            letter-spacing: -0.055em;
            font-weight: 950;
          }

          h1 em {
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-style: italic;
            font-weight: 400;
          }

          .lead {
            margin: 28px 0 0;
            max-width: 560px;
            font-size: 20px;
            line-height: 1.45;
            color: rgba(5, 0, 2, 0.68);
          }

          .success-card {
            margin-top: 34px;
            border-radius: 24px;
            padding: 22px;
            background: var(--pink);
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .success-card strong {
            font-size: 18px;
          }

          .success-card span {
            color: rgba(5, 0, 2, 0.68);
          }
        `}</style>
      </>
    )
  }

  return (
    <>
      <style jsx global>{`
        :root {
          --pink: #f2a8a9;
          --pink-dark: #c37986;
          --black: #050002;
          --soft: #f2ebec;
          --blue: #74bedc;
          --yellow: #e7c776;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: var(--soft);
          color: var(--black);
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }
      `}</style>

      <main className="owner-page">
        <div className="glow glow-pink" />
        <div className="glow glow-blue" />
        <div className="glow glow-yellow" />

        <section className="shell">
          <div className="topbar">
            <VerloBrand />

            <div className="free-pill">
              GRATIS PARA PROPIETARIOS
            </div>
          </div>

          <div className="hero">
            <div>
              <div className="eyebrow">
                YA TENÉS MATCHES
              </div>

              <h1>
                Mostrá tu
                <br />
                <em>propiedad.</em>
              </h1>

              <p className="lead">
                Encontramos personas compatibles
                con lo que ofrecés. Subí fotos o
                videos para que puedan conocer la
                propiedad y avanzar con una visita.
              </p>
            </div>

            <div className="match-card">
              <span className="dot" />

              <div>
                <strong>
                  Hay interés real
                </strong>

                <p>
                  Tus archivos se cargan directo
                  en VERLO y quedan asociados a
                  esta propiedad.
                </p>
              </div>
            </div>
          </div>

          <label className="upload-box">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={
                handleFiles
              }
            />

            <div className="upload-icon">
              +
            </div>

            <div className="upload-copy">
              <strong>
                Seleccionar fotos o videos
              </strong>

              <span>
                Elegí varios archivos juntos
              </span>
            </div>

            <div className="upload-action">
              Elegir archivos
            </div>
          </label>

          {previews.length >
            0 && (
            <div className="preview-section">
              <div className="preview-head">
                <strong>
                  Vista previa
                </strong>

                <span>
                  {files.length}{" "}
                  {files.length ===
                  1
                    ? "archivo"
                    : "archivos"}
                </span>
              </div>

              <div className="preview-grid">
                {previews.map(
                  (
                    {
                      file,
                      url,
                    },
                    index
                  ) => (
                    <div
                      className="preview-card"
                      key={`${file.name}-${index}`}
                    >
                      {file.type.startsWith(
                        "video/"
                      ) ? (
                        <video
                          src={
                            url
                          }
                          className="preview-media"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={
                            url
                          }
                          alt={
                            file.name
                          }
                          className="preview-media"
                        />
                      )}

                      <div className="preview-meta">
                        <span>
                          {index +
                            1}
                        </span>

                        <small>
                          {
                            file.name
                          }
                        </small>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="message error">
              {error}
            </div>
          )}

          {progress && (
            <div className="message progress">
              {progress}
            </div>
          )}

          <button
            className="publish-button"
            onClick={
              uploadAll
            }
            disabled={
              uploading ||
              files.length ===
                0
            }
          >
            {uploading
              ? "Subiendo..."
              : "Publicar y avisar matches"}
          </button>

          <div className="footer-note">
            <span>
              Sin comisión inmobiliaria.
            </span>

            <span className="separator">
              ·
            </span>

            <span>
              Para propietarios, VERLO no
              tiene costo.
            </span>
          </div>
        </section>
      </main>

      <style jsx>{`
        .owner-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 8% 10%,
              rgba(242, 168, 169, 0.62),
              transparent 25%
            ),
            radial-gradient(
              circle at 92% 86%,
              rgba(116, 190, 220, 0.34),
              transparent 26%
            ),
            radial-gradient(
              circle at 82% 12%,
              rgba(231, 199, 118, 0.26),
              transparent 20%
            ),
            var(--soft);
          padding: 30px 20px 52px;
        }

        .glow {
          position: fixed;
          border-radius: 999px;
          filter: blur(70px);
          pointer-events: none;
        }

        .glow-pink {
          width: 260px;
          height: 260px;
          background: var(--pink);
          top: -90px;
          left: -80px;
          opacity: 0.55;
        }

        .glow-blue {
          width: 260px;
          height: 260px;
          background: var(--blue);
          right: -100px;
          bottom: -70px;
          opacity: 0.34;
        }

        .glow-yellow {
          width: 180px;
          height: 180px;
          background: var(--yellow);
          right: 12%;
          top: 4%;
          opacity: 0.2;
        }

        .shell {
          position: relative;
          z-index: 2;
          width: min(1020px, 100%);
          margin: 0 auto;
          background:
            rgba(255, 255, 255, 0.76);
          backdrop-filter: blur(24px);
          border:
            1px solid rgba(5, 0, 2, 0.08);
          border-radius: 36px;
          padding: 32px;
          box-shadow:
            0 30px 100px
              rgba(5, 0, 2, 0.12);
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding-bottom: 30px;
          border-bottom:
            1px solid rgba(5, 0, 2, 0.07);
        }

        .free-pill {
          padding: 10px 14px;
          border-radius: 999px;
          background: var(--yellow);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }

        .hero {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            280px;
          gap: 44px;
          align-items: end;
          padding: 46px 0 36px;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.16em;
          margin-bottom: 16px;
        }

        h1 {
          margin: 0;
          font-size: clamp(
            54px,
            8vw,
            96px
          );
          line-height: 0.92;
          letter-spacing: -0.06em;
          font-weight: 950;
        }

        h1 em {
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-style: italic;
          font-weight: 400;
          letter-spacing: -0.035em;
        }

        .lead {
          margin: 28px 0 0;
          max-width: 640px;
          font-size: 20px;
          line-height: 1.48;
          color:
            rgba(5, 0, 2, 0.67);
        }

        .match-card {
          background: var(--pink);
          border-radius: 24px;
          padding: 22px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          box-shadow:
            0 16px 40px
              rgba(5, 0, 2, 0.08);
        }

        .match-card strong {
          font-size: 17px;
        }

        .match-card p {
          margin: 8px 0 0;
          font-size: 14px;
          line-height: 1.4;
          color:
            rgba(5, 0, 2, 0.65);
        }

        .dot {
          width: 11px;
          height: 11px;
          border-radius: 999px;
          background: var(--black);
          margin-top: 5px;
          flex: 0 0 auto;
        }

        .upload-box {
          display: grid;
          grid-template-columns:
            56px
            1fr
            auto;
          gap: 18px;
          align-items: center;
          min-height: 120px;
          padding: 22px;
          border-radius: 28px;
          background: white;
          border:
            2px solid var(--black);
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .upload-box:hover {
          transform:
            translateY(-2px);
          box-shadow:
            0 18px 40px
              rgba(5, 0, 2, 0.08);
        }

        .upload-box input {
          display: none;
        }

        .upload-icon {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: var(--blue);
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
        }

        .upload-copy {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .upload-copy strong {
          font-size: 18px;
        }

        .upload-copy span {
          font-size: 14px;
          color:
            rgba(5, 0, 2, 0.6);
        }

        .upload-action {
          background: var(--black);
          color: white;
          padding: 13px 18px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 950;
          white-space: nowrap;
        }

        .preview-section {
          margin-top: 28px;
        }

        .preview-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .preview-head strong {
          font-size: 18px;
        }

        .preview-head span {
          font-size: 14px;
          color:
            rgba(5, 0, 2, 0.58);
        }

        .preview-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 14px;
        }

        .preview-card {
          position: relative;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border-radius: 20px;
          background: #eee;
          border:
            1px solid rgba(5, 0, 2, 0.08);
        }

        .preview-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .preview-meta {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 8px;
          background:
            rgba(5, 0, 2, 0.76);
          color: white;
          border-radius: 12px;
          padding: 7px 9px;
          display: flex;
          align-items: center;
          gap: 8px;
          backdrop-filter: blur(8px);
        }

        .preview-meta span {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: white;
          color: var(--black);
          font-size: 11px;
          font-weight: 900;
          flex: 0 0 auto;
        }

        .preview-meta small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .message {
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 800;
        }

        .error {
          background: #ffe8e8;
          color: #8f1111;
        }

        .progress {
          background:
            rgba(116, 190, 220, 0.24);
        }

        .publish-button {
          width: 100%;
          min-height: 60px;
          margin-top: 26px;
          border: 0;
          border-radius: 999px;
          background: var(--black);
          color: white;
          font-size: 17px;
          font-weight: 950;
          cursor: pointer;
          box-shadow:
            0 18px 45px
              rgba(5, 0, 2, 0.2);
        }

        .publish-button:disabled {
          opacity: 0.38;
          cursor: not-allowed;
        }

        .footer-note {
          margin-top: 20px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          color:
            rgba(5, 0, 2, 0.56);
          font-weight: 750;
        }

        .separator {
          opacity: 0.4;
        }

        @media (
          max-width: 760px
        ) {
          .owner-page {
            padding:
              14px 12px 28px;
          }

          .shell {
            border-radius: 28px;
            padding: 22px;
          }

          .topbar {
            align-items:
              flex-start;
          }

          .free-pill {
            font-size: 9px;
            padding: 8px 10px;
          }

          .hero {
            grid-template-columns:
              1fr;
            gap: 26px;
            padding: 34px 0 26px;
          }

          h1 {
            font-size:
              clamp(
                50px,
                16vw,
                72px
              );
          }

          .lead {
            font-size: 17px;
          }

          .match-card {
            width: 100%;
          }

          .upload-box {
            grid-template-columns:
              48px 1fr;
          }

          .upload-action {
            grid-column: 1 / -1;
            text-align: center;
          }

          .preview-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .publish-button {
            position: sticky;
            bottom: 12px;
            z-index: 5;
          }
        }
      `}</style>
    </>
  )
}
