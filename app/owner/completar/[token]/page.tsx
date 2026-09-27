from pathlib import Path

src = Path("/mnt/data/Texto pegado(5).txt")
text = src.read_text(encoding="utf-8")

# 1) Extend React import with useEffect. Keep everything else.
old_import = 'import { FormEvent, useMemo, useState, type ReactNode } from "react"'
new_import = 'import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react"'
if old_import not in text:
    raise RuntimeError("No encontré el import de React esperado.")
text = text.replace(old_import, new_import, 1)

# 2) Add preview component before OwnerCompletionPage.
marker = 'export default function OwnerCompletionPage() {'
preview_component = r'''
type OwnerMediaPreviewProps = {
  file: File
  onRemove: () => void
}

function OwnerMediaPreview({
  file,
  onRemove,
}: OwnerMediaPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState("")

  useEffect(() => {
    const url = URL.createObjectURL(file)

    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  const isVideo =
    file.type.startsWith("video/")

  return (
    <div className="owner-media-preview">
      <div className="owner-media-preview-frame">
        {previewUrl ? (
          isVideo ? (
            <video
              src={previewUrl}
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={previewUrl}
              alt={file.name}
            />
          )
        ) : null}

        <button
          type="button"
          className="owner-media-remove"
          onClick={onRemove}
          aria-label={`Eliminar ${file.name}`}
          title="Eliminar"
        >
          ×
        </button>

        {isVideo ? (
          <span className="owner-media-video-badge">
            VIDEO
          </span>
        ) : null}
      </div>
    </div>
  )
}

'''
if marker not in text:
    raise RuntimeError("No encontré OwnerCompletionPage.")
text = text.replace(marker, preview_component + marker, 1)

# 3) Add file selection helpers right after selectedFileStats block.
anchor = '''  }, [files])

  async function uploadFile(file: File): Promise<UploadedMedia> {'''
helpers = '''  }, [files])

  function handleFilesSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles =
      Array.from(
        event.target.files ||
          []
      ).filter(
        (file) =>
          file.type.startsWith(
            "image/"
          ) ||
          file.type.startsWith(
            "video/"
          )
      )

    setFiles(
      (
        currentFiles
      ) => {
        const seen =
          new Set(
            currentFiles.map(
              (file) =>
                `${file.name}::${file.size}::${file.lastModified}`
            )
          )

        const newFiles =
          selectedFiles.filter(
            (file) => {
              const key =
                `${file.name}::${file.size}::${file.lastModified}`

              if (
                seen.has(
                  key
                )
              ) {
                return false
              }

              seen.add(
                key
              )

              return true
            }
          )

        return [
          ...currentFiles,
          ...newFiles,
        ]
      }
    )

    event.target.value = ""
    setError("")
    setMessage("")
  }

  function removeFile(
    indexToRemove: number
  ) {
    setFiles(
      (
        currentFiles
      ) =>
        currentFiles.filter(
          (
            _,
            index
          ) =>
            index !==
            indexToRemove
        )
    )

    setError("")
    setMessage("")
  }

  async function uploadFile(file: File): Promise<UploadedMedia> {'''
if anchor not in text:
    raise RuntimeError("No encontré el bloque selectedFileStats.")
text = text.replace(anchor, helpers, 1)

# 4) Replace only the file input onChange so new picks append instead of replacing.
old_onchange = '''                  onChange={(event) =>
                    setFiles(Array.from(event.target.files || []))
                  }'''
new_onchange = '''                  onChange={
                    handleFilesSelected
                  }'''
if old_onchange not in text:
    raise RuntimeError("No encontré el onChange actual del input de archivos.")
text = text.replace(old_onchange, new_onchange, 1)

# 5) Replace the textual <ul> with visual previews, keeping selected-files container/head/stats.
old_list = '''                <ul>
                  {files.map((file) => (
                    <li key={`${file.name}-${file.size}`}>
                      <span>{file.name}</span>
                      <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </li>
                  ))}
                </ul>'''
new_list = '''                <div className="owner-media-list">
                  {files.map(
                    (
                      file,
                      index
                    ) => (
                      <OwnerMediaPreview
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        file={file}
                        onRemove={() =>
                          removeFile(
                            index
                          )
                        }
                      />
                    )
                  )}
                </div>'''
if old_list not in text:
    raise RuntimeError("No encontré la lista actual de archivos seleccionados.")
text = text.replace(old_list, new_list, 1)

# 6) Add gallery CSS after selected-files-head span block, preserving all old CSS below.
css_anchor = '''  .selected-files-head span {
    display: inline-flex;
    padding: 7px 10px;
    border-radius: 999px;
    background: var(--pink);
    color: var(--black);
    font-size: 12px;
    font-weight: 950;
  }

'''
gallery_css = '''  .selected-files-head span {
    display: inline-flex;
    padding: 7px 10px;
    border-radius: 999px;
    background: var(--pink);
    color: var(--black);
    font-size: 12px;
    font-weight: 950;
  }

  .owner-media-list {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .owner-media-preview {
    min-width: 0;
  }

  .owner-media-preview-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: 16px;
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.12);
  }

  .owner-media-preview-frame img,
  .owner-media-preview-frame video {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .owner-media-remove {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 30px;
    height: 30px;
    min-height: 30px !important;
    margin: 0 !important;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: rgba(5,0,2,.88) !important;
    color: white;
    box-shadow: none !important;
    font-size: 19px;
    font-weight: 950;
    line-height: 1;
    display: grid;
    place-items: center;
    cursor: pointer;
    z-index: 2;
  }

  .owner-media-remove:hover {
    background: var(--pink-dark) !important;
    color: white;
  }

  .owner-media-video-badge {
    position: absolute;
    left: 8px;
    bottom: 8px;
    padding: 5px 8px;
    border-radius: 999px;
    background: rgba(5,0,2,.88);
    color: white;
    font-size: 9px;
    font-weight: 950;
    letter-spacing: .06em;
  }

'''
if css_anchor not in text:
    raise RuntimeError("No encontré el bloque CSS selected-files-head span.")
text = text.replace(css_anchor, gallery_css, 1)

# 7) Add 2-column gallery on mobile without removing existing responsive rules.
mobile_anchor = '''    .primary-btn,
    .secondary-btn {
      width: 100%;
    }
  }
`'''
mobile_replacement = '''    .primary-btn,
    .secondary-btn {
      width: 100%;
    }

    .owner-media-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`'''
if mobile_anchor not in text:
    raise RuntimeError("No encontré el final del bloque mobile.")
text = text.replace(mobile_anchor, mobile_replacement, 1)

out = Path("/mnt/data/owner_completion_page_multimedia.tsx")
out.write_text(text, encoding="utf-8")

print(f"Archivo generado: {out}")
print(f"Líneas originales: {len(src.read_text(encoding='utf-8').splitlines())}")
print(f"Líneas nuevas: {len(text.splitlines())}")
