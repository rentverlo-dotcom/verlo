import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const provincia = new URL(req.url).searchParams.get("provincia")
  if (!provincia) return NextResponse.json({ error: "provincia requerida" }, { status: 400 })

  const base = "https://apis.datos.gob.ar/georef/api/"
  const query = new URLSearchParams({ provincia, max: "500" })
  const provinceName = provincia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  const useDepartments = provinceName === "santa cruz" || provinceName === "santiago del estero"
  const endpoint = useDepartments ? "departamentos" : "municipios"
  const upstream = await fetch(base + endpoint + "?" + query, { signal: AbortSignal.timeout(10000) })
  if (!upstream.ok) return NextResponse.json({ error: "Georef no disponible" }, { status: 503 })
  const data = await upstream.json()
  if (useDepartments) {
    return NextResponse.json({
      municipios: (data.departamentos || []).map((d: any) => ({
        id: "dept:" + String(d.id),
        nombre: d.nombre,
      })),
    })
  }
  return NextResponse.json(data)
}
