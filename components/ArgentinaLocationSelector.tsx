"use client"

import { useEffect, useMemo, useState } from "react"

type Mode = "single" | "multi"

type LocationItem = {
  provinceId: string
  provinceName: string
  municipalityId: string
  municipalityName: string
  localityId: string
  localityName: string
  key: string
  label: string
}

type Props = {
  mode?: Mode
  labelName: string
  keyName: string
  dataName?: string
  className?: string
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
  { id: "94", name: "Tierra del Fuego, Antártida e Islas del Atlántico Sur" },
]

const CABA_MUNICIPALITY = {
  id: "caba",
  name: "Ciudad Autónoma de Buenos Aires",
}

const CABA_BARRIOS = [
  "Agronomía","Almagro","Balvanera","Barracas","Belgrano","Boedo","Caballito",
  "Chacarita","Coghlan","Colegiales","Constitución","Flores","Floresta","La Boca",
  "La Paternal","Liniers","Mataderos","Monte Castro","Monserrat","Nueva Pompeya",
  "Núñez","Palermo","Parque Avellaneda","Parque Chacabuco","Parque Chas",
  "Parque Patricios","Puerto Madero","Recoleta","Retiro","Saavedra","San Cristóbal",
  "San Nicolás","San Telmo","Vélez Sarsfield","Versalles","Villa Crespo",
  "Villa del Parque","Villa Devoto","Villa General Mitre","Villa Lugano","Villa Luro",
  "Villa Ortúzar","Villa Pueyrredón","Villa Real","Villa Riachuelo","Villa Santa Rita",
  "Villa Soldati","Villa Urquiza",
].map((name) => ({ id: name, name }))

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function ArgentinaLocationSelector({
  mode = "single",
  labelName,
  keyName,
  dataName,
  className = "",
}: Props) {
  const [provinceId, setProvinceId] = useState("")
  const [municipalityId, setMunicipalityId] = useState("")
  const [localityId, setLocalityId] = useState("")
  const [municipalities, setMunicipalities] = useState<any[]>([])
  const [localities, setLocalities] = useState<any[]>([])
  const [selected, setSelected] = useState<LocationItem[]>([])
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false)
  const [loadingLocalities, setLoadingLocalities] = useState(false)

  const province = useMemo(
    () => ARG_PROVINCES.find((item) => item.id === provinceId) || null,
    [provinceId]
  )

  const municipality = useMemo(
    () => municipalities.find((item) => String(item.id) === String(municipalityId)) || null,
    [municipalities, municipalityId]
  )

  const locality = useMemo(
    () => localities.find((item) => String(item.id) === String(localityId)) || null,
    [localities, localityId]
  )

  useEffect(() => {
    setMunicipalityId("")
    setLocalityId("")
    setMunicipalities([])
    setLocalities([])

    if (!provinceId || !province) return

    if (provinceId === "02") {
      setMunicipalities([CABA_MUNICIPALITY])
      setMunicipalityId(CABA_MUNICIPALITY.id)
      setLocalities(CABA_BARRIOS)
      return
    }

    setLoadingMunicipalities(true)
    fetch(`/api/georef/municipios?provincia=${encodeURIComponent(province.name)}`)
      .then((response) => response.json())
      .then((data) => {
        setMunicipalities(
          (data.municipios || []).map((item: any) => ({
            id: String(item.id),
            name: item.nombre,
          }))
        )
      })
      .catch(() => setMunicipalities([]))
      .finally(() => setLoadingMunicipalities(false))
  }, [provinceId])

  useEffect(() => {
    setLocalityId("")

    if (!municipalityId) {
      setLocalities([])
      return
    }

    if (provinceId === "02" && municipalityId === CABA_MUNICIPALITY.id) {
      setLocalities(CABA_BARRIOS)
      return
    }

    setLoadingLocalities(true)
    fetch(`/api/georef/localidades?municipio=${encodeURIComponent(municipalityId)}`)
      .then((response) => response.json())
      .then((data) => {
        setLocalities(
          (data.localidades || []).map((item: any) => ({
            id: String(item.id),
            name: item.nombre,
          }))
        )
      })
      .catch(() => setLocalities([]))
      .finally(() => setLoadingLocalities(false))
  }, [municipalityId, provinceId])

  function buildCurrentLocation(): LocationItem | null {
    if (!province || !municipality || !locality) return null

    const key =
      provinceId === "02"
        ? `ar:02:caba:${normalizeText(locality.name)}`
        : `ar:${provinceId}:${municipality.id}:${locality.id}`

    return {
      provinceId,
      provinceName: province.name,
      municipalityId: String(municipality.id),
      municipalityName: municipality.name,
      localityId: String(locality.id),
      localityName: locality.name,
      key,
      label:
        provinceId === "02"
          ? `${locality.name}, CABA`
          : `${locality.name}, ${municipality.name}, ${province.name}`,
    }
  }

  function commitCurrent() {
    const item = buildCurrentLocation()
    if (!item) return

    setSelected((current) => {
      if (mode === "single") return [item]
      if (current.some((existing) => existing.key === item.key)) return current
      return [...current, item]
    })
  }

  useEffect(() => {
    if (mode !== "single") return
    const item = buildCurrentLocation()
    if (!item) {
      setSelected([])
      return
    }
    setSelected([item])
  }, [mode, provinceId, municipalityId, localityId, province, municipality, locality])

  return (
    <div className={className}>
      <div className="row">
        <select
          className="select"
          value={provinceId}
          onChange={(event) => setProvinceId(event.target.value)}
          required
        >
          <option value="">Provincia</option>
          {ARG_PROVINCES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={municipalityId}
          onChange={(event) => setMunicipalityId(event.target.value)}
          disabled={!provinceId || loadingMunicipalities}
          required
        >
          <option value="">
            {loadingMunicipalities ? "Cargando..." : "Municipio / partido"}
          </option>
          {municipalities.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="row">
        <select
          className="select"
          value={localityId}
          onChange={(event) => setLocalityId(event.target.value)}
          disabled={!municipalityId || loadingLocalities}
          required
        >
          <option value="">
            {loadingLocalities ? "Cargando..." : provinceId === "02" ? "Barrio" : "Localidad / barrio"}
          </option>
          {localities.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        {mode === "multi" ? (
          <button
            type="button"
            className="select"
            onClick={commitCurrent}
            disabled={!localityId}
            style={{ cursor: localityId ? "pointer" : "not-allowed", fontWeight: 900 }}
          >
            Agregar zona
          </button>
        ) : (
          <div />
        )}
      </div>

      {selected.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {selected.map((item) => (
            <span
              key={item.key}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                padding: "8px 12px",
                background: "rgba(242,168,169,.24)",
                fontSize: 13,
                fontWeight: 850,
              }}
            >
              {item.label}
              {mode === "multi" && (
                <button
                  type="button"
                  onClick={() =>
                    setSelected((current) =>
                      current.filter((selectedItem) => selectedItem.key !== item.key)
                    )
                  }
                  style={{ border: 0, background: "transparent", cursor: "pointer", fontWeight: 950 }}
                  aria-label={`Quitar ${item.label}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {selected.map((item) => (
        <span key={`hidden-${item.key}`}>
          <input type="hidden" name={labelName} value={item.label} />
          <input type="hidden" name={keyName} value={item.key} />
        </span>
      ))}

      {dataName && (
        <input type="hidden" name={dataName} value={JSON.stringify(selected)} />
      )}
    </div>
  )
}
