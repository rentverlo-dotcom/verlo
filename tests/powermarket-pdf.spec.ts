import { test, expect } from "@playwright/test"
import { createHash } from "node:crypto"
import { createCaucionContractPdf } from "../lib/powermarket/contract-pdf"
import { createTemporaryContractPdf } from "../lib/temporarios/contract-pdf"
import { traditionalContractPurpose, traditionalContractTitle, traditionalContractDestination } from "../lib/contracts/traditional-purpose"

const hash = (value: string) => createHash("sha256").update(value, "utf8").digest("hex")
const pdfOf = (content: string) => createCaucionContractPdf({
  documentText: content, version: 1, sha256: hash(content),
  contractId: "11111111-1111-4111-8111-111111111111",
})

test("PowerMarket PDF contains complete Spanish contractual clauses with WinAnsi encoding", () => {
  const clauses = [
    "CLÁUSULA PRIMERA — LOCACIÓN",
    "El señor José Muñoz, DNI 12.345.678, alquila en CABA.",
    "El canon será de $ 350.000, más expensas, depósito y actualización.",
    "Las partes aceptan las condiciones: «únicamente»; año 2026.",
  ]
  const content = clauses.join("\n\n")
  const pdf = pdfOf(content)
  const body = pdf.toString("latin1")
  expect(body.startsWith("%PDF-1.4")).toBeTruthy()
  expect(body.trimEnd().endsWith("%%EOF")).toBeTruthy()
  expect(body).toContain("xref")
  expect(body).not.toContain("SHA-256 del texto contractual:")
  expect(body).toContain("/Subtype /Image")
  expect(body).toContain("/Logo")
  expect(body).toContain("/Times-Italic")
  expect(body).toContain("verlo")
  expect(body).toContain("José Muñoz")
  expect(body).toContain("CLÁUSULA PRIMERA \x97 LOCACIÓN")
  for (const text of ["canon será", "más expensas", "depósito", "actualización", "2026"]) {
    expect(body).toContain(text)
  }
  expect(pdf.length).toBeGreaterThan(900)
})

test("PowerMarket PDF keeps repeated spaces and explicit line breaks", () => {
  const text = "DNI: 12  345   678\nDOMICILIO: Calle 123\n\nImporte: $  100.000"
  const pdf = pdfOf(text).toString("latin1")
  expect(pdf).toContain("DNI: 12  345   678")
  expect(pdf).toContain("DOMICILIO: Calle 123")
  expect(pdf).toContain("Importe: $  100.000")
})

test("PowerMarket PDF renders real LF and CRLF separators without rejecting newline characters", () => {
  const text = ["PRIMERA — OBJETO", "El inmueble está en Olivos.", "SEGUNDA — PRECIO"].join("\n") + "\r\nFin del contrato."
  const pdf = pdfOf(text).toString("latin1")
  expect(pdf).toContain("PRIMERA \x97 OBJETO")
  expect(pdf).toContain("El inmueble está en Olivos.")
  expect(pdf).toContain("SEGUNDA \x97 PRECIO")
  expect(pdf).toContain("Fin del contrato.")
})

test("PowerMarket PDF fails closed for unsupported characters rather than changing legal text", () => {
  expect(() => pdfOf("Contrato con carácter no WinAnsi: 漢")).toThrow(/no representable/)
})

test("PowerMarket PDF paginates long paragraphs and leaves one signing page", () => {
  const content = Array.from({ length: 90 }, (_, index) =>
    `Cláusula ${index + 1}: alquiler temporario únicamente en Argentina.`).join("\n\n")
  const pdf = pdfOf(content).toString("latin1")
  expect((pdf.match(/\/Type \/Page \/Parent/g) || []).length).toBeGreaterThan(2)
  expect(pdf).toContain("ESPACIOS RESERVADOS PARA FIRMA")
  expect(pdf).toContain("Cláusula 90")
})


test("VERLO branded PDF keeps legal wording and no visible technical hash or C2PA", () => {
  const clauses = Array.from({ length: 27 }, (_, i) => `Cláusula ${i + 1}: Se acuerda el alquiler mensual y las condiciones particulares del inmueble.`).join("\n\n")
  const pdf = pdfOf(clauses).toString("latin1")
  expect(pdf).toContain("Cláusula 27")
  expect(pdf).not.toContain("SHA-256 del texto contractual")
  expect(pdf).not.toContain("C2PA")
  expect(pdf).toContain("ESPACIOS RESERVADOS PARA FIRMA")
  expect(pdf).toContain("/Logo")
  expect(pdf).toContain("/Subtype /Image")
  expect(pdf).toContain("Contrato VERLO")
  expect(pdf).toContain("verlo")
})


test("traditional form types use correct contractual purpose and prohibit misleading housing titles", () => {
  for (const type of ["apartment", "house", "ph", "Departamento", "Casa", "PH"]) {
    expect(traditionalContractTitle(traditionalContractPurpose(type))).toBe("CONTRATO DE LOCACIÓN DE VIVIENDA")
  }
  expect(traditionalContractTitle(traditionalContractPurpose("room"))).toBe("CONTRATO DE LOCACIÓN DE HABITACIÓN")
  const commercial = traditionalContractPurpose("local")
  expect(traditionalContractTitle(commercial)).toBe("CONTRATO DE LOCACIÓN COMERCIAL")
  expect(traditionalContractDestination(commercial).use).not.toContain("vivienda propia")
  expect(() => traditionalContractPurpose("unknown-commercial")).toThrow()
})

test("PDF VerloBrand header reflects actual commercial and room document titles", () => {
  for (const type of ["local", "room", "ph"]) {
    const title = traditionalContractTitle(traditionalContractPurpose(type))
    const text = title + "\\n\\nPRIMERA — OBJETO\\nEl contrato respeta el destino previsto."
    const pdf = pdfOf(text).toString("latin1")
    expect(pdf.match(new RegExp(title, "g"))?.length).toBeGreaterThanOrEqual(2)
    if (type === "local") expect(pdf).not.toContain("CONTRATO DE LOCACIÓN DE VIVIENDA")
    expect(pdf).toContain("/Logo")
  }
})

test("temporarios PDF shares exact VerloBrand visuals with separate temporary agreement title", () => {
  const content = "CONTRATO DE ESTADÍA TEMPORARIA\\n\\nLas partes acuerdan la reserva temporal de la propiedad."
  const pdf = createTemporaryContractPdf({ documentText: content, sha256: hash(content), version: 1,
    contractId: "11111111-1111-4111-8111-111111111111" }).toString("latin1")
  expect(pdf).toContain("CONTRATO DE ESTADÍA TEMPORARIA")
  expect(pdf).toContain("/Logo")
  expect(pdf).not.toContain("SHA-256 del texto contractual")
  expect(pdf).toContain("ESPACIOS RESERVADOS PARA FIRMA")
})
