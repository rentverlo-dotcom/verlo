import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authorizeTemporaryWrite } from "@/lib/temporarios/write-auth"
import { createTemporaryContractPdf, verifyTemporaryContractText } from "@/lib/temporarios/contract-pdf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } })

export async function GET(request: Request) {
  const matchId = new URL(request.url).searchParams.get("matchId") || ""
  if (!uuid.test(matchId)) return fail(400, "Coincidencia inválida")
  const auth = await authorizeTemporaryWrite(request, "owner")
  if (!auth.ok) return fail(auth.status, auth.error)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return fail(503, "Servicio no disponible")
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: match, error: matchError } = await db
    .from("temporary_matches")
    .select("id,temporary_properties!inner(owner_user_id),temporary_demands!inner(tenant_user_id)")
    .eq("id", matchId).maybeSingle()
  if (matchError || !match) return fail(404, "Coincidencia no encontrada")
  const prop = Array.isArray(match.temporary_properties) ? match.temporary_properties[0] : match.temporary_properties
  const demand = Array.isArray(match.temporary_demands) ? match.temporary_demands[0] : match.temporary_demands
  if (auth.userId !== prop?.owner_user_id && auth.userId !== demand?.tenant_user_id) return fail(403, "Sin acceso al contrato")
  const { data: reservation, error: reservationError } = await db.from("temporary_reservations").select("id").eq("match_id", matchId).maybeSingle()
  if (reservationError || !reservation) return fail(404, "Reserva no encontrada")
  const { data: contract, error } = await db.from("temporary_contracts")
    .select("id,status,version,document_text,document_sha256")
    .eq("reservation_id", reservation.id).maybeSingle()
  if (error || !contract || !["ready", "agreed"].includes(contract.status)) return fail(404, "Contrato no disponible")
  if (typeof contract.document_text !== "string" || typeof contract.document_sha256 !== "string" ||
      !verifyTemporaryContractText(contract.document_text, contract.document_sha256)) {
    return fail(409, "La integridad del contrato no coincide")
  }
  const pdf = createTemporaryContractPdf({
    documentText: contract.document_text,
    version: contract.version,
    sha256: contract.document_sha256,
    contractId: contract.id,
  })
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="verlo-temporarios-${contract.id}.pdf"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
