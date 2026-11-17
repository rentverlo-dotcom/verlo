/** Titles and destination wording supported by the EXISTING owner property form.
 * Source: app/propietario/publicar-v2/page.tsx (apartment, house, ph, room, local).
 * Do not infer the legal purpose from an apartment-normalized property record:
 * that form currently maps PH and local to apartment on the listings table.
 */
export type TraditionalPurpose = "housing" | "room" | "commercial" | "office" | "unspecified"

export function traditionalContractPurpose(rawType: unknown): TraditionalPurpose {
  const type = String(rawType ?? "").trim().toLocaleLowerCase("es-AR")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  if (["apartment", "departamento", "house", "casa", "ph", "propiedad horizontal"].includes(type)) return "housing"
  if (["room", "habitacion"].includes(type)) return "room"
  if (["local", "local comercial"].includes(type)) return "commercial"
  if (["oficina", "office"].includes(type)) return "office"
  if (["otro", "other"].includes(type)) return "unspecified"
  // Existing older leads may have no value; preserve the previous residential
  // behavior in that situation. Reject unknown explicit types rather than
  // issuing a falsely titled residential contract for a commercial property.
  if (!type) return "housing"
  throw new Error("TIPO_DE_PROPIEDAD_NO_CONTEMPLADO_EN_CONTRATO")
}

export function traditionalContractTitle(purpose: TraditionalPurpose): string {
  if (purpose === "commercial") return "CONTRATO DE LOCACIÓN COMERCIAL"
  if (purpose === "room") return "CONTRATO DE LOCACIÓN DE HABITACIÓN"
  if (purpose === "office") return "CONTRATO DE LOCACIÓN DE OFICINA"
  if (purpose === "unspecified") return "CONTRATO DE LOCACIÓN DE INMUEBLE"
  return "CONTRATO DE LOCACIÓN DE VIVIENDA"
}

export function traditionalContractDestination(purpose: TraditionalPurpose): { use: string; restrictions: string; occupation: string } {
  if (purpose === "commercial") return {
    use: "EL LOCATARIO destinará el inmueble exclusivamente al desarrollo de una actividad comercial lícita, conforme al destino permitido por la normativa aplicable y las condiciones expresamente acordadas entre las partes. Las autorizaciones y habilitaciones exigibles para la actividad deberán observarse según corresponda.",
    restrictions: "Queda prohibido destinar el inmueble a actividades ilícitas o incompatibles con el destino comercial convenido, las habilitaciones y los reglamentos aplicables.",
    occupation: "La ocupación del inmueble deberá respetar el destino comercial convenido y las disposiciones aplicables.",
  }
  if (purpose === "office") return {
    use: "EL LOCATARIO destinará el inmueble a oficina, conforme al destino expresamente acordado entre las partes, las reglamentaciones y las habilitaciones que resulten exigibles.",
    restrictions: "Queda prohibido desarrollar actividades ilícitas o incompatibles con el destino de oficina convenido y con las disposiciones aplicables.",
    occupation: "La ocupación del inmueble deberá respetar el destino de oficina convenido y sus normas aplicables.",
  }
  if (purpose === "unspecified") return {
    use: "EL LOCATARIO destinará el inmueble únicamente al uso que las partes determinen expresamente en las condiciones particulares del contrato, respetando los usos permitidos y las autorizaciones legalmente exigibles. El destino específico deberá quedar acordado antes de firmar.",
    restrictions: "Queda prohibido destinar el inmueble a actividades ilícitas o incompatibles con el destino expresamente convenido y las disposiciones aplicables.",
    occupation: "La ocupación del inmueble deberá respetar el destino específico acordado por las partes y las normas aplicables.",
  }
  if (purpose === "room") return {
    use: "EL LOCATARIO destinará la habitación objeto del contrato exclusivamente a vivienda propia, conforme las condiciones acordadas entre las partes y el uso compartido de los espacios que, en su caso, se hubieran pactado.",
    restrictions: "Queda prohibido destinar la habitación a actividades ilícitas o incompatibles con su carácter habitacional y con las normas de convivencia, reglamentos y disposiciones aplicables.",
    occupation: "La ocupación de la habitación deberá respetar el destino habitacional convenido y las normas de convivencia correspondientes.",
  }
  return {
    use: "EL LOCATARIO destinará el inmueble exclusivamente a vivienda propia y de las personas que integren su grupo conviviente o familiar, salvo autorización expresa y escrita de EL LOCADOR para un destino distinto permitido por la normativa aplicable.",
    restrictions: "Queda prohibido destinar el inmueble a actividades ilícitas o incompatibles con su carácter habitacional y con las normas de convivencia, reglamentos y disposiciones aplicables.",
    occupation: "La ocupación del inmueble deberá respetar el destino habitacional convenido y las normas de convivencia correspondientes.",
  }
}
