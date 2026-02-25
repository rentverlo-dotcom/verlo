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

  try {
    const url = `https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(
      provincia
    )}&max=500`
    console.log('[v0] Georef municipios URL:', url)

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    })

    console.log('[v0] Georef municipios status:', res.status)

    if (!res.ok) {
      const text = await res.text()
      console.error('[v0] Georef municipios error body:', text)
      return NextResponse.json(
        { error: 'Error from georef API', status: res.status, body: text },
        { status: 502 }
      )
    }

    const data = await res.json()
    console.log('[v0] Georef municipios count:', data.municipios?.length ?? 0)
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[v0] Georef municipios fetch failed:', err.message)
    return NextResponse.json(
      { error: 'Georef API unreachable', detail: err.message, municipios: [] },
      { status: 502 }
    )
  }
}
