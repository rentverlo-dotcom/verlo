"use client"

import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useState,
} from "react"
import VerloBrand from "@/components/VerloBrand"

const CONTACT_HREF =
  "https://mail.zoho.com/zm/#compose?to=hola@verlo.lat&subject=Consulta%20Verlo"

type Path = "tenant" | "owner" | "renewal"

type UploadedOwnerMedia = {
  key: string
  publicUrl: string | null
  filename: string
  contentType: string
  size: number
  mediaType: "photo" | "video"
}

async function uploadOwnerFileToR2(
  file: File,
  ownerLeadId: string
): Promise<UploadedOwnerMedia> {
  const presignResponse =
    await fetch(
      "/api/r2/presign",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          folder:
            "owner-media",
          id:
            ownerLeadId,
          filename:
            file.name,
          contentType:
            file.type,
        }),
      }
    )

  const presignData =
    await presignResponse
      .json()
      .catch(
        () => null
      )

  if (
    !presignResponse.ok ||
    !presignData?.ok ||
    !presignData?.uploadUrl ||
    !presignData?.key
  ) {
    throw new Error(
      presignData?.error ||
        `No pudimos preparar ${file.name}`
    )
  }

  let uploadResponse: Response

  try {
    uploadResponse =
      await fetch(
        presignData.uploadUrl,
        {
          method: "PUT",
          body: file,
        }
      )
  } catch (error) {
    throw new Error(
      `No pudimos subir ${file.name}: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    )
  }

  if (
    !uploadResponse.ok
  ) {
    const raw =
      await uploadResponse
        .text()
        .catch(
          () => ""
        )

    throw new Error(
      `R2 rechazó ${file.name}. HTTP ${uploadResponse.status}${
        raw
          ? ` - ${raw}`
          : ""
      }`
    )
  }

  return {
    key:
      String(
        presignData.key
      ),

    publicUrl:
      presignData.publicUrl
        ? String(
            presignData.publicUrl
          )
        : null,

    filename:
      file.name,

    contentType:
      file.type,

    size:
      file.size,

    mediaType:
      file.type.startsWith(
        "video/"
      )
        ? "video"
        : "photo",
  }
}

const AREA_GROUPS = {
  caba: {
    label: "CABA",
    neighborhoods: [
      "Agronomía",
      "Almagro",
      "Balvanera",
      "Barracas",
      "Belgrano",
      "Boedo",
      "Caballito",
      "Chacarita",
      "Coghlan",
      "Colegiales",
      "Constitución",
      "Flores",
      "Floresta",
      "La Boca",
      "Liniers",
      "Mataderos",
      "Monserrat",
      "Monte Castro",
      "Nueva Pompeya",
      "Núñez",
      "Palermo",
      "Parque Avellaneda",
      "Parque Chacabuco",
      "Parque Chas",
      "Parque Patricios",
      "Paternal",
      "Puerto Madero",
      "Recoleta",
      "Retiro",
      "Saavedra",
      "San Cristóbal",
      "San Nicolás",
      "San Telmo",
      "Vélez Sarsfield",
      "Versalles",
      "Villa Crespo",
      "Villa Devoto",
      "Villa General Mitre",
      "Villa Lugano",
      "Villa Luro",
      "Villa Ortúzar",
      "Villa Pueyrredón",
      "Villa Real",
      "Villa Riachuelo",
      "Villa Santa Rita",
      "Villa Soldati",
      "Villa Urquiza",
    ],
  },
  gba_norte: {
    label: "GBA Norte",
    neighborhoods: [
      "Vicente López",
      "Olivos",
      "Florida",
      "La Lucila",
      "Munro",
      "Villa Martelli",
      "Carapachay",
      "San Isidro",
      "Martínez",
      "Acassuso",
      "Beccar",
      "Boulogne",
      "Victoria",
      "San Fernando",
      "Tigre",
      "Don Torcuato",
      "Pacheco",
      "Benavídez",
      "Pilar",
      "Escobar",
    ],
  },
  gba_oeste: {
    label: "GBA Oeste",
    neighborhoods: [
      "Ramos Mejía",
      "Haedo",
      "Morón",
      "Castelar",
      "Ituzaingó",
      "Hurlingham",
      "Villa Tesei",
      "Ciudadela",
      "Liniers Oeste",
      "San Justo",
      "Lomas del Mirador",
      "Merlo",
      "Moreno",
    ],
  },
  gba_sur: {
    label: "GBA Sur",
    neighborhoods: [
      "Avellaneda",
      "Wilde",
      "Quilmes",
      "Bernal",
      "Lanús",
      "Lomas de Zamora",
      "Banfield",
      "Temperley",
      "Adrogué",
      "Burzaco",
      "Florencio Varela",
      "Berazategui",
      "Ezeiza",
      "Monte Grande",
    ],
  },
} as const

const OWNER_PRICE_RANGES = [
  {
    label: "Hasta $500.000",
    value: "hasta-500000",
    max: 500000,
  },
  {
    label: "$500.001 a $700.000",
    value: "500001-700000",
    max: 700000,
  },
  {
    label: "$700.001 a $900.000",
    value: "700001-900000",
    max: 900000,
  },
  {
    label: "$900.001 a $1.200.000",
    value: "900001-1200000",
    max: 1200000,
  },
  {
    label: "$1.200.001 a $1.500.000",
    value: "1200001-1500000",
    max: 1500000,
  },
  {
    label: "$1.500.001 a $2.000.000",
    value: "1500001-2000000",
    max: 2000000,
  },
  {
    label: "Más de $2.000.000",
    value: "2000000-plus",
    max: 999999999,
  },
] as const

const TENANT_BUDGET_RANGES = [
  {
    label: "Hasta $500.000",
    value: "hasta-500000",
    max: 500000,
  },
  {
    label: "$500.001 a $700.000",
    value: "500001-700000",
    max: 700000,
  },
  {
    label: "$700.001 a $900.000",
    value: "700001-900000",
    max: 900000,
  },
  {
    label: "$900.001 a $1.200.000",
    value: "900001-1200000",
    max: 1200000,
  },
  {
    label: "$1.200.001 a $1.500.000",
    value: "1200001-1500000",
    max: 1500000,
  },
  {
    label: "$1.500.001 a $2.000.000",
    value: "1500001-2000000",
    max: 2000000,
  },
  {
    label: "Más de $2.000.000",
    value: "2000000-plus",
    max: 999999999,
  },
] as const

const INCOME_RANGES = [
  {
    label: "Hasta $500.000",
    value: "0-500000",
    max: 500000,
  },
  {
    label: "$500.001 a $1.000.000",
    value: "500001-1000000",
    max: 1000000,
  },
  {
    label: "$1.000.001 a $1.500.000",
    value: "1000001-1500000",
    max: 1500000,
  },
  {
    label: "$1.500.001 a $2.000.000",
    value: "1500001-2000000",
    max: 2000000,
  },
  {
    label: "$2.000.001 a $3.000.000",
    value: "2000001-3000000",
    max: 3000000,
  },
  {
    label: "Más de $3.000.000",
    value: "3000001-plus",
    max: 999999999,
  },
] as const

const ALL_NEIGHBORHOODS =
  Object.values(AREA_GROUPS).flatMap(
    (group) => group.neighborhoods
  )

type AreaKey =
  keyof typeof AREA_GROUPS

function normalizeText(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
}

const pathConfig = {
  tenant: {
    title: "Busco alquilar",
    subtitle:
      "Marcá los barrios donde buscarías y completá tu presupuesto.",
    role: "tenant",
    intent: "tenant_search",
    button: "Cargar mi búsqueda",
  },
  owner: {
    title: "Tengo una propiedad",
    subtitle:
      "Decinos en qué barrio está, qué tipo es, a qué precio se alquilaría y cuándo estará disponible.",
    role: "owner",
    intent: "owner_new_listing",
    button: "Publicar mi propiedad",
  },
  renewal: {
    title: "Quiero renovar",
    subtitle:
      "Contanos el barrio, cuándo vence y qué necesitás resolver.",
    role: "both",
    intent: "contract_renewal",
    button: "Quiero renovar",
  },
} as const

const styles = `
  .test-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --blue: #74bedc;
    --yellow: #e7c776;
    min-height: 100vh;
    background: var(--soft);
    color: var(--black);
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .test-root * {
    box-sizing: border-box;
  }

  .container {
    width: min(1160px, calc(100% - 40px));
    margin: 0 auto;
  }

  .nav {
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(18px);
    background: rgba(242, 235, 236, 0.82);
    border-bottom: 1px solid rgba(5, 0, 2, 0.08);
  }

  .nav-inner {
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 18px;
    font-size: 14px;
  }

  .nav-links a {
    color: rgba(5, 0, 2, 0.72);
    text-decoration: none;
    font-weight: 900;
  }

  .nav-cta {
    padding: 10px 18px;
    border-radius: 999px;
    background: var(--black);
    color: white !important;
    min-width: 92px;
    text-align: center;
  }

  .hero {
    position: relative;
    padding: 88px 0 78px;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 1.02fr 0.98fr;
    gap: 64px;
    align-items: center;
  }

  .hero h1 {
    margin: 22px 0 0;
    font-size: clamp(54px, 7.4vw, 104px);
    line-height: 0.96;
    letter-spacing: -0.055em;
    font-weight: 950;
    max-width: 820px;
  }

  .hero h1 em {
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 400;
    letter-spacing: -0.035em;
  }

  .hero p {
    margin: 28px 0 0;
    max-width: 620px;
    font-size: 21px;
    line-height: 1.45;
    color: rgba(5, 0, 2, 0.68);
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 34px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 54px;
    padding: 0 24px;
    border-radius: 999px;
    border: 1px solid rgba(5, 0, 2, 0.12);
    text-decoration: none;
    font-size: 16px;
    font-weight: 950;
    cursor: pointer;
  }

  .btn-primary {
    background: var(--black);
    color: white;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
  }

  .btn-secondary {
    background: white;
    color: var(--black);
  }

  .trust-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 26px;
  }

  .pill {
    padding: 9px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.54);
    border: 1px solid rgba(5, 0, 2, 0.08);
    color: rgba(5, 0, 2, 0.7);
    font-weight: 800;
    font-size: 13px;
  }

  .phone-wrap {
    position: relative;
    min-height: 640px;
    display: grid;
    place-items: center;
  }

  .phone-glow {
    position: absolute;
    width: 520px;
    height: 520px;
    border-radius: 999px;
    background:
      radial-gradient(circle at 30% 35%, rgba(242, 168, 169, 0.85), transparent 30%),
      radial-gradient(circle at 76% 72%, rgba(116, 190, 220, 0.55), transparent 28%),
      radial-gradient(circle at 78% 22%, rgba(231, 199, 118, 0.42), transparent 24%);
    filter: blur(8px);
    opacity: 0.9;
    z-index: 1;
  }

  .phone-frame,
  .mini-phone {
    position: relative;
    width: min(420px, 84vw);
    aspect-ratio: 390 / 760;
    border: 10px solid var(--black);
    border-radius: 48px;
    overflow: hidden;
    background: #fbf8f5;
    box-shadow: 0 30px 90px rgba(5, 0, 2, 0.28);
    z-index: 2;
  }

  .mini-phone {
    width: 100%;
    max-width: 360px;
    box-shadow: 0 26px 76px rgba(5, 0, 2, 0.18);
  }

  .phone-top {
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 26px;
    background: #fbf8f5;
    border-bottom: 1px solid rgba(5, 0, 2, 0.06);
  }

  .mini-phone .phone-top {
    height: 68px;
    padding: 0 22px;
  }

  .phone-brand {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 31px;
    font-style: italic;
    font-weight: 800;
    letter-spacing: -0.055em;
  }

  .mini-phone .phone-brand {
    font-size: 28px;
  }

  .dots {
    display: flex;
    gap: 7px;
  }

  .dots span {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--black);
  }

  .phone-screen {
    height: calc(100% - 76px);
    padding: 18px 22px 24px;
    background:
      radial-gradient(circle at 20% 18%, rgba(242, 168, 169, 0.28), transparent 28%),
      radial-gradient(circle at 84% 90%, rgba(116, 190, 220, 0.20), transparent 28%),
      #fbf8f5;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .mini-phone .phone-screen {
    height: calc(100% - 68px);
    padding: 18px 20px 22px;
  }

  .phone-label {
    width: fit-content;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 11px;
    border-radius: 999px;
    background: rgba(242, 168, 169, 0.28);
    color: rgba(5, 0, 2, 0.74);
    font-size: 12px;
    font-weight: 950;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--pink-dark);
    box-shadow: 0 0 0 5px rgba(195, 121, 134, 0.16);
  }

  .phone-title {
    margin: 16px 0 0;
    font-size: 38px;
    line-height: 0.9;
    letter-spacing: -0.075em;
    font-weight: 950;
    min-height: 76px;
  }

  .mini-phone .phone-title {
    font-size: 34px;
    min-height: 68px;
  }

  .phone-copy {
    margin: 14px 0 0;
    color: rgba(5, 0, 2, 0.62);
    font-size: 15px;
    line-height: 1.42;
    font-weight: 650;
    min-height: 64px;
  }

  .mini-phone .phone-copy {
    min-height: 64px;
  }

  .phone-card {
    margin-top: 18px;
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(5, 0, 2, 0.08);
    padding: 18px;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.08);
  }

  .phone-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 13px 0;
    border-bottom: 1px solid rgba(5, 0, 2, 0.08);
  }

  .phone-row:last-child {
    border-bottom: 0;
  }

  .phone-row span {
    color: rgba(5, 0, 2, 0.48);
    font-size: 13px;
    font-weight: 850;
  }

  .phone-row strong {
    color: var(--black);
    text-align: right;
    font-size: 15px;
    font-weight: 950;
  }

  .phone-button {
    width: 100%;
    min-height: 54px;
    margin-top: auto;
    border: 0;
    border-radius: 999px;
    background: var(--black);
    color: white;
    font-size: 15px;
    font-weight: 950;
  }

  .section {
    padding: 86px 0;
  }

  .section-header {
    max-width: 790px;
    margin-bottom: 46px;
  }

  .kicker {
    margin: 0 0 14px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 12px;
    font-weight: 950;
    color: var(--pink-dark);
  }

  .section-title {
    margin: 0;
    font-size: clamp(40px, 5.5vw, 76px);
    line-height: 0.95;
    letter-spacing: -0.075em;
    font-weight: 950;
  }

  .section-title em {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 400;
    font-style: italic;
  }

  .section-copy {
    margin: 18px 0 0;
    font-size: 19px;
    line-height: 1.55;
    color: rgba(5, 0, 2, 0.68);
  }

  .mock-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 26px;
    align-items: start;
  }

  .mock-item {
    display: grid;
    gap: 24px;
    align-content: start;
    cursor: pointer;
  }

  .mock-item:hover .mini-phone {
    transform: translateY(-4px);
  }

  .mini-phone {
    transition: transform 180ms ease;
  }

  .mock-copy h3 {
    margin: 0;
    font-size: 34px;
    line-height: 0.95;
    letter-spacing: -0.065em;
    font-weight: 950;
  }

  .mock-copy p {
    margin: 12px 0 0;
    color: rgba(5, 0, 2, 0.66);
    font-size: 16px;
    line-height: 1.45;
    font-weight: 700;
  }

  .mock-copy a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 18px;
    min-height: 50px;
    padding: 0 20px;
    border-radius: 999px;
    background: var(--black);
    color: white;
    text-decoration: none;
    font-size: 14px;
    font-weight: 950;
  }

  .form-card {
    border-radius: 42px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(5, 0, 2, 0.08);
    box-shadow: 0 28px 80px rgba(5, 0, 2, 0.08);
  }

  .path-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 28px;
  }

  .path-card {
    padding: 22px;
    border-radius: 26px;
    background: rgba(255, 255, 255, 0.62);
    border: 1px solid rgba(5, 0, 2, 0.08);
    cursor: pointer;
    text-align: left;
    color: var(--black);
    transition: 160ms ease;
  }

  .path-card.active {
    background: var(--black);
    color: white;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
  }

  .path-card strong {
    display: block;
    font-size: 23px;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .path-card span {
    display: block;
    margin-top: 9px;
    font-size: 14px;
    line-height: 1.35;
    opacity: 0.72;
  }

  .form-head h3 {
    margin: 0;
    font-size: clamp(36px, 4vw, 58px);
    line-height: 0.95;
    letter-spacing: -0.075em;
    font-weight: 950;
  }

  .form-head p {
    margin: 14px 0 0;
    color: rgba(5, 0, 2, 0.64);
    line-height: 1.5;
    font-size: 17px;
  }

  .form {
    margin-top: 30px;
    display: grid;
    gap: 14px;
  }

  .honeypot {
    position: absolute !important;
    left: -9999px !important;
    width: 1px !important;
    height: 1px !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .input,
  .select {
    width: 100%;
    min-height: 56px;
    border: 1px solid rgba(5, 0, 2, 0.12);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.86);
    padding: 0 16px;
    color: var(--black);
    font-size: 15px;
    outline: none;
  }

  .input:focus,
  .select:focus {
    border-color: var(--pink-dark);
    box-shadow: 0 0 0 5px rgba(195, 121, 134, 0.12);
    background: white;
  }

  .neighborhood-box {
    border: 1px solid rgba(5, 0, 2, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.72);
    padding: 18px;
  }

  .neighborhood-box strong {
    display: block;
    font-size: 16px;
    margin-bottom: 12px;
  }

  .area-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-bottom: 14px;
  }

  .area-tab {
    min-height: 40px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(5, 0, 2, 0.1);
    background: white;
    color: var(--black);
    font-size: 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .area-tab.active {
    background: var(--black);
    color: white;
    box-shadow: 0 12px 28px rgba(5, 0, 2, 0.14);
  }

  .other-neighborhood {
    margin-top: 12px;
  }

  .neighborhood-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 6px;
  }

  .check-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 8px 12px;
    border-radius: 18px;
    background: white;
    border: 1px solid rgba(5, 0, 2, 0.1);
    font-size: 14px;
    line-height: 1.15;
    font-weight: 800;
    cursor: pointer;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .check-pill input {
    flex: 0 0 auto;
    accent-color: var(--black);
  }

  .owner-media-box {
    border: 1px solid rgba(5, 0, 2, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.72);
    padding: 18px;
    display: grid;
    gap: 14px;
  }

  .owner-media-head {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .owner-media-head strong {
    font-size: 16px;
  }

  .owner-media-head span {
    color: rgba(5, 0, 2, 0.58);
    font-size: 14px;
    line-height: 1.4;
    font-weight: 700;
  }

  .owner-media-picker {
    min-height: 88px;
    border: 2px dashed rgba(5, 0, 2, 0.22);
    border-radius: 20px;
    background: white;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
  }

  .owner-media-picker:hover {
    border-color: var(--pink-dark);
    background: rgba(242, 168, 169, 0.06);
  }

  .owner-media-picker input {
    display: none;
  }

  .owner-media-plus {
    width: 48px;
    height: 48px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: var(--pink);
    color: var(--black);
    font-size: 28px;
    line-height: 1;
    font-weight: 900;
  }

  .owner-media-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .owner-media-copy b {
    font-size: 15px;
  }

  .owner-media-copy small {
    color: rgba(5, 0, 2, 0.55);
    font-size: 13px;
    font-weight: 700;
  }

  .owner-media-selected {
    display: grid;
    gap: 10px;
  }

  .owner-media-selected > strong {
    font-size: 14px;
  }

  .owner-media-list {
    display: grid;
    gap: 7px;
  }

  .owner-media-file {
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    padding: 9px 11px;
    border-radius: 14px;
    background: rgba(242, 235, 236, 0.8);
    font-size: 13px;
    font-weight: 800;
  }

  .owner-media-file span:nth-child(2) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .owner-media-file small {
    color: rgba(5, 0, 2, 0.52);
    white-space: nowrap;
    font-weight: 800;
  }

  .owner-media-progress {
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(116, 190, 220, 0.18);
    color: var(--black);
    font-size: 13px;
    font-weight: 900;
  }

  .submit {
    width: 100%;
    min-height: 58px;
    border: 0;
    border-radius: 999px;
    background: var(--black);
    color: white;
    font-size: 16px;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
    appearance: none;
    -webkit-appearance: none;
  }

  .submit:hover {
    transform: translateY(-1px);
  }

  .submit:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  .error,
  .success {
    margin: 0;
    padding: 14px 16px;
    border-radius: 18px;
    font-size: 14px;
    font-weight: 850;
  }

  .error {
    background: rgba(195, 121, 134, 0.14);
    color: #7f2435;
  }

  .success {
    background: rgba(116, 190, 220, 0.16);
    color: #255a6d;
  }

  .footer {
    padding: 54px 0;
    border-top: 1px solid rgba(5, 0, 2, 0.1);
    background: rgba(255, 255, 255, 0.34);
  }

  .footer-inner {
    display: flex;
    justify-content: space-between;
    gap: 32px;
    align-items: flex-start;
    color: rgba(5, 0, 2, 0.58);
    font-size: 14px;
  }

  .footer-brand {
    display: grid;
    gap: 12px;
  }

  .footer-brand p {
    margin: 0;
    max-width: 280px;
    line-height: 1.45;
    color: rgba(5, 0, 2, 0.62);
    font-weight: 700;
  }

  .footer-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 16px 22px;
  }

  .footer-links a {
    color: rgba(5, 0, 2, 0.66);
    text-decoration: none;
    font-weight: 800;
  }

  .launch-ticket {
    position: relative;
    display: inline-block;
    margin: 22px 0 30px;
    padding: 7px;
    background: #f2a8a9;
    border-radius: 22px;
    box-shadow: 0 12px 35px rgba(5, 0, 2, 0.12);
  }

  .launch-ticket::before,
  .launch-ticket::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 18px;
    height: 36px;
    background: #f5eaea;
    border-radius: 50%;
    transform: translateY(-50%);
  }

  .launch-ticket::before {
    left: -9px;
  }

  .launch-ticket::after {
    right: -9px;
  }

  .launch-ticket-inner {
    min-width: 300px;
    padding: 14px 24px 16px;
    border: 2px dashed rgba(5, 0, 2, 0.35);
    border-radius: 16px;
    text-align: center;
    color: #050002;
  }

  .launch-ticket-label {
    display: block;
    margin-bottom: 5px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.16em;
  }

  .launch-ticket-price {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
  }

  .launch-ticket-old {
    position: relative;
    font-size: 22px;
    font-weight: 700;
    opacity: 0.55;
  }

  .launch-ticket-old::after {
    content: "";
    position: absolute;
    left: -5px;
    right: -5px;
    top: 50%;
    height: 3px;
    background: #050002;
    transform: rotate(-7deg);
  }

  .launch-ticket-free {
    font-size: 42px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: -0.055em;
  }

  .launch-ticket-line {
    width: 75%;
    height: 1px;
    margin: 10px auto 8px;
    background: rgba(5, 0, 2, 0.28);
  }

  .launch-ticket-copy {
    display: block;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  @media (max-width: 1060px) {
    .hero-grid {
      grid-template-columns: 1fr;
    }

    .mock-grid {
      grid-template-columns: 1fr;
    }

    .mock-item {
      grid-template-columns: minmax(280px, 380px) 1fr;
      align-items: center;
    }
  }

  @media (max-width: 760px) {
    .container {
      width: min(100% - 28px, 1160px);
    }

    .nav-inner {
      height: 66px;
    }

    .nav-links a:not(.nav-cta) {
      display: none;
    }

    .hero {
      padding: 58px 0 54px;
    }

    .hero p {
      font-size: 18px;
    }

    .hero-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }

    .phone-wrap {
      min-height: 560px;
    }

    .phone-frame {
      width: min(340px, 90vw);
    }

    .mock-item {
      grid-template-columns: 1fr;
    }

    .mini-phone {
      max-width: 340px;
      margin: 0 auto;
    }

    .path-grid,
    .row,
    .neighborhood-grid {
      grid-template-columns: 1fr;
    }

    .form-card {
      padding: 28px;
      border-radius: 32px;
    }

    .owner-media-file {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .owner-media-file small {
      grid-column: 2;
    }

    .footer-inner {
      flex-direction: column;
      align-items: flex-start;
    }

    .footer-links {
      justify-content: flex-start;
    }
  }
`

function getCookie(
  name: string
) {
  if (
    typeof document ===
    "undefined"
  ) {
    return ""
  }

  return (
    document.cookie
      .split("; ")
      .find((row) =>
        row.startsWith(
          `${name}=`
        )
      )
      ?.split("=")[1] ||
    ""
  )
}

function getMetaFbc() {
  if (
    typeof window ===
    "undefined"
  ) {
    return ""
  }

  const cookieFbc =
    getCookie("_fbc")

  if (cookieFbc) {
    return cookieFbc
  }

  const fbclid =
    new URLSearchParams(
      window.location.search
    ).get("fbclid")

  if (!fbclid) {
    return ""
  }

  return `fb.1.${Date.now()}.${fbclid}`
}

function trackMetaLead(
  eventId: string,
  params?: Record<
    string,
    string
  >
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return
  }

  const fbq =
    (
      window as unknown as {
        fbq?: (
          ...args: unknown[]
        ) => void
      }
    ).fbq

  if (
    typeof fbq ===
    "function"
  ) {
    fbq(
      "track",
      "Lead",
      {
        value: 500,
        currency: "ARS",
        ...(params || {}),
      },
      {
        eventID:
          eventId,
      }
    )
  }
}

function normalizeNeighborhoods(
  values: string[],
  otherValue?: string
) {
  const cleanValues =
    values
      .map((value) =>
        value.trim()
      )
      .filter(Boolean)

  const other =
    otherValue?.trim()

  if (other) {
    cleanValues.push(
      other
    )
  }

  return {
    labels:
      cleanValues,

    text:
      cleanValues.join(
        ", "
      ),

    slugs:
      cleanValues.map(
        normalizeText
      ),
  }
}

function Dots() {
  return (
    <div className="dots">
      <span />
      <span />
      <span />
    </div>
  )
}

function PhoneContent({
  badge,
  title,
  copy,
  rows,
  button,
}: {
  badge: string
  title: string
  copy: string
  rows: {
    label: string
    value: string
  }[]
  button: string
}) {
  return (
    <>
      <div className="phone-top">
        <div className="phone-brand">
          verlo
        </div>

        <Dots />
      </div>

      <div className="phone-screen">
        <div className="phone-label">
          <span className="dot" />
          {badge}
        </div>

        <h3 className="phone-title">
          {title}
        </h3>

        <p className="phone-copy">
          {copy}
        </p>

        <div className="phone-card">
          {rows.map(
            (row) => (
              <div
                className="phone-row"
                key={
                  row.label
                }
              >
                <span>
                  {
                    row.label
                  }
                </span>

                <strong>
                  {
                    row.value
                  }
                </strong>
              </div>
            )
          )}
        </div>

        <button
          className="phone-button"
          type="button"
        >
          {button}
        </button>
      </div>
    </>
  )
}

function HeroPhone() {
  return (
    <div
      className="phone-wrap"
      aria-hidden="true"
    >
      <div className="phone-glow" />

      <div className="phone-frame">
        <PhoneContent
          badge="Alquiler directo"
          title="Menos comisión. Más control."
          copy="Verlo ordena datos reales para matchear inquilinos y propietarios por barrio. Te cuida a vos y tu bolsillo."
          button="Empezar"
          rows={[
            {
              label: "Barrio",
              value: "Olivos",
            },
            {
              label: "Tipo",
              value: "2 ambientes",
            },
            {
              label: "Presupuesto",
              value: "$650k",
            },
            {
              label: "Estado",
              value: "Match posible",
            },
          ]}
        />
      </div>
    </div>
  )
}

function MiniPhone({
  type,
}: {
  type: Path
}) {
  if (
    type === "tenant"
  ) {
    return (
      <div className="mini-phone">
        <PhoneContent
          badge="Búsqueda activa"
          title="Buscá sin comisión"
          copy="Marcá los barrios donde buscás y tu presupuesto real."
          button="Cargar búsqueda"
          rows={[
            {
              label:
                "Barrios",
              value:
                "Olivos + Núñez",
            },
            {
              label:
                "Tipo",
              value:
                "2 ambientes",
            },
            {
              label:
                "Presupuesto",
              value:
                "$500k - $700k",
            },
            {
              label:
                "Mudanza",
              value:
                "30 días",
            },
          ]}
        />
      </div>
    )
  }

  if (
    type === "owner"
  ) {
    return (
      <div className="mini-phone">
        <PhoneContent
          badge="Propietario"
          title="Publicá tu propiedad"
          copy="Barrio, tipo, precio y disponibilidad para encontrar personas compatibles."
          button="Publicar"
          rows={[
            {
              label:
                "Barrio",
              value:
                "Vicente López",
            },
            {
              label:
                "Tipo",
              value:
                "Departamento",
            },
            {
              label:
                "Precio",
              value:
                "$650k",
            },
            {
              label:
                "Disponibilidad",
              value:
                "Ahora",
            },
          ]}
        />
      </div>
    )
  }

  return (
    <div className="mini-phone">
      <PhoneContent
        badge="Renovación"
        title="Renová sin comisión"
        copy="Digitalizá tu contrato rápido, con firma digital y sin costos de renovación."
        button="Renovar"
        rows={[
          {
            label:
              "Barrio",
            value:
              "Belgrano",
          },
          {
            label:
              "Contrato",
            value:
              "Por vencer",
          },
          {
            label:
              "Partes",
            value:
              "Ambas",
          },
          {
            label:
              "Firma",
            value:
              "Digital",
          },
        ]}
      />
    </div>
  )
}

export default function PageDePrueba() {
  const [
    path,
    setPath,
  ] =
    useState<Path>(
      "tenant"
    )

  const [
    selectedArea,
    setSelectedArea,
  ] =
    useState<AreaKey>(
      "caba"
    )

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState("")

  const [
    success,
    setSuccess,
  ] =
    useState("")

  const [
    ownerFiles,
    setOwnerFiles,
  ] =
    useState<File[]>(
      []
    )

  const [
    ownerUploadProgress,
    setOwnerUploadProgress,
  ] =
    useState("")

  const selected =
    pathConfig[path]

  const submitLabel =
    useMemo(() => {
      if (loading) {
        return path ===
          "owner"
          ? ownerUploadProgress ||
              "Publicando propiedad..."
          : "Guardando..."
      }

      return selected.button
    }, [
      loading,
      selected.button,
      path,
      ownerUploadProgress,
    ])

  function choosePath(
    nextPath: Path
  ) {
    setPath(nextPath)
    setError("")
    setSuccess("")
    setOwnerUploadProgress("")
  }

  function handleOwnerFiles(
    event:
      ChangeEvent<HTMLInputElement>
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

    setOwnerFiles(
      selectedFiles
    )

    setError("")
    setSuccess("")
    setOwnerUploadProgress("")
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    setLoading(true)
    setError("")
    setSuccess("")
    setOwnerUploadProgress("")

    const form =
      e.currentTarget

    const formData =
      new FormData(
        form
      )

    const website =
      String(
        formData.get(
          "website"
        ) || ""
      ).trim()

    if (website) {
      form.reset()
      setLoading(false)
      setSuccess("Listo.")
      return
    }

    const eventId =
      `lead_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`

    const selectedBudgetRange =
      String(
        formData.get(
          "budget_range"
        ) || ""
      ).trim()

    const selectedBudgetOption =
      TENANT_BUDGET_RANGES.find(
        (option) =>
          option.value ===
          selectedBudgetRange
      )

    const tenantBudgetMax =
      selectedBudgetOption
        ?.max ??
      null

    const selectedOwnerPriceRange =
      String(
        formData.get(
          "approx_price"
        ) || ""
      ).trim()

    const selectedOwnerPriceOption =
      OWNER_PRICE_RANGES.find(
        (option) =>
          option.value ===
          selectedOwnerPriceRange
      )

    const ownerPriceNumber =
      selectedOwnerPriceOption
        ?.max ??
      null

    const selectedIncomeRange =
      String(
        formData.get(
          "income_range"
        ) || ""
      ).trim()

    const selectedIncomeOption =
      INCOME_RANGES.find(
        (option) =>
          option.value ===
          selectedIncomeRange
      )

    const tenantIncomeMax =
      selectedIncomeOption
        ?.max ??
      null

    const tenantGuaranteeTypes =
      formData
        .getAll(
          "guarantee_types"
        )
        .map(String)

    const acceptedIncomeProofTypes =
      formData
        .getAll(
          "accepted_income_proof_types"
        )
        .map(String)

    const acceptedGuaranteeTypes =
      formData
        .getAll(
          "accepted_guarantee_types"
        )
        .map(String)

    const tenantNeighborhoods =
      formData
        .getAll(
          "tenant_neighborhoods"
        )
        .map(String)

    const tenantOtherNeighborhood =
      String(
        formData.get(
          "tenant_other_neighborhood"
        ) || ""
      ).trim()

    const normalizedTenantNeighborhoods =
      normalizeNeighborhoods(
        tenantNeighborhoods,
        tenantOtherNeighborhood
      )

    if (
      path ===
        "tenant" &&
      normalizedTenantNeighborhoods
        .labels
        .length ===
        0
    ) {
      setError(
        "Elegí al menos un barrio o escribí otra zona donde buscarías alquilar."
      )

      setLoading(false)
      return
    }

    if (
      path ===
        "tenant" &&
      tenantGuaranteeTypes.length ===
        0
    ) {
      setError(
        "Elegí al menos una opción de garantía."
      )

      setLoading(false)
      return
    }

    if (
      path ===
        "tenant" &&
      tenantGuaranteeTypes.includes(
        "none"
      ) &&
      tenantGuaranteeTypes.length >
        1
    ) {
      setError(
        "Si elegís 'No tengo garantía', no marques otra garantía."
      )

      setLoading(false)
      return
    }

    if (
      path ===
        "owner" &&
      acceptedIncomeProofTypes.length ===
        0
    ) {
      setError(
        "Elegí al menos una demostración de ingresos aceptada."
      )

      setLoading(false)
      return
    }

    if (
      path ===
        "owner" &&
      acceptedGuaranteeTypes.length ===
        0
    ) {
      setError(
        "Elegí al menos una garantía aceptada."
      )

      setLoading(false)
      return
    }

    if (
      path ===
        "owner" &&
      ownerFiles.length ===
        0
    ) {
      setError(
        "Subí al menos una foto o video de la propiedad."
      )

      setLoading(false)
      return
    }

    const ownerNeighborhood =
      String(
        formData.get(
          "owner_neighborhood"
        ) || ""
      ).trim()

    const renewalNeighborhood =
      String(
        formData.get(
          "renewal_neighborhood"
        ) || ""
      ).trim()

    const zone =
      path === "tenant"
        ? normalizedTenantNeighborhoods.text
        : path ===
            "owner"
          ? ownerNeighborhood
          : renewalNeighborhood

    const payload = {
      full_name:
        String(
          formData.get(
            "full_name"
          ) || ""
        ).trim(),

      email:
        String(
          formData.get(
            "email"
          ) || ""
        ).trim(),

      phone:
        String(
          formData.get(
            "phone"
          ) || ""
        ).trim(),

      role:
        path ===
        "renewal"
          ? String(
              formData.get(
                "renewal_role"
              ) ||
                "both"
            ).trim()
          : selected.role,

      intent:
        selected.intent,

      zone,

      property_type:
        String(
          formData.get(
            "property_type"
          ) || ""
        ).trim(),

      property_rooms:
        String(
          formData.get(
            "property_rooms"
          ) || ""
        ).trim(),

      availability_status:
        String(
          formData.get(
            "availability_status"
          ) || ""
        ).trim(),

      approx_price:
        String(
          formData.get(
            "approx_price"
          ) || ""
        ).trim(),

      approx_price_number:
        ownerPriceNumber,

      desired_property_type:
        String(
          formData.get(
            "desired_property_type"
          ) || ""
        ).trim(),

      desired_rooms:
        String(
          formData.get(
            "desired_rooms"
          ) || ""
        ).trim(),

      budget_range:
        String(
          formData.get(
            "budget_range"
          ) || ""
        ).trim(),

      budget_max:
        tenantBudgetMax,

      move_timing:
        String(
          formData.get(
            "move_timing"
          ) || ""
        ).trim(),

      income_proof_type:
        String(
          formData.get(
            "income_proof_type"
          ) || ""
        ).trim(),

      income_range:
        selectedIncomeRange,

      income_max:
        tenantIncomeMax,

      guarantee_types:
        tenantGuaranteeTypes,

      accepted_income_proof_types:
        acceptedIncomeProofTypes,

      min_income_ratio:
        formData.get(
          "min_income_ratio"
        )
          ? Number(
              formData.get(
                "min_income_ratio"
              )
            )
          : null,

      accepted_guarantee_types:
        acceptedGuaranteeTypes,

      renewal_role:
        String(
          formData.get(
            "renewal_role"
          ) || ""
        ).trim(),

      contract_expiration:
        String(
          formData.get(
            "contract_expiration"
          ) || ""
        ).trim(),

      other_party_status:
        String(
          formData.get(
            "other_party_status"
          ) || ""
        ).trim(),

      renewal_need:
        String(
          formData.get(
            "renewal_need"
          ) || ""
        ).trim(),

      event_id:
        eventId,

      event_source_url:
        window.location.href,

      fbp:
        getCookie(
          "_fbp"
        ),

      fbc:
        getMetaFbc(),

      source:
        "verlo_home",

      metadata: {
        path,

        page:
          "verlo_home",

        tenant_area:
          selectedArea,

        tenant_area_label:
          AREA_GROUPS[
            selectedArea
          ].label,

        tenant_neighborhoods:
          normalizedTenantNeighborhoods.labels,

        tenant_neighborhood_slugs:
          normalizedTenantNeighborhoods.slugs,

        tenant_other_neighborhood:
          tenantOtherNeighborhood,

        neighborhood:
          zone,

        neighborhood_slug:
          normalizeText(
            zone
          ),
      },
    }

    try {
      const res =
        await fetch(
          "/api/ghl-lead-webhook",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        )

      const data =
        await res
          .json()
          .catch(
            () =>
              null
          )

      if (
        !res.ok ||
        !data?.ok
      ) {
        throw new Error(
          data?.error ||
            "No pudimos guardar tus datos"
        )
      }

      if (
        path ===
        "owner"
      ) {
        const ownerLeadId =
          String(
            data?.lead_id ||
              ""
          ).trim()

        if (
          !ownerLeadId
        ) {
          throw new Error(
            "La propiedad se creó pero no recibimos el lead_id del propietario."
          )
        }

        const uploadedMedia:
          UploadedOwnerMedia[] =
          []

        for (
          let index = 0;
          index <
          ownerFiles.length;
          index++
        ) {
          const file =
            ownerFiles[index]

          setOwnerUploadProgress(
            `Subiendo ${index + 1} de ${ownerFiles.length}: ${file.name}`
          )

          const uploaded =
            await uploadOwnerFileToR2(
              file,
              ownerLeadId
            )

          uploadedMedia.push(
            uploaded
          )
        }

        setOwnerUploadProgress(
          "Guardando fotos y videos..."
        )

        const mediaResponse =
          await fetch(
            "/api/owner-initial-media",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  owner_lead_id:
                    ownerLeadId,

                  media:
                    uploadedMedia,
                }),
            }
          )

        const mediaData =
          await mediaResponse
            .json()
            .catch(
              () =>
                null
            )

        if (
          !mediaResponse.ok ||
          !mediaData?.ok
        ) {
          throw new Error(
            mediaData?.error ||
              "La propiedad se creó pero no pudimos registrar sus fotos y videos."
          )
        }

        setOwnerUploadProgress("")
      }

      trackMetaLead(
        eventId,
        {
          path,

          role:
            payload.role,

          intent:
            payload.intent,
        }
      )

      form.reset()

      if (
        path ===
        "owner"
      ) {
        setOwnerFiles([])
        setOwnerUploadProgress("")

        setSuccess(
          "Listo. Publicamos tu propiedad con sus fotos y videos. Te vamos a avisar por WhatsApp cuando encontremos personas compatibles."
        )
      } else {
        setSuccess(
          "Listo. Guardamos tus datos y te vamos a contactar por WhatsApp o e-mail."
        )
      }
    } catch (
      err
    ) {
      setOwnerUploadProgress("")

      if (
        err instanceof
        Error
      ) {
        setError(
          err.message
        )
      } else {
        setError(
          "No pudimos guardar tus datos"
        )
      }
    } finally {
      setLoading(
        false
      )
    }
  }

  return (
    <main className="test-root">
      <style>
        {styles}
      </style>

      <header className="nav">
        <div className="container nav-inner">
          <VerloBrand
            width={112}
          />

          <nav className="nav-links">
            <a
              href="#sumate"
              onClick={() =>
                choosePath(
                  "tenant"
                )
              }
            >
              Alquilar
            </a>

            <a
              href="#sumate"
              onClick={() =>
                choosePath(
                  "owner"
                )
              }
            >
              Publicar
            </a>

            <a
              href="#sumate"
              onClick={() =>
                choosePath(
                  "renewal"
                )
              }
            >
              Renovar
            </a>

            <a
              href="#sumate"
              className="nav-cta"
            >
              Sumate
            </a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>
              Alquilá directo.{" "}
              <em>
                Encontrá tu match.
              </em>
            </h1>

            <p className="hero-subtitle">
              Encontrá una propiedad o un inquilino compatible sin pagar una comisión inmobiliaria enorme.
            </p>

            <div
              style={{
                display:
                  "inline-block",

                margin:
                  "22px 0 30px",

                background:
                  "#f2a8a9",

                padding:
                  "7px",

                borderRadius:
                  "22px",

                boxShadow:
                  "0 12px 35px rgba(5,0,2,.12)",
              }}
            >
              <div
                style={{
                  minWidth:
                    "300px",

                  padding:
                    "14px 24px 16px",

                  border:
                    "2px dashed rgba(5,0,2,.35)",

                  borderRadius:
                    "16px",

                  textAlign:
                    "center",

                  color:
                    "#050002",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "11px",

                    fontWeight:
                      800,

                    letterSpacing:
                      ".16em",

                    marginBottom:
                      "6px",
                  }}
                >
                  LANZAMIENTO VERLO
                </div>

                <div
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    gap:
                      "16px",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "22px",

                      fontWeight:
                        700,

                      textDecoration:
                        "line-through",

                      textDecorationThickness:
                        "3px",

                      opacity:
                        0.5,
                    }}
                  >
                    $70.000
                  </span>

                  <span
                    style={{
                      fontSize:
                        "42px",

                      lineHeight:
                        1,

                      fontWeight:
                        900,

                      letterSpacing:
                        "-0.055em",
                    }}
                  >
                    GRATIS
                  </span>
                </div>

                <div
                  style={{
                    width:
                      "75%",

                    height:
                      "1px",

                    background:
                      "rgba(5,0,2,.25)",

                    margin:
                      "10px auto 8px",
                  }}
                />

                <div
                  style={{
                    fontSize:
                      "12px",

                    fontWeight:
                      800,

                    letterSpacing:
                      ".08em",
                  }}
                >
                  PRIMEROS 20 CONTRATOS
                </div>
              </div>
            </div>

            <div className="hero-actions">
              <a
                className="btn btn-primary"
                href="#sumate"
                onClick={() =>
                  choosePath(
                    "tenant"
                  )
                }
              >
                Busco alquilar
              </a>

              <a
                className="btn btn-secondary"
                href="#sumate"
                onClick={() =>
                  choosePath(
                    "owner"
                  )
                }
              >
                Tengo una propiedad
              </a>

              <a
                className="btn btn-secondary"
                href="#sumate"
                onClick={() =>
                  choosePath(
                    "renewal"
                  )
                }
              >
                Quiero renovar
              </a>
            </div>

            <div className="trust-row">
              <span className="pill">
                Sin comisión inmobiliaria
              </span>

              <span className="pill">
                Matching gratis
              </span>

              <span className="pill">
                Publicar gratis
              </span>
            </div>
          </div>

          <HeroPhone />
        </div>
      </section>

      <section
        className="section"
        id="caminos"
      >
        <div className="container">
          <div className="section-header">
            <p className="kicker">
              Elegí tu camino
            </p>

            <h2 className="section-title">
              Datos simples para{" "}
              <em>
                matchear mejor.
              </em>
            </h2>

            <p className="section-copy">
              Inquilinos dicen en qué barrios vivirían. Propietarios dicen en qué barrio tienen la propiedad. Con eso empezamos a ordenar la demanda real.
            </p>
          </div>

          <div className="mock-grid">
            <article
              className="mock-item"
              role="button"
              tabIndex={0}
              onClick={() => {
                choosePath(
                  "tenant"
                )

                document
                  .getElementById(
                    "sumate"
                  )
                  ?.scrollIntoView(
                    {
                      behavior:
                        "smooth",
                    }
                  )
              }}
              onKeyDown={(
                e
              ) => {
                if (
                  e.key ===
                    "Enter" ||
                  e.key ===
                    " "
                ) {
                  choosePath(
                    "tenant"
                  )

                  document
                    .getElementById(
                      "sumate"
                    )
                    ?.scrollIntoView(
                      {
                        behavior:
                          "smooth",
                      }
                    )
                }
              }}
            >
              <MiniPhone
                type="tenant"
              />

              <div className="mock-copy">
                <h3>
                  Buscá por barrios
                </h3>

                <p>
                  Marcá más de un barrio si te sirve. Así podemos matchearte con propiedades compatibles aunque no estén en tu primera opción.
                </p>

                <a
                  href="#sumate"
                  onClick={(
                    e
                  ) => {
                    e.stopPropagation()

                    choosePath(
                      "tenant"
                    )
                  }}
                >
                  Busco alquilar
                </a>
              </div>
            </article>

            <article
              className="mock-item"
              role="button"
              tabIndex={0}
              onClick={() => {
                choosePath(
                  "owner"
                )

                document
                  .getElementById(
                    "sumate"
                  )
                  ?.scrollIntoView(
                    {
                      behavior:
                        "smooth",
                    }
                  )
              }}
              onKeyDown={(
                e
              ) => {
                if (
                  e.key ===
                    "Enter" ||
                  e.key ===
                    " "
                ) {
                  choosePath(
                    "owner"
                  )

                  document
                    .getElementById(
                      "sumate"
                    )
                    ?.scrollIntoView(
                      {
                        behavior:
                          "smooth",
                      }
                    )
                }
              }}
            >
              <MiniPhone
                type="owner"
              />

              <div className="mock-copy">
                <h3>
                  Tenés una propiedad
                </h3>

                <p>
                  Dejanos barrio, tipo, precio y disponibilidad para cruzarla con inquilinos compatibles.
                </p>

                <a
                  href="#sumate"
                  onClick={(
                    e
                  ) => {
                    e.stopPropagation()

                    choosePath(
                      "owner"
                    )
                  }}
                >
                  Tengo una propiedad
                </a>
              </div>
            </article>

            <article
              className="mock-item"
              role="button"
              tabIndex={0}
              onClick={() => {
                choosePath(
                  "renewal"
                )

                document
                  .getElementById(
                    "sumate"
                  )
                  ?.scrollIntoView(
                    {
                      behavior:
                        "smooth",
                    }
                  )
              }}
              onKeyDown={(
                e
              ) => {
                if (
                  e.key ===
                    "Enter" ||
                  e.key ===
                    " "
                ) {
                  choosePath(
                    "renewal"
                  )

                  document
                    .getElementById(
                      "sumate"
                    )
                    ?.scrollIntoView(
                      {
                        behavior:
                          "smooth",
                      }
                    )
                }
              }}
            >
              <MiniPhone
                type="renewal"
              />

              <div className="mock-copy">
                <h3>
                  Renová sin comisión
                </h3>

                <p>
                  Ordená la renovación directo, rápido y sin costos inmobiliarios de renovación.
                </p>

                <a
                  href="#sumate"
                  onClick={(
                    e
                  ) => {
                    e.stopPropagation()

                    choosePath(
                      "renewal"
                    )
                  }}
                >
                  Quiero renovar
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        className="section"
        id="sumate"
      >
        <div className="container">
          <div className="form-card">
            <div className="section-header">
              <p className="kicker">
                Sumate a Verlo
              </p>

              <h2 className="section-title">
                Dejá tus datos y seguimos{" "}
                <em>
                  de inmediato.
                </em>
              </h2>

              <p className="section-copy">
                Todos los campos son necesarios para poder ordenar y matchear bien.
              </p>
            </div>

            <div className="path-grid">
              <button
                type="button"
                className={`path-card ${
                  path ===
                  "tenant"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  choosePath(
                    "tenant"
                  )
                }
              >
                <strong>
                  Busco alquilar
                </strong>

                <span>
                  Barrios, presupuesto y fecha de mudanza.
                </span>
              </button>

              <button
                type="button"
                className={`path-card ${
                  path ===
                  "owner"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  choosePath(
                    "owner"
                  )
                }
              >
                <strong>
                  Tengo una propiedad
                </strong>

                <span>
                  Barrio, tipo, precio y disponibilidad.
                </span>
              </button>

              <button
                type="button"
                className={`path-card ${
                  path ===
                  "renewal"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  choosePath(
                    "renewal"
                  )
                }
              >
                <strong>
                  Quiero renovar
                </strong>

                <span>
                  Barrio, contrato, partes y vencimiento.
                </span>
              </button>
            </div>

            <div className="form-head">
              <h3>
                {
                  selected.title
                }
              </h3>

              <p>
                {
                  selected.subtitle
                }
              </p>
            </div>

            <form
              className="form"
              onSubmit={
                handleSubmit
              }
            >
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="honeypot"
                aria-hidden="true"
              />

              <div className="row">
                <input
                  className="input"
                  name="full_name"
                  placeholder="Nombre y apellido"
                  required
                />

                <input
                  className="input"
                  name="phone"
                  placeholder="WhatsApp con característica. Ej: 11 3361 4865"
                  inputMode="tel"
                  required
                />
              </div>

              <input
                className="input"
                name="email"
                type="email"
                placeholder="Email"
                required
              />

              {path ===
                "tenant" && (
                <>
                  <div className="neighborhood-box">
                    <strong>
                      ¿Dónde buscarías alquilar?
                    </strong>

                    <div className="area-tabs">
                      {(
                        Object.keys(
                          AREA_GROUPS
                        ) as AreaKey[]
                      ).map(
                        (
                          areaKey
                        ) => (
                          <button
                            key={
                              areaKey
                            }
                            type="button"
                            className={`area-tab ${
                              selectedArea ===
                              areaKey
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedArea(
                                areaKey
                              )
                            }
                          >
                            {
                              AREA_GROUPS[
                                areaKey
                              ].label
                            }
                          </button>
                        )
                      )}
                    </div>

                    <div className="neighborhood-grid">
                      {AREA_GROUPS[
                        selectedArea
                      ].neighborhoods.map(
                        (
                          neighborhood
                        ) => (
                          <label
                            className="check-pill"
                            key={
                              neighborhood
                            }
                          >
                            <input
                              type="checkbox"
                              name="tenant_neighborhoods"
                              value={
                                neighborhood
                              }
                            />

                            {
                              neighborhood
                            }
                          </label>
                        )
                      )}
                    </div>

                    <input
                      className="input other-neighborhood"
                      name="tenant_other_neighborhood"
                      placeholder="Otro barrio o localidad"
                    />
                  </div>

                  <div className="row">
                    <select
                      className="select"
                      name="desired_property_type"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Tipo de propiedad
                      </option>

                      <option>
                        Departamento
                      </option>

                      <option>
                        Casa
                      </option>

                      <option>
                        PH
                      </option>

                      <option>
                        Habitación
                      </option>

                      <option>
                        Otro
                      </option>
                    </select>

                    <select
                      className="select"
                      name="desired_rooms"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Ambientes que buscás
                      </option>

                      <option>
                        Monoambiente
                      </option>

                      <option>
                        2 ambientes
                      </option>

                      <option>
                        3 ambientes
                      </option>

                      <option>
                        4 ambientes
                      </option>

                      <option>
                        5 o más ambientes
                      </option>
                    </select>
                  </div>

                  <div className="row">
                    <select
                      className="select"
                      name="budget_range"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Presupuesto mensual máximo
                      </option>

                      {TENANT_BUDGET_RANGES.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </option>
                        )
                      )}
                    </select>

                    <select
                      className="select"
                      name="move_timing"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Cuándo querés mudarte
                      </option>

                      <option value="Ahora">
                        Ahora
                      </option>

                      <option value="En 1 a 3 meses">
                        En 1 a 3 meses
                      </option>

                      <option value="En 6 meses o más">
                        En 6 meses o más
                      </option>
                    </select>
                  </div>

                  <div className="row">
                    <select
                      className="select"
                      name="income_proof_type"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Cómo demostrás tus ingresos
                      </option>

                      <option value="salary_receipt">
                        Recibo de sueldo
                      </option>

                      <option value="monotributo">
                        Monotributista
                      </option>

                      <option value="self_employed">
                        Autónomo / socio / director de empresa
                      </option>

                      <option value="other_formal">
                        Otra demostración formal de ingresos
                      </option>

                      <option value="none">
                        No tengo demostración formal de ingresos
                      </option>
                    </select>

                    <select
                      className="select"
                      name="income_range"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Ingreso mensual demostrable
                      </option>

                      {INCOME_RANGES.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="neighborhood-box">
                    <strong>
                      ¿Qué garantía podrías presentar?
                    </strong>

                    <div className="neighborhood-grid">
                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="guarantee_types"
                          value="property_guarantee"
                        />

                        Garantía propietaria
                      </label>

                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="guarantee_types"
                          value="surety_insurance"
                        />

                        Seguro de caución
                      </label>

                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="guarantee_types"
                          value="salary_guarantors"
                        />

                        Garantes con recibo de sueldo
                      </label>

                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="guarantee_types"
                          value="other"
                        />

                        Otra garantía
                      </label>

                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="guarantee_types"
                          value="none"
                        />

                        No tengo garantía
                      </label>
                    </div>
                  </div>
                </>
              )}

              {path ===
                "owner" && (
                <>
                  <div className="row">
                    <select
                      className="select"
                      name="owner_neighborhood"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Barrio donde está la propiedad
                      </option>

                      {ALL_NEIGHBORHOODS.map(
                        (
                          neighborhood
                        ) => (
                          <option
                            key={
                              neighborhood
                            }
                          >
                            {
                              neighborhood
                            }
                          </option>
                        )
                      )}

                      <option>
                        Otro
                      </option>
                    </select>

                    <select
                      className="select"
                      name="property_type"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Tipo de propiedad
                      </option>

                      <option>
                        Departamento
                      </option>

                      <option>
                        Casa
                      </option>

                      <option>
                        PH
                      </option>

                      <option>
                        Local
                      </option>

                      <option>
                        Oficina
                      </option>

                      <option>
                        Otro
                      </option>
                    </select>
                  </div>

                  <div className="row">
                    <select
                      className="select"
                      name="property_rooms"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Ambientes de la propiedad
                      </option>

                      <option>
                        Monoambiente
                      </option>

                      <option>
                        2 ambientes
                      </option>

                      <option>
                        3 ambientes
                      </option>

                      <option>
                        4 ambientes
                      </option>

                      <option>
                        5 o más ambientes
                      </option>
                    </select>

                    <select
                      className="select"
                      name="approx_price"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Precio mensual esperado
                      </option>

                      {OWNER_PRICE_RANGES.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <select
                    className="select"
                    name="availability_status"
                    required
                    defaultValue=""
                  >
                    <option
                      value=""
                      disabled
                    >
                      Cuándo estará disponible
                    </option>

                    <option value="Ahora">
                      Ahora
                    </option>

                    <option value="En 1 a 3 meses">
                      En 1 a 3 meses
                    </option>

                    <option value="En 6 meses o más">
                      En 6 meses o más
                    </option>
                  </select>

                  <div className="neighborhood-box">
                    <strong>
                      ¿Qué demostraciones de ingresos aceptarías?
                    </strong>

                    <div className="neighborhood-grid">
                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="accepted_income_proof_types"
                          value="salary_receipt"
                        />

                        Recibo de sueldo
                      </label>

                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="accepted_income_proof_types"
                          value="monotributo"
                        />

                        Monotributista
                      </label>

                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="accepted_income_proof_types"
                          value="self_employed"
                        />

                        Autónomo / socio / director de empresa
                      </label>

                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="accepted_income_proof_types"
                          value="other_formal"
                        />

                        Otra demostración formal
                      </label>

                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="accepted_income_proof_types"
                          value="any"
                        />

                        Cualquiera de las anteriores
                      </label>
                    </div>
                  </div>

                  <select
                    className="select"
                    name="min_income_ratio"
                    required
                    defaultValue=""
                  >
                    <option
                      value=""
                      disabled
                    >
                      Ingreso mínimo en relación al alquiler
                    </option>

                    <option value="2">
                      2 veces el alquiler
                    </option>

                    <option value="2.5">
                      2,5 veces el alquiler
                    </option>

                    <option value="3">
                      3 veces el alquiler
                    </option>

                    <option value="4">
                      4 veces el alquiler
                    </option>
                  </select>

                  <div className="neighborhood-box">
                    <strong>
                      ¿Qué garantías aceptarías?
                    </strong>

                    <div className="neighborhood-grid">
                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="accepted_guarantee_types"
                          value="property_guarantee"
                        />

                        Garantía propietaria
                      </label>

                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="accepted_guarantee_types"
                          value="surety_insurance"
                        />

                        Seguro de caución
                      </label>

                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="accepted_guarantee_types"
                          value="salary_guarantors"
                        />

                        Garantes con recibo de sueldo
                      </label>

                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="accepted_guarantee_types"
                          value="other"
                        />

                        Otra garantía
                      </label>

                      <label className="check-pill">
                        <input
                          type="checkbox"
                          name="accepted_guarantee_types"
                          value="any"
                        />

                        Cualquiera de las anteriores
                      </label>
                    </div>
                  </div>

                  <div className="owner-media-box">
                    <div className="owner-media-head">
                      <strong>
                        Fotos y videos de la propiedad
                      </strong>

                      <span>
                        Subí todas las fotos o videos que quieras.
                      </span>
                    </div>

                    <label className="owner-media-picker">
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={
                          handleOwnerFiles
                        }
                      />

                      <span className="owner-media-plus">
                        +
                      </span>

                      <span className="owner-media-copy">
                        <b>
                          Elegir fotos o videos
                        </b>

                        <small>
                          Desde tu computadora o teléfono
                        </small>
                      </span>
                    </label>

                    {ownerFiles.length >
                      0 && (
                      <div className="owner-media-selected">
                        <strong>
                          {ownerFiles.length}{" "}
                          {ownerFiles.length ===
                          1
                            ? "archivo seleccionado"
                            : "archivos seleccionados"}
                        </strong>

                        <div className="owner-media-list">
                          {ownerFiles.map(
                            (
                              file,
                              index
                            ) => (
                              <div
                                key={`${file.name}-${file.size}-${index}`}
                                className="owner-media-file"
                              >
                                <span>
                                  {file.type.startsWith(
                                    "video/"
                                  )
                                    ? "VIDEO"
                                    : "FOTO"}
                                </span>

                                <span>
                                  {
                                    file.name
                                  }
                                </span>

                                <small>
                                  {(
                                    file.size /
                                    1024 /
                                    1024
                                  ).toFixed(
                                    1
                                  )}{" "}
                                  MB
                                </small>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {ownerUploadProgress && (
                      <div className="owner-media-progress">
                        {
                          ownerUploadProgress
                        }
                      </div>
                    )}
                  </div>
                </>
              )}

              {path ===
                "renewal" && (
                <>
                  <div className="row">
                    <select
                      className="select"
                      name="renewal_role"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        En la renovación soy...
                      </option>

                      <option value="owner">
                        Propietario
                      </option>

                      <option value="tenant">
                        Inquilino
                      </option>
                    </select>

                    <select
                      className="select"
                      name="renewal_neighborhood"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Barrio de la propiedad
                      </option>

                      {ALL_NEIGHBORHOODS.map(
                        (
                          neighborhood
                        ) => (
                          <option
                            key={
                              neighborhood
                            }
                          >
                            {
                              neighborhood
                            }
                          </option>
                        )
                      )}

                      <option>
                        Otro
                      </option>
                    </select>
                  </div>

                  <div className="row">
                    <input
                      className="input"
                      name="contract_expiration"
                      type="date"
                      required
                    />

                    <select
                      className="select"
                      name="other_party_status"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        ¿Lo sabe ya tu contraparte?
                      </option>

                      <option>
                        Sí, ya lo hablamos
                      </option>

                      <option>
                        Todavía no
                      </option>

                      <option>
                        No estoy seguro
                      </option>
                    </select>
                  </div>

                  <select
                    className="select"
                    name="renewal_need"
                    required
                    defaultValue=""
                  >
                    <option
                      value=""
                      disabled
                    >
                      ¿Qué querés lograr con esta renovación?
                    </option>

                    <option>
                      Renovar con condiciones parecidas
                    </option>

                    <option>
                      Actualizar precio y renovar
                    </option>

                    <option>
                      Cambiar plazo del contrato
                    </option>

                    <option>
                      Todavía no lo sé, quiero que me guíen
                    </option>
                  </select>
                </>
              )}

              {error && (
                <p className="error">
                  {error}
                </p>
              )}

              {success && (
                <p className="success">
                  {success}
                </p>
              )}

              <button
                className="submit"
                type="submit"
                disabled={
                  loading
                }
              >
                {
                  submitLabel
                }
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <VerloBrand
              width={86}
            />

            <p>
              Alquiler directo, seguro y sin comisión.
            </p>
          </div>

          <nav className="footer-links">
            <a href="/terminos">
              Términos y condiciones
            </a>

            <a href="/privacidad">
              Política de privacidad
            </a>

            <a
              href={
                CONTACT_HREF
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Contacto
            </a>
          </nav>
        </div>
      </footer>
    </main>
  )
}
