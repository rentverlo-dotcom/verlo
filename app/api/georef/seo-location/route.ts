import { NextRequest, NextResponse } from "next/server"
import { locationBySlug } from "@/lib/seo/argentina-locations"

export const runtime = "nodejs"
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
const PROVINCE_IDS: Record<string, string> = {
  "Buenos Aires":"06", "Ciudad Autónoma de Buenos Aires":"02", "Catamarca":"10", "Chaco":"22", "Chubut":"26",
  "Córdoba":"14", "Corrientes":"18", "Entre Ríos":"30", "Formosa":"34", "Jujuy":"38", "La Pampa":"42",
  "La Rioja":"46", "Mendoza":"50", "Misiones":"54", "Neuquén":"58", "Río Negro":"62", "Salta":"66",
  "San Juan":"70", "San Luis":"74", "Santa Cruz":"78", "Santa Fe":"82", "Santiago del Estero":"86",
  "Tucumán":"90", "Tierra del Fuego":"94",
}

// Where a place name is shared by more than one Georef locality, prefer a
// municipality that is explicitly and unambiguously associated with the landing.
// Never guess a locality ID or silently change the visitor's selected city.
const EXPECTED_MUNICIPALITIES: Record<string, string[]> = {
  "bariloche": ["bariloche"],
  "cordoba": ["cordoba"],
  "mar-del-plata": ["general-pueyrredon"],
  "pinamar": ["pinamar"],
  "tigre": ["tigre"],
  "villa-gesell": ["villa-gesell"],
  "vicente-lopez": ["vicente-lopez"],
  "san-isidro": ["san-isidro"],
  "nordelta": ["tigre"],
  "carilo": ["pinamar"],
  "la-plata": ["la-plata"],
  "san-fernando": ["san-fernando"],
  "pilar": ["pilar"],
  "escobar": ["escobar"],
  "bahia-blanca": ["bahia-blanca"],
  "necochea": ["necochea"],
}

const response = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control":"public, max-age=300, s-maxage=3600" } })

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("zona") || ""
  const location = locationBySlug.get(slug)
  if (!location || !/^[a-z0-9-]{2,90}$/.test(slug)) return response({ ok:false, error:"Zona desconocida" },404)
  const provinceId = PROVINCE_IDS[location.province]
  if (!provinceId) return response({ ok:false, error:"Provincia no disponible" },422)

  // CABA has a first-party barrio selector; its IDs follow the same schema as the existing form.
  if (provinceId === "02") {
    const barrio = location.name
    return response({ok:true, location: {
      provinceId:"02",provinceName:location.province,municipalityId:"caba",
      municipalityName:"Ciudad Autónoma de Buenos Aires",localityId:barrio,localityName:barrio,
      latitude:null,longitude:null,key:`ar:02:caba:${normalize(barrio)}`,label:`${barrio}, CABA`,
    }})
  }

  try {
    // Resolve the landing's human-readable name to the exact locality and municipality IDs used by matching.
    const api = new URL("https://apis.datos.gob.ar/georef/api/localidades")
    api.searchParams.set("nombre",location.name)
    api.searchParams.set("provincia",provinceId)
    api.searchParams.set("max","100")
    api.searchParams.set("campos","id,nombre,municipio,provincia,centroide")
    const upstream = await fetch(api.toString(),{next:{revalidate:86400},signal:AbortSignal.timeout(8000)})
    if (!upstream.ok) return response({ok:false,error:"Georef no disponible"},503)
    const data = await upstream.json()
    const exact = (Array.isArray(data?.localidades)?data.localidades:[]).filter((item: any) =>
      normalize(String(item?.nombre||"")) === normalize(location.name) &&
      String(item?.provincia?.id || provinceId) === provinceId &&
      item?.municipio?.id && item?.id
    )
    // Never silently point a rental search to an ambiguous town with the same name.
    const identities = new Map<string,any>(exact.map((item:any)=>[String(item.municipio.id)+":"+String(item.id),item]))
    let matches = Array.from(identities.values())
    if (matches.length > 1) {
      const expected = EXPECTED_MUNICIPALITIES[slug] ||
        [normalize(location.name)]
      const byMunicipality = matches.filter((item: any) =>
        expected.includes(normalize(String(item.municipio.nombre || "")))
      )
      if (byMunicipality.length === 1) matches = byMunicipality
    }
    if (matches.length !== 1) {
      return response({
        ok:false,
        error: matches.length ? "Localidad ambigua: seleccioná el municipio manualmente" : "Localidad no encontrada: seleccionala manualmente",
      },422)
    }
    const item = matches[0]
    const municipalityId=String(item.municipio.id), localityId=String(item.id)
    const latitude=typeof item?.centroide?.lat==="number"?item.centroide.lat:null
    const longitude=typeof item?.centroide?.lon==="number"?item.centroide.lon:null
    return response({ok:true,location:{
      provinceId,provinceName:location.province,municipalityId,municipalityName:String(item.municipio.nombre),
      localityId,localityName:String(item.nombre),latitude,longitude,
      key:`ar:${provinceId}:${municipalityId}:${localityId}`,
      label:`${item.nombre}, ${item.municipio.nombre}, ${location.province}`,
    }})
  } catch {
    return response({ok:false,error:"No pudimos resolver la ubicación. Elegila manualmente."},503)
  }
}
