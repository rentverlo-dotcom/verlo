import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const provincia = searchParams.get('provincia')

  if (!provincia) {
    return NextResponse.json(
      { error: 'provincia requerida' },
      { status: 400 }
    )
  }

  const res = await fetch(
    `https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(
      provincia
    )}&max=500`
  )

  const data = await res.json()
  return NextResponse.json(data)
}
