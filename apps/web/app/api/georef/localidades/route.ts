import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const municipio = searchParams.get('municipio')

  if (!municipio) {
    return NextResponse.json(
      { error: 'municipio requerido' },
      { status: 400 }
    )
  }

  const res = await fetch(
    `https://apis.datos.gob.ar/georef/api/localidades?municipio=${encodeURIComponent(
      municipio
    )}&max=500`
  )

  const data = await res.json()
  return NextResponse.json(data)
}
