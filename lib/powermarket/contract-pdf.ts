// Generador PDF autocontenido: conserva el texto y crea espacios de firma.
// No constituye una firma digital ni modifica el documento contractual.
// PDF WinAnsiEncoding: encode supported Unicode characters without altering legal wording.
// Any character outside Windows-1252 is rejected; never silently substitute "?".
const winAnsiSpecial: Record<number, number> = {
  0x20ac:0x80,0x201a:0x82,0x0192:0x83,0x201e:0x84,0x2026:0x85,
  0x2020:0x86,0x2021:0x87,0x02c6:0x88,0x2030:0x89,0x0160:0x8a,
  0x2039:0x8b,0x0152:0x8c,0x017d:0x8e,0x2018:0x91,0x2019:0x92,
  0x201c:0x93,0x201d:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,
  0x02dc:0x98,0x2122:0x99,0x0161:0x9a,0x203a:0x9b,0x0153:0x9c,
  0x017e:0x9e,0x0178:0x9f,
}
function encodeWinAnsi(input: string): string {
  let result = ""
  for (const char of Array.from(input)) {
    const cp = char.codePointAt(0) ?? 0
    const byte = (cp >= 32 && cp <= 126) || (cp >= 160 && cp <= 255)
      ? cp : winAnsiSpecial[cp]
    if (byte === undefined) {
      throw new Error(`Caracter Unicode no representable en PDF: U+${cp.toString(16).toUpperCase()}`)
    }
    result += String.fromCharCode(byte)
  }
  return result
}
const literal = (value: string) => "(" + encodeWinAnsi(value)
  .replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)") + ")"

function wrap(paragraph: string, limit = 50): string[] {
  // Preserve contractual spaces and explicit line breaks. Do not collapse
  // whitespace with split(/\\s+/), which changes names, clauses and amounts.
  // Only visual wrapping is introduced when the line exceeds the page width.
  const lines: string[] = []
  for (const original of paragraph.replace(/\r\n?/g, "\n").split("\n")) {
    if (!original.length) {
      lines.push("")
      continue
    }
    const chars = Array.from(original)
    for (let pos = 0; pos < chars.length; pos += limit)
      lines.push(chars.slice(pos, pos + limit).join(""))
  }
  return lines
}

export function createCaucionContractPdf(args: {
  documentText: string
  version: number
  sha256: string
  contractId: string
}): Buffer {
  const paragraphs = args.documentText.replace(/\r\n?/g, "\n").split("\n\n")
  const pages: string[][] = [[]]
  let count = 0
  for (const p of paragraphs) {
    const lines = wrap(p)
    // 43 body lines per A4 page; leave margin for footer and heading.
    if (count && count + lines.length + 1 > 43) {
      pages.push([])
      count = 0
    }
    for (const line of lines) {
      if (count >= 43) {
        pages.push([])
        count = 0
      }
      pages[pages.length - 1].push(line)
      count++
    }
    pages[pages.length - 1].push("")
    count++
  }
  // Separate signature page avoids crowding and is predictable for signing coordinates.
  pages.push([])
  const objects: string[] = []
  const add = (s: string) => { objects.push(s); return objects.length }
  const pagesId = add("")
  const fontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
  const pageIds: number[] = []
  for (let index = 0; index < pages.length; index++) {
    const commands: string[] = []
    const put = (x: number, y: number, size: number, s: string) => {
      commands.push(`BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm ${literal(s)} Tj ET`)
    }
    put(48, 800, 17, "VERLO | CONTRATO DE ALQUILER")
    put(48, 777, 9, `Contrato ${args.contractId} | Version ${args.version}`)
    commands.push("0.7 w 48 765 m 547 765 l S")
    if (index < pages.length - 1) {
      let y = 738
      for (const line of pages[index]) {
        if (line) put(48, y, 10, line)
        y -= 15
      }
    } else {
      put(48, 725, 12, "ESPACIOS RESERVADOS PARA FIRMA")
      put(48, 693, 10, "Documento previo a la firma.")
      put(48, 610, 10, "PROPIETARIO/A")
      commands.push("48 548 m 280 548 l S")
      put(48, 530, 9, "Firma y aclaracion")
      put(48, 455, 10, "INQUILINO/A")
      commands.push("48 393 m 280 393 l S")
      put(48, 375, 9, "Firma y aclaracion")
    }
    commands.push("0.7 w 48 75 m 547 75 l S")
    put(48, 60, 7.5, "SHA-256 del texto contractual: " + args.sha256)
    put(48, 44, 8, `Copia previa a la firma | Pagina ${index + 1} de ${pages.length}`)
    const stream = commands.join("\n") + "\n"
    const data = Buffer.from(stream, "latin1")
    const contentId = add(`<< /Length ${data.length} >>\nstream\n${stream}endstream`)
    pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`))
  }
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => id + " 0 R").join(" ")}] /Count ${pageIds.length} >>`
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "latin1")]
  const offsets = [0]
  let size = chunks[0].length
  for (let i = 0; i < objects.length; i++) {
    offsets.push(size)
    const chunk = Buffer.from(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`, "latin1")
    chunks.push(chunk)
    size += chunk.length
  }
  const xrefOffset = size
  const xref = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f ", ...offsets.slice(1).map(x => String(x).padStart(10, "0") + " 00000 n "), "trailer", `<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>`, "startxref", String(xrefOffset), "%%EOF", ""].join("\n")
  chunks.push(Buffer.from(xref, "ascii"))
  return Buffer.concat(chunks)
}

