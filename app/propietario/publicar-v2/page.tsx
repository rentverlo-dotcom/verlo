"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import VerloBrand from "@/components/VerloBrand"

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
  }
}

function trackMetaEvent(eventName: string, params?: Record<string, string>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("trackCustom", eventName, params)
  }
}

function mapFileToMediaType(file: File): "photo" | "video" | "pdf" {
  if (file.type.startsWith("image/")) return "photo"
  if (file.type.startsWith("video/")) return "video"
  if (file.type === "application/pdf") return "pdf"
  throw new Error("Tipo de archivo no soportado")
}

type Draft = {
  province_id?: string
  municipality_id?: string
  neighborhood_id?: string
  price?: number
  type?: string
  requirements?: string[]
  duration?: string[]
  furnished?: boolean
  pets?: boolean
  media?: File[]
  address?: string
  phone?: string
  first_name?: string
  last_name?: string
  email?: string
  description?: string
  sqm?: number
  rooms?: number
}

const ARG_PROVINCES = [
  { id: "02", name: "Ciudad Autónoma de Buenos Aires" },
  { id: "06", name: "Buenos Aires" },
  { id: "10", name: "Catamarca" },
  { id: "22", name: "Chaco" },
  { id: "26", name: "Chubut" },
  { id: "14", name: "Córdoba" },
  { id: "18", name: "Corrientes" },
  { id: "30", name: "Entre Ríos" },
  { id: "34", name: "Formosa" },
  { id: "38", name: "Jujuy" },
  { id: "42", name: "La Pampa" },
  { id: "46", name: "La Rioja" },
  { id: "50", name: "Mendoza" },
  { id: "54", name: "Misiones" },
  { id: "58", name: "Neuquén" },
  { id: "62", name: "Río Negro" },
  { id: "66", name: "Salta" },
  { id: "70", name: "San Juan" },
  { id: "74", name: "San Luis" },
  { id: "78", name: "Santa Cruz" },
  { id: "82", name: "Santa Fe" },
  { id: "86", name: "Santiago del Estero" },
  { id: "90", name: "Tucumán" },
  { id: "94", name: "Tierra del Fuego" },
]

const CABA_MUNICIPALITY = {
  id: "caba",
  name: "Ciudad Autónoma de Buenos Aires",
}

const CABA_BARRIOS = [
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
  "La Paternal",
  "Liniers",
  "Mataderos",
  "Monte Castro",
  "Monserrat",
  "Nueva Pompeya",
  "Nuñez",
  "Palermo",
  "Parque Avellaneda",
  "Parque Chacabuco",
  "Parque Chas",
  "Parque Patricios",
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
  "Villa del Parque",
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
].map((b) => ({ id: b, name: b }))

const steps = [
  {
    number: 1,
    label: "Ubicación",
    title: "¿Dónde está la propiedad?",
    copy: "Ubicamos tu propiedad para mostrarla a inquilinos compatibles.",
  },
  {
    number: 2,
    label: "Características",
    title: "Contanos cómo es",
    copy: "Sumá los datos básicos para que el match sea más preciso.",
  },
  {
    number: 3,
    label: "Fotos",
    title: "Mostrala bien",
    copy: "Las fotos ayudan a que los inquilinos entiendan rápido si les interesa.",
  },
  {
    number: 4,
    label: "Contacto",
    title: "Datos privados",
    copy: "Esta información no se muestra públicamente. Solo se usa para gestionar el proceso.",
  },
]

const TOTAL_STEPS = steps.length

function normalizeStep(value: unknown) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return 1
  if (parsed < 1) return 1
  if (parsed > TOTAL_STEPS) return TOTAL_STEPS

  return parsed
}

function loadDraftFromStorage(): Draft {
  if (typeof window === "undefined") return {}

  try {
    const parsed = JSON.parse(localStorage.getItem("property_draft") || "{}")

    // Los File no se pueden restaurar desde localStorage.
    // Si había basura vieja de media serializada como {}, la limpiamos.
    delete parsed.media

    return parsed
  } catch {
    return {}
  }
}

