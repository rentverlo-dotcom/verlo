import {
  NextResponse,
} from "next/server"

export const runtime =
  "nodejs"

export const dynamic =
  "force-dynamic"

/**
 * Endpoint deshabilitado en producción.
 *
 * Las notificaciones reales deben salir únicamente
 * desde eventos de negocio registrados mediante
 * notifyLeadOnce().
 *
 * No permitimos enviar Push arbitrarios por API.
 */

export async function GET() {
  return NextResponse.json(
    {
      ok: false,

      disabled: true,

      error:
        "Push test endpoint disabled",
    },
    {
      status: 410,
    }
  )
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,

      disabled: true,

      error:
        "Push test endpoint disabled",
    },
    {
      status: 410,
    }
  )
}
