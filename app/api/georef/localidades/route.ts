import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const municipio = new URL(req.url).searchParams.get("municipio")
  if (!municipio) return NextResponse.json({ error: "municipio requerido" }, { status: 400 })

  const isDepartment = /^dept:\\d+$/.test(municipio)
  const query = new URLSearchParams({ [isDepartment ? "departamento" : "municipio"]: isDepartment ? municipio.slice(5) : municipio, max: "500" })
  const upstream = await fetch("https://apis.datos.gob.ar/georef/api/localidades?" + query, { signal: AbortSignal.timeout(10000) })
  if (!upstream.ok) return NextResponse.json({ error: "Georef no disponible" }, { status: 503 })
  return NextResponse.json(await upstream.json())
}
