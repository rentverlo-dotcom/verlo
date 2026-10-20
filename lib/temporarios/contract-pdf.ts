import { createHash } from "node:crypto"

// Generador PDF autocontenido: conserva el texto y crea espacios de firma.
// No constituye una firma digital ni modifica el documento contractual.
const clean = (s: string) => s
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/[\u2013\u2014]/g, "-")
  .replace(/\u2022/g, "-")
  .replace(/[^\x20-\x7e\xa0-\xff]/g, "?")

const literal = (s: string) => "(" + clean(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)") + ")"

function wrap(paragraph: string, limit = 88): string[] {
  const lines: string[] = []
  let line = ""
  for (const word of paragraph.split(/\s+/).filter(Boolean)) {
    if (line && (line + " " + word).length > limit) {
      lines.push(line)
      line = word
    } else {
      line += (line ? " " : "") + word
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : [""]
}

export function createTemporaryContractPdf(args: {
  documentText: string
  version: number
  sha256: string
  contractId: string
}): Buffer {
  const paragraphs = args.documentText.split(/\n\s*\n/)
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
    put(48, 800, 17, "VERLO | CONTRATO DE ESTADIA TEMPORARIA")
    put(48, 777, 9, `Contrato ${args.contractId} | Version ${args.version}`)
    commands.push("0.7 w 48 765 m 547 765 l S")
    if (index < pages.length - 1) {
      let y = 738
      for (const line of pages[index]) {
        if (line) put(48, y, 10, line)
        y -= 15
      }
    } else {
      put(48, 725, 12, "ESPACIOS RESERVADOS PARA FIRMA DIGITAL")
      put(48, 693, 10, "Este PDF no esta firmado. Las firmas se incorporaran mediante Identik.")
      put(48, 610, 10, "PROPIETARIO/A")
      commands.push("48 548 m 280 548 l S")
      put(48, 530, 9, "Firma y aclaracion")
      put(48, 455, 10, "INQUILINO/A")
      commands.push("48 393 m 280 393 l S")
      put(48, 375, 9, "Firma y aclaracion")
    }
    commands.push("0.7 w 48 75 m 547 75 l S")
    put(48, 60, 7.5, "SHA-256 del texto contractual: " + args.sha256)
    put(48, 44, 8, `Copia sin firmas digitales | Pagina ${index + 1} de ${pages.length}`)
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

export function verifyTemporaryContractText(text: string, expectedHash: string): boolean {
  return createHash("sha256").update(text, "utf8").digest("hex") === expectedHash
}
