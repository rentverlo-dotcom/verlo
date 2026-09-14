import {
  NextResponse,
} from "next/server"

export const runtime =
  "nodejs"

export const dynamic =
  "force-dynamic"

/**
 * LEGACY ENDPOINT
 *
 * Este endpoint pertenecía al flujo viejo:
 *
 * /match/[token]
 * -> tenant_interest
 * -> /candidato/[token]
 *
 * Ese flujo ya NO es válido en producción.
 *
 * Flujo vigente:
 *
 * /matches/[tenantToken]
 * -> tenant elige propiedad
 * -> /api/tenant-verification
 * -> tenant_interest_at
 * -> tenant_verified_at
 * -> owner recibe candidato
 * -> /candidatos/[ownerToken]
 *
 * Regla:
 * el propietario NO debe recibir un candidato
 * antes de que el tenant complete su validación.
 */

export async function GET() {
  return NextResponse.json(
    {
      ok:
        false,

      deprecated:
        true,

      endpoint:
        "match-interest",

      replacement:
        "/api/tenant-verification",

      flow:
        "/matches/[tenantToken]",

      error:
        "Legacy endpoint disabled",
    },
    {
      status: 410,
    }
  )
}

export async function POST() {
  return NextResponse.json(
    {
      ok:
        false,

      deprecated:
        true,

      endpoint:
        "match-interest",

      replacement:
        "/api/tenant-verification",

      flow:
        "/matches/[tenantToken]",

      error:
        "Este flujo fue reemplazado. El interés del inquilino se registra junto con su validación.",
    },
    {
      status: 410,
    }
  )
}