export default function PublicarPropiedad() {
  const [step, setStep] = useState<number>(() => {
    if (typeof window === "undefined") return 1

    const savedStep = localStorage.getItem("property_step")
    const normalizedStep = normalizeStep(savedStep)

    if (savedStep && Number(savedStep) !== normalizedStep) {
      localStorage.setItem("property_step", String(normalizedStep))
    }

    return normalizedStep
  })

  const [draft, setDraft] = useState<Draft>(() => loadDraftFromStorage())

  const [provinces, setProvinces] = useState<any[]>([])
  const [municipalities, setMunicipalities] = useState<any[]>([])
  const [neighborhoods, setNeighborhoods] = useState<any[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentStep = steps.find((s) => s.number === step) ?? steps[0]
  const progress = (step / TOTAL_STEPS) * 100

  useEffect(() => {
    const draftToStore = { ...draft }
    delete draftToStore.media

    localStorage.setItem("property_draft", JSON.stringify(draftToStore))
  }, [draft])

  useEffect(() => {
    const normalizedStep = normalizeStep(step)

    if (normalizedStep !== step) {
      setStep(normalizedStep)
      return
    }

    localStorage.setItem("property_step", String(normalizedStep))
  }, [step])

  useEffect(() => {
    setProvinces(ARG_PROVINCES)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = "/login?next=/propietario/publicar-v2"
      }
    })
  }, [])

  useEffect(() => {
    if (!draft.province_id) {
      setMunicipalities([])
      setNeighborhoods([])
      return
    }

    if (draft.province_id === "02") {
      setMunicipalities([CABA_MUNICIPALITY])
      setNeighborhoods(CABA_BARRIOS)

      setDraft((prev) => ({
        ...prev,
        municipality_id: prev.municipality_id || CABA_MUNICIPALITY.id,
        neighborhood_id: prev.neighborhood_id,
      }))

      return
    }

    const province = ARG_PROVINCES.find(
      (p) => String(p.id) === String(draft.province_id)
    )

    if (!province?.name) return

    fetch(
      `https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(
        province.name
      )}&max=1000`
    )
      .then((r) => r.json())
      .then((d) => {
        setMunicipalities(
          (d.municipios || []).map((m: any) => ({
            id: m.id,
            name: m.nombre,
          }))
        )
        setNeighborhoods([])
      })
      .catch(() => {})
  }, [draft.province_id])

  useEffect(() => {
    if (!draft.municipality_id) {
      setNeighborhoods([])
      return
    }

    if (draft.municipality_id === CABA_MUNICIPALITY.id) return

    fetch(
      `https://apis.datos.gob.ar/georef/api/localidades?municipio=${encodeURIComponent(
        draft.municipality_id
      )}&max=1000`
    )
      .then((r) => r.json())
      .then((d) => {
        setNeighborhoods(
          (d.localidades || []).map((n: any) => ({
            id: n.id,
            name: n.nombre,
          }))
        )
      })
      .catch(() => {})
  }, [draft.municipality_id])

  function validateStep() {
    setErrorMessage(null)

    if (step === 1) {
      if (!draft.province_id || !draft.municipality_id || !draft.price) {
        setErrorMessage("Completá ubicación y precio para continuar.")
        return false
      }
    }

  if (step === 2) {
  if (!draft.type || !draft.rooms || !draft.description) {
    setErrorMessage("Completá tipo, ambientes y descripción.")
    return false
  }
}

    if (step === 4) {
      if (!draft.address || !draft.phone) {
        setErrorMessage("Completá dirección y teléfono para publicar.")
        return false
      }
    }

    return true
  }

  function next() {
    if (!validateStep()) return
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function back() {
    setErrorMessage(null)
    setStep((s) => Math.max(s - 1, 1))
  }

  async function publish() {
    if (!validateStep()) return

    setIsPublishing(true)
    setErrorMessage(null)

    try {
      const { data: auth } = await supabase.auth.getUser()

      if (!auth.user) {
        window.location.href = "/login?next=/propietario/publicar-v2"
        return
      }

      const municipalityName =
        municipalities.find((m) => m.id === draft.municipality_id)?.name ?? null

      const neighborhoodName =
        neighborhoods.find((n) => n.id === draft.neighborhood_id)?.name ?? null

      const propertyTypeMap = {
        apartment: "apartment",
        house: "house",
        room: "room",
        hotel_room: "hotel_room",
        local: "apartment",
        ph: "apartment",
      } as const

      const safePropertyType =
        propertyTypeMap[draft.type as keyof typeof propertyTypeMap]

      if (!safePropertyType) {
        setErrorMessage("Tipo de propiedad inválido.")
        setIsPublishing(false)
        return
      }

      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .insert({
          owner_id: auth.user.id,
          city: municipalityName,
          zone: neighborhoodName,
          price: draft.price ?? null,
          property_type: safePropertyType,
          short_description: draft.description ?? null,
          description: draft.description ?? null,
          sqm: draft.sqm ?? null,
          furnished: draft.furnished ?? false,
          pets_allowed: draft.pets ?? false,
          publish_status: "draft",
          currency: "ARS",
          available: true,
        })
        .select()
        .single()

      if (propertyError || !property) {
        console.error(propertyError)
        setErrorMessage("No pudimos guardar la propiedad. Probá de nuevo.")
        setIsPublishing(false)
        return
      }

      const validMedia = (draft.media || []).filter(
        (file): file is File =>
          typeof File !== "undefined" &&
          file instanceof File &&
          typeof file.name === "string"
      )

      if (validMedia.length) {
        for (let i = 0; i < validMedia.length; i++) {
          const file = validMedia[i]
          const extension = file.name.split(".").pop() || "jpg"
          const path = `${property.id}/${crypto.randomUUID()}.${extension}`

          const { error: uploadError } = await supabase.storage
            .from("media")
            .upload(path, file, {
              cacheControl: "3600",
              upsert: false,
            })

          if (uploadError) {
            console.error(uploadError)
            continue
          }

          const { error: mediaError } = await supabase
            .from("property_media")
            .insert({
              property_id: property.id,
              type: mapFileToMediaType(file),
              url: path,
              position: i,
            })

          if (mediaError) console.error(mediaError)
        }
      }

      const { error: privateError } = await supabase
        .from("property_private")
        .insert({
          property_id: property.id,
          address: draft.address ?? null,
          phone: draft.phone ?? null,
          first_name: draft.first_name ?? null,
          last_name: draft.last_name ?? null,
          email: draft.email ?? null,
        })

      if (privateError) {
        console.error(privateError)
        setErrorMessage("Guardamos la propiedad, pero fallaron los datos privados.")
        setIsPublishing(false)
        return
      }

      localStorage.removeItem("property_draft")
      localStorage.removeItem("property_step")

      trackMetaEvent("Lead_Propietario_FormularioEnviado", {
        property_id: String(property.id),
        journey: "propietario",
        destination: `/propietario/preview/${property.id}`,
      })

      window.location.href = `/propietario/preview/${property.id}`
    } catch (err) {
      console.error(err)
      setErrorMessage("Ocurrió un error inesperado. Probá de nuevo.")
      setIsPublishing(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f2ebec] text-[#050002]">
      <style jsx global>{`
        :root {
          --pink: #f2a8a9;
          --pink-dark: #c37986;
          --black: #050002;
          --soft: #f2ebec;
          --cream: #efefea;
          --blue: #74bedc;
          --yellow: #e7c776;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: var(--soft);
        }

        .owner-page {
          min-height: 100vh;
          padding: 34px 0 70px;
          background:
            radial-gradient(circle at 12% 18%, rgba(242, 168, 169, 0.62), transparent 28%),
            radial-gradient(circle at 88% 22%, rgba(231, 199, 118, 0.38), transparent 24%),
            radial-gradient(circle at 78% 84%, rgba(116, 190, 220, 0.28), transparent 26%),
            var(--soft);
        }

        .container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        .brand-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 44px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: var(--black);
          text-decoration: none;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .mark {
          width: 34px;
          height: 28px;
          position: relative;
          display: inline-block;
        }

        .mark::before,
        .mark::after {
          content: "";
          position: absolute;
          top: 0;
          width: 21px;
          height: 28px;
          border: 6px solid var(--black);
          border-radius: 999px;
        }

        .mark::before {
          left: 0;
        }

        .mark::after {
          right: 0;
        }

        .mark span {
          position: absolute;
          left: 50%;
          top: 4px;
          transform: translateX(-50%);
          width: 10px;
          height: 20px;
          border-radius: 999px;
          background: var(--pink);
          z-index: 2;
        }

        .back-link {
          color: rgba(5, 0, 2, 0.62);
          text-decoration: none;
          font-size: 14px;
          font-weight: 850;
        }

        .layout {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 34px;
          align-items: start;
        }

        .intro {
          position: sticky;
          top: 28px;
          padding: 42px;
          border-radius: 42px;
          background: rgba(255, 255, 255, 0.48);
          border: 1px solid rgba(5, 0, 2, 0.08);
          overflow: hidden;
        }

        .intro::after {
          content: "";
          position: absolute;
          right: -90px;
          bottom: -90px;
          width: 250px;
          height: 250px;
          border-radius: 999px;
          background: rgba(242, 168, 169, 0.45);
          z-index: 0;
        }

        .intro > * {
          position: relative;
          z-index: 1;
        }

        .eyebrow {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 13px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.62);
          border: 1px solid rgba(5, 0, 2, 0.08);
          color: rgba(5, 0, 2, 0.66);
          font-size: 13px;
          font-weight: 900;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--pink-dark);
          box-shadow: 0 0 0 5px rgba(195, 121, 134, 0.16);
        }

        .intro h1 {
          margin: 26px 0 0;
          font-size: clamp(52px, 6vw, 88px);
          line-height: 0.88;
          letter-spacing: -0.085em;
          font-weight: 950;
        }

        .intro h1 em {
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
          font-style: italic;
        }

        .intro-copy {
          margin: 24px 0 0;
          font-size: 19px;
          line-height: 1.48;
          color: rgba(5, 0, 2, 0.68);
        }

        .mini-list {
          display: grid;
          gap: 12px;
          margin: 30px 0 0;
          padding: 0;
          list-style: none;
        }

        .mini-list li {
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: 15px;
          font-weight: 850;
          color: rgba(5, 0, 2, 0.72);
        }

        .check {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: var(--black);
          color: white;
          display: grid;
          place-items: center;
          font-size: 13px;
          flex: 0 0 auto;
        }

        .form-card {
          border-radius: 42px;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(5, 0, 2, 0.08);
          box-shadow: 0 26px 80px rgba(5, 0, 2, 0.08);
          overflow: hidden;
        }

        .form-head {
          padding: 34px 34px 24px;
          border-bottom: 1px solid rgba(5, 0, 2, 0.08);
        }

        .step-meta {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          margin-bottom: 18px;
        }

        .step-pill {
          padding: 8px 12px;
          border-radius: 999px;
          background: var(--black);
          color: white;
          font-size: 12px;
          font-weight: 950;
        }

        .step-name {
          color: rgba(5, 0, 2, 0.55);
          font-size: 13px;
          font-weight: 900;
        }

        .progress {
          height: 9px;
          border-radius: 999px;
          background: rgba(5, 0, 2, 0.08);
          overflow: hidden;
        }

        .progress span {
          display: block;
          height: 100%;
          width: var(--progress);
          background: linear-gradient(90deg, var(--pink), var(--pink-dark));
          border-radius: inherit;
          transition: width 220ms ease;
        }

        .form-head h2 {
          margin: 24px 0 0;
          font-size: clamp(32px, 4vw, 52px);
          line-height: 0.98;
          letter-spacing: -0.065em;
          font-weight: 950;
        }

        .form-head p {
          margin: 12px 0 0;
          color: rgba(5, 0, 2, 0.62);
          line-height: 1.45;
          font-size: 16px;
        }

        .form-body {
          padding: 34px;
        }

        .field-grid {
          display: grid;
          gap: 16px;
        }

        .two-cols {
          grid-template-columns: repeat(2, 1fr);
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .field label {
          font-size: 13px;
          font-weight: 950;
          color: rgba(5, 0, 2, 0.72);
          padding-left: 4px;
        }

        .input,
        .select,
        .textarea {
          width: 100%;
          min-height: 58px;
          border: 1px solid rgba(5, 0, 2, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.86);
          padding: 0 18px;
          color: var(--black);
          font-size: 16px;
          outline: none;
          transition: border 140ms ease, box-shadow 140ms ease, background 140ms ease;
        }

        .textarea {
          min-height: 150px;
          resize: none;
          padding-top: 18px;
          line-height: 1.45;
        }

        .input:focus,
        .select:focus,
        .textarea:focus {
          border-color: var(--pink-dark);
          box-shadow: 0 0 0 5px rgba(195, 121, 134, 0.12);
          background: white;
        }

        .select:disabled {
          opacity: 0.46;
          cursor: not-allowed;
        }

        .toggle-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 16px;
        }

        .toggle {
          border: 1px solid rgba(5, 0, 2, 0.1);
          border-radius: 22px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.62);
          cursor: pointer;
          font-weight: 900;
          color: rgba(5, 0, 2, 0.64);
          transition: 150ms ease;
        }

        .toggle.active {
          background: var(--black);
          color: white;
          border-color: var(--black);
        }

        .upload-box {
          border: 1.5px dashed rgba(5, 0, 2, 0.22);
          background: rgba(255, 255, 255, 0.56);
          border-radius: 30px;
          padding: 34px;
          text-align: center;
        }

        .upload-box h3 {
          margin: 0;
          font-size: 26px;
          letter-spacing: -0.045em;
        }

        .upload-box p {
          margin: 10px auto 0;
          color: rgba(5, 0, 2, 0.6);
          max-width: 460px;
          line-height: 1.45;
        }

        .file-input {
          display: none;
        }

        .file-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 22px;
          min-height: 52px;
          padding: 0 22px;
          border-radius: 999px;
          background: var(--black);
          color: white;
          font-weight: 950;
          cursor: pointer;
        }

        .media-list {
          display: grid;
          gap: 10px;
          margin-top: 18px;
        }

        .media-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(5, 0, 2, 0.08);
          color: rgba(5, 0, 2, 0.7);
          font-size: 14px;
          font-weight: 750;
        }

        .remove-file {
          border: none;
          background: rgba(5, 0, 2, 0.08);
          color: var(--black);
          border-radius: 999px;
          padding: 8px 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .error {
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(195, 121, 134, 0.14);
          color: #7f2435;
          font-weight: 850;
          font-size: 14px;
        }

        .actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-top: 28px;
        }

        .btn {
          min-height: 54px;
          border: 1px solid rgba(5, 0, 2, 0.12);
          border-radius: 999px;
          padding: 0 24px;
          font-size: 15px;
          font-weight: 950;
          cursor: pointer;
          transition: transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .btn-primary {
          background: var(--black);
          color: white;
          box-shadow: 0 16px 34px rgba(5, 0, 2, 0.15);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.72);
          color: var(--black);
        }

        .summary {
          margin-top: 20px;
          padding: 18px;
          border-radius: 24px;
          background: rgba(5, 0, 2, 0.04);
          display: grid;
          gap: 8px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          font-size: 14px;
          color: rgba(5, 0, 2, 0.62);
        }

        .summary-row strong {
          color: var(--black);
          text-align: right;
        }

        @media (max-width: 980px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .intro {
            position: relative;
            top: auto;
          }
        }

        @media (max-width: 640px) {
          .container {
            width: min(100% - 28px, 1180px);
          }

          .brand-row {
            margin-bottom: 28px;
          }

          .intro,
          .form-head,
          .form-body {
            padding: 24px;
          }

          .intro,
          .form-card {
            border-radius: 30px;
          }

          .two-cols,
          .toggle-row {
            grid-template-columns: 1fr;
          }

          .actions {
            flex-direction: column-reverse;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>

      <section className="owner-page">
        <div className="container">
          <div className="brand-row">
            <VerloBrand width={104} />

            <a href="/" className="back-link">
              Volver al inicio
            </a>
          </div>

          <div className="layout">
            <aside className="intro">
              <div className="eyebrow">
                <span className="dot" />
                Propietarios
              </div>

              <h1>
                Publicá tu propiedad en <em>Verlo.</em>
              </h1>

              <p className="intro-copy">
                Cargá la información clave y dejá tu propiedad lista para recibir
                inquilinos compatibles. Primero queda en borrador; después la
                revisás y publicás.
              </p>

              <ul className="mini-list">
                <li>
                  <span className="check">✓</span>
                  Sin inmobiliarias ni intermediarios innecesarios
                </li>
                <li>
                  <span className="check">✓</span>
                  Datos privados protegidos
                </li>
                <li>
                  <span className="check">✓</span>
                  Match con inquilinos compatibles
                </li>
              </ul>
            </aside>

            <section className="form-card">
              <div className="form-head">
                <div className="step-meta">
                  <span className="step-pill">
                    Paso {step} de {TOTAL_STEPS}
                  </span>
                  <span className="step-name">{currentStep.label}</span>
                </div>

                <div
                  className="progress"
                  style={{ ["--progress" as any]: `${progress}%` }}
                >
                  <span />
                </div>

                <h2>{currentStep.title}</h2>
                <p>{currentStep.copy}</p>
              </div>

              <div className="form-body">
                {step === 1 && (
                  <>
                    <div className="field-grid">
                      <div className="field">
                        <label>Provincia</label>
                        <select
                          className="select"
                          value={draft.province_id || ""}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              province_id: e.target.value,
                              municipality_id: undefined,
                              neighborhood_id: undefined,
                            }))
                          }
                        >
                          <option value="">Elegí una provincia</option>
                          {provinces.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label>Municipio</label>
                        <select
                          className="select"
                          value={draft.municipality_id || ""}
                          disabled={!draft.province_id}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              municipality_id: e.target.value,
                              neighborhood_id: undefined,
                            }))
                          }
                        >
                          <option value="">Elegí un municipio</option>
                          {municipalities.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label>Barrio / localidad</label>
                        <select
                          className="select"
                          value={draft.neighborhood_id || ""}
                          disabled={!draft.municipality_id}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              neighborhood_id: e.target.value,
                            }))
                          }
                        >
                          <option value="">Elegí un barrio o localidad</option>
                          {neighborhoods.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label>Precio mensual</label>
                        <input
                          className="input"
                          type="number"
                          placeholder="Ej: 450000"
                          value={draft.price || ""}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              price: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>

                    {errorMessage && <div className="error">{errorMessage}</div>}

                    <div className="actions">
                      <span />
                      <button className="btn btn-primary" onClick={next}>
                        Continuar
                      </button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="field-grid">
                      <div className="field">
                        <label>Tipo de propiedad</label>
                        <select
                          className="select"
                          value={draft.type || ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, type: e.target.value }))
                          }
                        >
                          <option value="">Elegí el tipo</option>
                          <option value="apartment">Departamento</option>
                          <option value="house">Casa</option>
                          <option value="ph">PH</option>
                          <option value="room">Habitación</option>
                          <option value="local">Local</option>
                        </select>
                      </div>

                      <div className="field">
                        <label>Metros cuadrados</label>
                        <input
                          className="input"
                          type="number"
                          placeholder="Ej: 65"
                          value={draft.sqm || ""}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              sqm: Number(e.target.value),
                            }))
                          }
                        />
                      </div>

                      <div className="field">
  <label>Ambientes</label>
  <input
    className="input"
    type="number"
    min={1}
    placeholder="Ej: 3"
    value={draft.rooms || ""}
    onChange={(e) =>
      setDraft((d) => ({
        ...d,
        rooms: e.target.value ? Number(e.target.value) : undefined,
      }))
    }
  />
</div>

                      <div className="field">
                        <label>Descripción</label>
                        <textarea
                          className="textarea"
                          placeholder="Contá lo más importante: ambientes, luz, estado, cercanía a transporte, expensas, requisitos..."
                          value={draft.description || ""}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="toggle-row">
                      <button
                        type="button"
                        className={`toggle ${draft.furnished ? "active" : ""}`}
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            furnished: !d.furnished,
                          }))
                        }
                      >
                        Amoblado
                      </button>

                      <button
                        type="button"
                        className={`toggle ${draft.pets ? "active" : ""}`}
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            pets: !d.pets,
                          }))
                        }
                      >
                        Acepta mascotas
                      </button>
                    </div>

                    {errorMessage && <div className="error">{errorMessage}</div>}

                    <div className="actions">
                      <button className="btn btn-secondary" onClick={back}>
                        Volver
                      </button>
                      <button className="btn btn-primary" onClick={next}>
                        Continuar
                      </button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="upload-box">
                      <h3>Subí fotos o videos</h3>
                      <p>
                        No hace falta que sean perfectas, pero sí claras. Después
                        vas a poder revisar la propiedad antes de publicarla.
                      </p>

                      <input
                        id="media-upload"
                        className="file-input"
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          setDraft((d) => ({
                            ...d,
                            media: [...(d.media || []), ...files],
                          }))
                        }}
                      />

                      <label htmlFor="media-upload" className="file-label">
                        Elegir archivos
                      </label>
                    </div>

                    {!!draft.media?.length && (
                      <div className="media-list">
                        {draft.media.map((file, index) => (
                          <div className="media-item" key={`${file.name}-${index}`}>
                            <span>
                              {index + 1}. {file.name}
                            </span>
                            <button
                              type="button"
                              className="remove-file"
                              onClick={() =>
                                setDraft((d) => ({
                                  ...d,
                                  media: (d.media || []).filter(
                                    (_, i) => i !== index
                                  ),
                                }))
                              }
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {errorMessage && <div className="error">{errorMessage}</div>}

                    <div className="actions">
                      <button className="btn btn-secondary" onClick={back}>
                        Volver
                      </button>
                      <button className="btn btn-primary" onClick={next}>
                        Continuar
                      </button>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <div className="field-grid">
                      <div className="field">
                        <label>Dirección exacta</label>
                        <input
                          className="input"
                          placeholder="Ej: Av. Santa Fe 1234, piso 5"
                          value={draft.address || ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, address: e.target.value }))
                          }
                        />
                      </div>

                      <div className="field two-cols">
                        <div className="field">
                          <label>Nombre</label>
                          <input
                            className="input"
                            placeholder="Tu nombre"
                            value={draft.first_name || ""}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                first_name: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field">
                          <label>Apellido</label>
                          <input
                            className="input"
                            placeholder="Tu apellido"
                            value={draft.last_name || ""}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                last_name: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="field two-cols">
                        <div className="field">
                          <label>Teléfono</label>
                          <input
                            className="input"
                            placeholder="Ej: 11 1234 5678"
                            value={draft.phone || ""}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                phone: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field">
                          <label>Email</label>
                          <input
                            className="input"
                            type="email"
                            placeholder="tu@email.com"
                            value={draft.email || ""}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                email: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="summary">
                      <div className="summary-row">
                        <span>Estado inicial</span>
                        <strong>Borrador</strong>
                      </div>
                      <div className="summary-row">
                        <span>Visibilidad</span>
                        <strong>No pública todavía</strong>
                      </div>
                      <div className="summary-row">
                        <span>Siguiente paso</span>
                        <strong>Preview y publicación</strong>
                      </div>
                    </div>

                    {errorMessage && <div className="error">{errorMessage}</div>}

                    <div className="actions">
                      <button className="btn btn-secondary" onClick={back}>
                        Volver
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={publish}
                        disabled={isPublishing}
                      >
                        {isPublishing ? "Guardando..." : "Guardar borrador"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

