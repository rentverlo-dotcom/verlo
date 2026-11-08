/**
 * VERLO branded pre-signature contractual PDF, reused for PowerMarket review.
 * Legal source text and its SHA256 are untouched. One PDF revision, no C2PA,
 * AcroForm, annotations, prior signatures or encryption.
 * Branding matches components/VerloBrand.tsx and public/logo-verlo.png.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { deflateSync, inflateSync } from "node:zlib"

const BLACK = "0.020 0.000 0.008"
const PINK = "0.925 0.282 0.600"
const MUTED = "0.42 0.39 0.42"
const LEFT = 52
const RIGHT = 543
const WIDTH = RIGHT - LEFT
const BODY_SIZE = 10.5
const BODY_LEADING = 15.2

const winAnsiSpecial: Record<number, number> = {
  0x20ac:0x80,0x201a:0x82,0x0192:0x83,0x201e:0x84,0x2026:0x85,
  0x2020:0x86,0x2021:0x87,0x02c6:0x88,0x2030:0x89,0x0160:0x8a,
  0x2039:0x8b,0x0152:0x8c,0x017d:0x8e,0x2018:0x91,0x2019:0x92,
  0x201c:0x93,0x201d:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,
  0x02dc:0x98,0x2122:0x99,0x0161:0x9a,0x203a:0x9b,0x0153:0x9c,
  0x017e:0x9e,0x0178:0x9f,
}
function latin1(value: string): string {
  let out = ""
  for (const char of value) {
    const cp = char.codePointAt(0)!
    const mapped = (cp >= 32 && cp <= 126) || (cp >= 160 && cp <= 255)
      ? cp : winAnsiSpecial[cp]
    if (mapped === undefined) {
      throw new Error("Caracter Unicode no representable en PDF: U+" + cp.toString(16).toUpperCase())
    }
    out += String.fromCharCode(mapped)
  }
  return out
}
function pdfString(value: string): string {
  return "(" + latin1(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)") + ")"
}

// Conservative character advance estimates calibrated to Helvetica; prevents
// overflowing the A4 text area, unlike fixed 50-character slicing.
function widthOf(text: string, size: number): number {
  let units = 0
  for (const c of text) {
    if ("ilI.,:;!|'".includes(c)) units += 0.28
    else if ("mwMW@%".includes(c)) units += 0.89
    else if ("frt()[]-/".includes(c)) units += 0.40
    else if (c === " ") units += 0.29
    else if ("ABCDEFGHKNOPQRSTUVXYZÁÉÍÓÚÑ".includes(c)) units += 0.70
    else units += 0.56
  }
  return units * size
}
function wrapLine(input: string, size: number, maxWidth: number): string[] {
  if (!input) return [""]
  const tokens = input.match(/\S+|\s+/g) ?? []
  const lines: string[] = []
  let current = ""
  const flush = () => { if (current) lines.push(current.trimEnd()); current = "" }
  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      if (current) current += token
      continue
    }
    const candidate = current + token
    if (widthOf(candidate, size) <= maxWidth) {
      current = candidate
      continue
    }
    if (current.trim()) flush()
    if (widthOf(token, size) <= maxWidth) {
      current = token
    } else {
      // Extremely long tokens (URLs) are the only unavoidable character wraps.
      let piece = ""
      for (const ch of token) {
        if (widthOf(piece + ch, size) > maxWidth && piece) {
          lines.push(piece)
          piece = ""
        }
        piece += ch
      }
      current = piece
    }
  }
  flush()
  return lines.length ? lines : [""]
}
function isClauseTitle(line: string): boolean {
  return /^(PRELIMINAR|PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA|VIGÉSIMA)(?:\s|$)/.test(line) ||
    /^(CONTRATO DE LOCACIÓN DE VIVIENDA|DATOS PRINCIPALES DEL CONTRATO|INMUEBLE:|LOCADOR:|LOCATARIO:|PLAZO:|ALQUILER MENSUAL INICIAL:|DEPÓSITO:|ACTUALIZACIÓN:|AMOBLAMIENTO:)$/.test(line)
}
type PDFLine = { text: string; x: number; y: number; font: "F1" | "F2" | "F3"; size: number }
type Page = { lines: PDFLine[]; signature?: true }

function layout(documentText: string): Page[] {
  const pages: Page[] = [{ lines: [] }]
  let y = 706
  const newPage = () => { pages.push({ lines: [] }); y = 706 }
  const push = (text: string, size: number, font: PDFLine["font"], gap: number) => {
    if (y < 91) newPage()
    pages[pages.length - 1].lines.push({ text, x: LEFT, y, font, size })
    y -= gap
  }
  const source = documentText.replace(/\r\n?/g, "\n").split("\n")
  for (let i = 0; i < source.length; i++) {
    const line = source[i]
    if (!line) {
      // Paragraph break without creating an empty content line.
      y -= 7
      continue
    }
    const heading = isClauseTitle(line)
    if (heading && y < 118) newPage() // keep clause heading with first paragraph
    if (heading) y -= 5
    const font: PDFLine["font"] = heading ? "F2" : "F1"
    const size = heading ? 10.4 : BODY_SIZE
    const pieces = wrapLine(line, size, WIDTH)
    for (const piece of pieces) {
      push(piece, size, font, heading ? 16.0 : BODY_LEADING)
    }
    if (heading) y -= 3
  }
  pages.push({ lines: [], signature: true })
  return pages
}

// Decode the real /public/logo-verlo.png for embedding as a PDF Image XObject.
// It is not a redraw, replacement logo or made-up branding.
function logoPixels(): { w: number; h: number; rgb: Buffer; alpha: Buffer | null } {
  const bytes = readFileSync(join(process.cwd(), "public", "logo-verlo.png"))
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("Invalid VERLO logo PNG")
  let w = 0, h = 0, depth = 0, color = 0, palette: Buffer | null = null, transparency: Buffer | null = null
  const chunks: Buffer[] = []
  for (let p = 8; p + 12 <= bytes.length;) {
    const n = bytes.readUInt32BE(p)
    const name = bytes.toString("ascii", p + 4, p + 8)
    const chunk = bytes.subarray(p + 8, p + 8 + n)
    if (name === "IHDR") { w = chunk.readUInt32BE(0); h = chunk.readUInt32BE(4); depth = chunk[8]; color = chunk[9]; if (chunk[12] !== 0) throw new Error("Interlaced VERLO PNG unsupported") }
    if (name === "PLTE") palette = chunk
    if (name === "tRNS") transparency = chunk
    if (name === "IDAT") chunks.push(chunk)
    p += n + 12
    if (name === "IEND") break
  }
  if (!w || !h || w * h > 12000000 || depth !== 8) throw new Error("Unsupported VERLO logo PNG dimensions/depth")
  const channels = color === 6 ? 4 : color === 2 ? 3 : color === 4 ? 2 : color === 0 || color === 3 ? 1 : 0
  if (!channels) throw new Error("Unsupported VERLO PNG color type " + color)
  const stride = w * channels
  const raw = inflateSync(Buffer.concat(chunks))
  const rgb = Buffer.alloc(w * h * 3)
  const alpha = Buffer.alloc(w * h, 255)
  let pos = 0
  let prior = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const filter = raw[pos++]
    const scan = Buffer.from(raw.subarray(pos, pos + stride)); pos += stride
    if (scan.length !== stride) throw new Error("Truncated VERLO PNG")
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? scan[x - channels] : 0
      const b = prior[x], c = x >= channels ? prior[x - channels] : 0
      const paeth = (() => {
        const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c)
        return da <= db && da <= dc ? a : db <= dc ? b : c
      })()
      const adjustment = filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : filter === 4 ? paeth : NaN
      if (!Number.isFinite(adjustment)) throw new Error("Invalid PNG predictor")
      scan[x] = (scan[x] + adjustment) & 255
    }
    for (let x = 0; x < w; x++) {
      const o = x * channels, dest = (y * w + x) * 3, aa = y * w + x
      if (color === 6 || color === 2) {
        rgb[dest] = scan[o]; rgb[dest + 1] = scan[o + 1]; rgb[dest + 2] = scan[o + 2]
        if (color === 6) alpha[aa] = scan[o + 3]
      } else if (color === 4 || color === 0) {
        rgb[dest] = rgb[dest + 1] = rgb[dest + 2] = scan[o]
        if (color === 4) alpha[aa] = scan[o + 1]
      } else {
        const idx = scan[o]
        if (!palette || 3 * idx + 2 >= palette.length) throw new Error("Invalid VERLO PNG palette")
        rgb[dest] = palette[3 * idx]; rgb[dest + 1] = palette[3 * idx + 1]; rgb[dest + 2] = palette[3 * idx + 2]
        alpha[aa] = transparency?.[idx] ?? 255
      }
    }
    prior = scan
  }
  return { w, h, rgb, alpha: alpha.every(x => x === 255) ? null : alpha }
}
function streamObject(dictionary: string, data: Buffer): Buffer {
  return Buffer.concat([
    Buffer.from("<< " + dictionary + " /Length " + data.length + " >>\nstream\n", "ascii"),
    data, Buffer.from("\nendstream", "ascii"),
  ])
}
export function createCaucionContractPdf(args: {
  documentText: string; version: number; sha256: string; contractId: string
}): Buffer {
  // Validation and preserved hash: never alter legal clauses or trust changed PDF text.
  latin1(args.documentText.replace(/\r\n?/g, "").replace(/\n/g, " "))
  if (!/^[a-f0-9]{64}$/i.test(args.sha256)) throw new Error("Invalid contractual SHA256")
  const pages = layout(args.documentText)
  const png = logoPixels()
  const objects: Buffer[] = []
  const add = (x: Buffer | string) => { objects.push(typeof x === "string" ? Buffer.from(x, "latin1") : x); return objects.length }
  const rootPages = add("")
  const fontBody = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
  const fontBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
  const fontBrand = add("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>")
  const alphaId = png.alpha ? add(streamObject(
    "/Type /XObject /Subtype /Image /Width " + png.w + " /Height " + png.h +
    " /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode",
    deflateSync(png.alpha)
  )) : 0
  const imageId = add(streamObject(
    "/Type /XObject /Subtype /Image /Width " + png.w + " /Height " + png.h +
    " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode" +
    (alphaId ? " /SMask " + alphaId + " 0 R" : ""),
    deflateSync(png.rgb)
  ))
  const pageIds: number[] = []
  const total = pages.length
  pages.forEach((page, idx) => {
    const cmd: string[] = []
    const drawText = (x: number, y: number, font: string, size: number, text: string, color = BLACK) =>
      cmd.push(color + " rg BT /" + font + " " + size + " Tf 1 0 0 1 " + x + " " + y + " Tm " + pdfString(text) + " Tj ET")
    // Exact repo logo + VerloBrand Georgia/Times-style italic wordmark.
    cmd.push("q 27 0 0 27 52 772 cm /Logo Do Q")
    drawText(88, 780, "F3", 27, "verlo")
    drawText(LEFT, 753, "F2", 12.5, "CONTRATO DE LOCACIÓN DE VIVIENDA")
    drawText(LEFT, 737, "F1", 8.4, "Versión " + args.version + " · Copia previa a la firma", MUTED)
    cmd.push(PINK + " RG 1.35 w " + LEFT + " 727 m " + RIGHT + " 727 l S")
    if (page.signature) {
      drawText(LEFT, 695, "F2", 12, "ESPACIOS RESERVADOS PARA FIRMA")
      drawText(LEFT, 670, "F1", 10, "Documento previo a la firma electrónica.")
      // Stable A4 coordinates for each signer, no page annotations/AcroForm.
      drawText(LEFT, 610, "F2", 11, "PROPIETARIO/A")
      cmd.push("0.55 0.55 0.55 RG 0.8 w 52 548 m 310 548 l S")
      drawText(LEFT, 530, "F1", 9, "Firma y aclaración", MUTED)
      drawText(LEFT, 455, "F2", 11, "INQUILINO/A")
      cmd.push("0.55 0.55 0.55 RG 0.8 w 52 393 m 310 393 l S")
      drawText(LEFT, 375, "F1", 9, "Firma y aclaración", MUTED)
    } else {
      for (const line of page.lines) drawText(line.x, line.y, line.font, line.size, line.text)
    }
    cmd.push("0.82 0.80 0.82 RG 0.5 w " + LEFT + " 68 m " + RIGHT + " 68 l S")
    drawText(LEFT, 53, "F3", 11, "verlo", BLACK)
    drawText(104, 53, "F1", 8, "Contrato de locación · Documento privado", MUTED)
    drawText(478, 53, "F1", 8, String(idx + 1) + " / " + total, MUTED)
    const data = Buffer.from(cmd.join("\n") + "\n", "latin1")
    const contentId = add(streamObject("", data))
    const res = "<< /Font << /F1 " + fontBody + " 0 R /F2 " + fontBold + " 0 R /F3 " + fontBrand + " 0 R >> /XObject << /Logo " + imageId + " 0 R >> >>"
    pageIds.push(add("<< /Type /Page /Parent " + rootPages + " 0 R /MediaBox [0 0 595 842] /Resources " + res + " /Contents " + contentId + " 0 R >>"))
  })
  objects[rootPages - 1] = Buffer.from("<< /Type /Pages /Kids [" + pageIds.map(id => id + " 0 R").join(" ") + "] /Count " + total + " >>", "ascii")
  const catalogId = add("<< /Type /Catalog /Pages " + rootPages + " 0 R >>")
  const buffers: Buffer[] = [Buffer.from("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "latin1")]
  const offsets = [0]
  let length = buffers[0].length
  objects.forEach((o, i) => {
    offsets.push(length)
    const b = Buffer.concat([Buffer.from((i + 1) + " 0 obj\n"), o, Buffer.from("\nendobj\n")])
    buffers.push(b); length += b.length
  })
  const trailer = ["xref", "0 " + (objects.length + 1), "0000000000 65535 f ",
    ...offsets.slice(1).map(x => String(x).padStart(10, "0") + " 00000 n "),
    "trailer", "<< /Size " + (objects.length + 1) + " /Root " + catalogId + " 0 R >>",
    "startxref", String(length), "%%EOF", ""].join("\n")
  buffers.push(Buffer.from(trailer, "ascii"))
  return Buffer.concat(buffers)
}
