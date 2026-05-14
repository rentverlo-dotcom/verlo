"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import VerloBrand from "@/components/VerloBrand"

type Draft = {
  province_id?: string
  municipality_id?: string
  neighborhood_id?: string

  city?: string | null
  zone?: string | null

  min_price?: number
  max_price?: number

  
min_rooms?: number
max_rooms?: number

  preferred_property_types?: string[]
  preferred_durations?: string[]

  furnished_preference?: boolean | null
  pets_preference?: boolean | null
  notes?: string
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

const PROPERTY_TYPES = [
  { value: "apartment", label: "Departamento" },
  { value: "house", label: "Casa" },
  { value: "ph", label: "PH" },
  { value: "room", label: "Habitación" },
  { value: "local", label: "Local" },
]

const DURATIONS = [
  { value: "6_months", label: "6 meses" },
  { value: "12_months", label: "12 meses" },
  { value: "24_months", label: "24 meses" },
]

const steps = [
  {
    number: 1,
    label: "Ubicación",
    title: "¿Dónde querés vivir?",
    copy: "Elegí zona y presupuesto para que Verlo pueda mostrarte propiedades compatibles.",
  },
  {
    number: 2,
    label: "Preferencias",
    title: "¿Qué tipo de propiedad buscás?",
    copy: "Podés elegir más de una opción. Esto nos ayuda a matchearte mejor.",
  },
  {
    number: 3,
    label: "Detalles",
    title: "Últimos detalles",
    copy: "Sumá preferencias finales antes de crear tu búsqueda.",
  },
]

export default function Buscar() {
  const [step, setStep] = useState<number>(() => {
    if (typeof window === "undefined") return 1
    const saved = localStorage.getItem("demand_step")
    return saved ? Number(saved) : 1
  })

  const [draft, setDraft] = useState<Draft>(() => {
    if (typeof window === "undefined") return {}
    return JSON.parse(localStorage.getItem("demand_draft") || "{}")
  })

  const [municipalities, setMunicipalities] = useState<any[]>([])
  const [neighborhoods, setNeighborhoods] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentStep = steps.find((s) => s.number === step) ?? steps[0]
  const progress = (step / 3) * 100

  useEffect(() => {
    localStorage.setItem("demand_draft", JSON.stringify(draft))
  }, [draft])

  useEffect(() => {
    localStorage.setItem("demand_step", String(step))
  }, [step])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/login"
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

  const municipalityName = useMemo(
    () => municipalities.find((m) => m.id === draft.municipality_id)?.name ?? null,
    [municipalities, draft.municipality_id]
  )

  const neighborhoodName = useMemo(
    () => neighborhoods.find((n) => n.id === draft.neighborhood_id)?.name ?? null,
    [neighborhoods, draft.neighborhood_id]
  )

  function toggleArrayField(
    field: "preferred_property_types" | "preferred_durations",
    value: string
  ) {
    setDraft((d) => {
      const current = d[field] || []
      return {
        ...d,
        [field]: current.includes(value)
          ? current.filter((x) => x !== value)
          : [...current, value],
      }
    })
  }

  function validateStep() {
    setErrorMessage(null)

    if (step === 1) {
      if (!municipalityName || draft.min_price == null || draft.max_price == null) {
        setErrorMessage("Completá ciudad y presupuesto para continuar.")
        return false
      }

      if (Number(draft.min_price) > Number(draft.max_price)) {
        setErrorMessage("El presupuesto mínimo no puede ser mayor al máximo.")
        return false
      }
    }

    if (step === 2) {
      if (!draft.preferred_property_types?.length) {
        setErrorMessage("Elegí al menos un tipo de propiedad.")
        return false
      }
    }

    return true
  }

  function next() {
    if (!validateStep()) return
    setStep((s) => Math.min(s + 1, 3))
  }

  function back() {
    setErrorMessage(null)
    setStep((s) => Math.max(s - 1, 1))
  }

  async function submitDemand() {
    if (!validateStep()) return

    setLoading(true)
    setErrorMessage(null)

    try {
      const { data: auth } = await supabase.auth.getUser()

      if (!auth.user) {
        window.location.href = "/login"
        return
      }

      const city = municipalityName

      if (!city) {
        setErrorMessage("Falta la ciudad.")
        setLoading(false)
        return
      }

      const { error } = await supabase.from("demands").insert({
        tenant_id: auth.user.id,
        city,
        zone: neighborhoodName ?? null,
        min_price: draft.min_price,
        max_price: draft.max_price,
        min_rooms: draft.min_rooms ?? null,
        max_rooms: draft.max_rooms ?? null,
        preferred_property_types: draft.preferred_property_types ?? [],
        preferred_durations: draft.preferred_durations?.length
          ? draft.preferred_durations
          : null,
        furnished_preference: draft.furnished_preference ?? null,
        pets_preference: draft.pets_preference ?? null,
        notes: draft.notes ?? null,
      })

      if (error) {
        console.error(error)
        setErrorMessage("No pudimos crear tu búsqueda. Probá de nuevo.")
        setLoading(false)
        return
      }

      localStorage.removeItem("demand_draft")
      localStorage.removeItem("demand_step")

      window.location.href = "/busqueda/creada"
    } catch (err) {
      console.error(err)
      setErrorMessage("Ocurrió un error inesperado. Probá de nuevo.")
      setLoading(false)
    }
  }

  return (
    <main className="tenant-page">
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
          color: var(--black);
        }

        .tenant-page {
          min-height: 100vh;
          padding: 34px 0 80px;
          background:
            radial-gradient(circle at 14% 14%, rgba(242, 168, 169, 0.52), transparent 28%),
            radial-gradient(circle at 86% 18%, rgba(231, 199, 118, 0.3), transparent 24%),
            radial-gradient(circle at 78% 88%, rgba(116, 190, 220, 0.22), transparent 28%),
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
          background: rgba(116, 190, 220, 0.35);
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
        }

        .textarea {
          min-height: 140px;
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

        .choice-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .choice {
          min-height: 62px;
          border: 1px solid rgba(5, 0, 2, 0.1);
          border-radius: 22px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.62);
          cursor: pointer;
          font-weight: 950;
          color: rgba(5, 0, 2, 0.64);
          transition: 150ms ease;
          text-align: left;
        }

        .choice.active {
          background: var(--black);
          color: white;
          border-color: var(--black);
        }

        .toggle-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .toggle {
          border: 1px solid rgba(5, 0, 2, 0.1);
          border-radius: 22px;
          padding: 18px;
          background: rgba(255, 255, 255, 0.62);
          cursor: pointer;
          font-weight: 950;
          color: rgba(5, 0, 2, 0.64);
          transition: 150ms ease;
        }

        .toggle.active {
          background: var(--black);
          color: white;
          border-color: var(--black);
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
          .choice-grid,
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

      <section className="tenant-shell">
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
                Inquilinos
              </div>

              <h1>
                Encontrá alquiler sin <em>intermediarios.</em>
              </h1>

              <p className="intro-copy">
                Contanos qué buscás y Verlo crea tu búsqueda para cruzarte con propiedades compatibles.
              </p>

              <ul className="mini-list">
                <li>
                  <span className="check">✓</span>
                  Buscá por zona y presupuesto real
                </li>
                <li>
                  <span className="check">✓</span>
                  Matcheá con propiedades publicadas
                </li>
                <li>
                  <span className="check">✓</span>
                  Avanzá con identidad validada cuando haya interés
                </li>
              </ul>
            </aside>

            <section className="form-card">
              <div className="form-head">
                <div className="step-meta">
                  <span className="step-pill">Paso {step} de 3</span>
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
                          {ARG_PROVINCES.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label>Ciudad / municipio</label>
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
                          <option value="">Elegí una ciudad</option>
                          {municipalities.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label>Zona / barrio</label>
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
                          <option value="">Opcional</option>
                          {neighborhoods.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field two-cols">
                        <div className="field">
                          <label>Presupuesto mínimo</label>
                          <input
                            className="input"
                            type="number"
                            placeholder="Ej: 300000"
                            value={draft.min_price ?? ""}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                min_price: Number(e.target.value),
                              }))
                            }
                          />
                        </div>

                        <div className="field">
                          <label>Presupuesto máximo</label>
                          <input
                            className="input"
                            type="number"
                            placeholder="Ej: 600000"
                            value={draft.max_price ?? ""}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                max_price: Number(e.target.value),
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {errorMessage && <div className="error">{errorMessage}</div>}

                    <div className="field two-cols">
  <div className="field">
    <label>Ambientes mínimos</label>
    <input
      className="input"
      type="number"
      min={1}
      placeholder="Ej: 2"
      value={draft.min_rooms ?? ""}
      onChange={(e) =>
        setDraft((d) => ({
          ...d,
          min_rooms: e.target.value ? Number(e.target.value) : undefined,
        }))
      }
    />
  </div>

  <div className="field">
    <label>Ambientes máximos</label>
    <input
      className="input"
      type="number"
      min={1}
      placeholder="Ej: 4"
      value={draft.max_rooms ?? ""}
      onChange={(e) =>
        setDraft((d) => ({
          ...d,
          max_rooms: e.target.value ? Number(e.target.value) : undefined,
        }))
      }
    />
  </div>
</div>

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
                        <div className="choice-grid">
                          {PROPERTY_TYPES.map((item) => {
                            const active =
                              draft.preferred_property_types?.includes(item.value) ||
                              false

                            return (
                              <button
                                key={item.value}
                                type="button"
                                className={`choice ${active ? "active" : ""}`}
                                onClick={() =>
                                  toggleArrayField(
                                    "preferred_property_types",
                                    item.value
                                  )
                                }
                              >
                                {item.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="field">
                        <label>Duración preferida</label>
                        <div className="choice-grid">
                          {DURATIONS.map((item) => {
                            const active =
                              draft.preferred_durations?.includes(item.value) ||
                              false

                            return (
                              <button
                                key={item.value}
                                type="button"
                                className={`choice ${active ? "active" : ""}`}
                                onClick={() =>
                                  toggleArrayField(
                                    "preferred_durations",
                                    item.value
                                  )
                                }
                              >
                                {item.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
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
                    <div className="field-grid">
                      <div className="toggle-row">
                        <button
                          type="button"
                          className={`toggle ${
                            draft.furnished_preference === true ? "active" : ""
                          }`}
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              furnished_preference:
                                d.furnished_preference === true ? null : true,
                            }))
                          }
                        >
                          Prefiero amoblado
                        </button>

                        <button
                          type="button"
                          className={`toggle ${
                            draft.pets_preference === true ? "active" : ""
                          }`}
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              pets_preference:
                                d.pets_preference === true ? null : true,
                            }))
                          }
                        >
                          Tengo mascotas
                        </button>
                      </div>

                      <div className="field">
                        <label>Notas opcionales</label>
                        <textarea
                          className="textarea"
                          placeholder="Ej: me gustaría mudarme en junio, necesito balcón, trabajo remoto, etc."
                          value={draft.notes || ""}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              notes: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="summary">
                      <div className="summary-row">
                        <span>Ciudad</span>
                        <strong>{municipalityName || "Sin definir"}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Zona</span>
                        <strong>{neighborhoodName || "Flexible"}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Presupuesto</span>
                        <strong>
                          ${Number(draft.min_price || 0).toLocaleString("es-AR")} - $
                          {Number(draft.max_price || 0).toLocaleString("es-AR")}
                        </strong>
                      </div>
                    </div>

                    {errorMessage && <div className="error">{errorMessage}</div>}

                    <div className="actions">
                      <button className="btn btn-secondary" onClick={back}>
                        Volver
                      </button>

                      <button
                        className="btn btn-primary"
                        onClick={submitDemand}
                        disabled={loading}
                      >
                        {loading ? "Creando..." : "Crear búsqueda"}
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
