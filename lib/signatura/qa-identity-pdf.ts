/**
 * A single-page, QA-only declaration. Intentionally explicit that it is
 * test wording, not a final legal template. No biometrics or IDs included.
 */
export function createQaIdentityDeclarationPdf(): Buffer {
  const lines = [
    "VERLO QA - DECLARACION DE IDENTIDAD (PRUEBA)",
    "",
    "Documento de prueba para la activacion de identidad en VERLO.",
    "No constituye un contrato de alquiler.",
    "",
    "La persona firmante declara actuar en nombre propio y solicita",
    "la verificacion de su identidad mediante documento y biometria.",
    "La validacion se utilizara para identificar la cuenta VERLO",
    "en solicitudes de visita, mientras siga vigente.",
    "",
    "El contrato de alquiler se firma en una operacion independiente.",
    "El propietario no participa de esta declaracion inicial.",
    "",
    "TEXTO PROVISORIO: NO UTILIZAR EN PRODUCCION.",
  ]
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
  const commands = ["BT", "/F1 12 Tf", "50 790 Td", "16 TL", ...lines.flatMap((line, index) =>
    index === 0 ? [`(${escape(line)}) Tj`] : ["T*", `(${escape(line)}) Tj`]), "ET"].join("\n")
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(commands, "ascii")} >>\nstream\n${commands}\nendstream`,
  ]
  let output = "%PDF-1.4\n"
  const offsets = [0]
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(output, "ascii"))
    output += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xref = Buffer.byteLength(output, "ascii")
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) output += `${String(offset).padStart(10, "0")} 00000 n \n`
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(output, "ascii")
}
