export type MediaValidation = { valid: true } | { valid: false; message: string }
export const MAX_TEMPORARY_MEDIA_FILES = 12
export const MAX_TEMPORARY_MEDIA_BYTES = 20 * 1024 * 1024
export function validateTemporaryMedia(files: readonly Pick<File,"type"|"size"|"name">[]): MediaValidation {
  if (files.length === 0) return { valid: false, message: "Seleccioná al menos una foto o video." }
  if (files.length > MAX_TEMPORARY_MEDIA_FILES) return { valid: false, message: "Podés elegir hasta 12 archivos." }
  for (const file of files) {
    if (!["image/jpeg","image/png","image/webp","video/mp4"].includes(file.type))
      return { valid: false, message: "Formato no admitido: " + file.name + ". Usá JPG, PNG, WebP o MP4." }
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_TEMPORARY_MEDIA_BYTES)
      return { valid: false, message: "Archivo vacío o mayor a 20 MB: " + file.name }
  }
  return { valid: true }
}
