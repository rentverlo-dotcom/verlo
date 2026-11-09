import { randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validQaWorkflowToken } from "@/lib/qa/verify-workflow-token"
import { POST as createProperty } from "@/app/api/temporarios/properties/route"
import { POST as createDemand } from "@/app/api/temporarios/demands/route"
import { POST as commitMatch } from "@/app/api/temporarios/matches/commit/route"
import { POST as decideMatch } from "@/app/api/temporarios/matches/decide/route"
import { POST as startReservation } from "@/app/api/temporarios/reservations/start/route"
import { POST as acceptTerms } from "@/app/api/temporarios/reservations/accept-terms/route"
import { POST as confirmReservation } from "@/app/api/temporarios/reservations/confirm/route"
import { POST as contractAction } from "@/app/api/temporarios/contracts/route"
import { createTemporaryContractPdf } from "@/lib/temporarios/contract-pdf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const QA_URL = "https://anptswspguyotnasoacq.supabase.co"
const errorResponse = (error: string) => NextResponse.json(
  { ok: false, qaOnly: true, error }, { status: 503, headers: { "Cache-Control": "no-store" } },
)

async function invoke(
  label: string,
  handler: (request: Request) => Promise<Response>,
  jwt: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await handler(new Request("https://qa.verlo.invalid/api/temporarios/" + label, {
    method: "POST",
    headers: { Authorization: "Bearer " + jwt, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }))
  const body = await response.json().catch(() => null) as Record<string, unknown> | null
  if (!response.ok || !body || body.ok !== true) throw Error(label + "_FAILED_" + response.status)
  return body
}

export async function POST(request: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== "qa/verlo-e2e" ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    return errorResponse("QA_ONLY")

  const bearer = request.headers.get("authorization") || ""
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || ""
  if (!bearer.startsWith("Bearer ") || !sha ||
      !(await validQaWorkflowToken(bearer.slice(7), sha))) return errorResponse("QA_AUTH_FAILED")

  const admin = createClient(QA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const publicClient = createClient(QA_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const createdUsers: string[] = []
  let propertyId = ""
  let demandId = ""
  let matchId = ""
  let reservationId = ""
  let contractId = ""

  try {
    const run = randomBytes(9).toString("hex")
    const makeUser = async (role: "owner" | "tenant") => {
      const email = "qa-temporary-" + role + "-" + run + "@example.com"
      const password = randomBytes(30).toString("base64url")
      const result = await admin.auth.admin.createUser({ email, password, email_confirm: true })
      if (result.error || !result.data.user) throw Error("QA_" + role + "_CREATE_FAILED")
      createdUsers.push(result.data.user.id)
      const login = await publicClient.auth.signInWithPassword({ email, password })
      if (login.error || !login.data.session?.access_token)
        throw Error("QA_" + role + "_LOGIN_FAILED")
      return { email, id: result.data.user.id, jwt: login.data.session.access_token }
    }

    const owner = await makeUser("owner")
    const tenant = await makeUser("tenant")
    if (owner.id === tenant.id) throw Error("QA_SAME_USER")

    const today = new Date()
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 35))
    const iso = (date: Date) => date.toISOString().slice(0, 10)
    const inDate = iso(start)
    const outDate = iso(new Date(start.getTime() + 4 * 86400000))
    const locality = "ar:06:060756:06075610"

    const property = await invoke("property", createProperty, owner.jwt, {
      requestKey: crypto.randomUUID(), fullName: "QA Owner Temporary",
      phone: "1155550101", localityKey: locality, localityLabel: "Olivos",
      propertyType: "departamento", nightlyPriceArs: 85000,
      availabilityStart: iso(new Date(start.getTime() - 2 * 86400000)),
      availabilityEnd: iso(new Date(start.getTime() + 10 * 86400000)),
      depositRequired: false,
    })
    propertyId = String(property.id || "")
    if (!propertyId) throw Error("QA_PROPERTY_MISSING")
    // Photo workflow is tested independently; publish only this synthetic listing
    // to exercise the real API handlers without adding external media.
    const published = await admin.from("temporary_properties").update({
      status: "published", title: "QA synthetic temporary listing",
    }).eq("id", propertyId).eq("owner_user_id", owner.id)
    if (published.error) throw Error("QA_PUBLISH_FAILED")

    const demand = await invoke("demand", createDemand, tenant.jwt, {
      requestKey: crypto.randomUUID(), fullName: "QA Tenant Temporary",
      phone: "1155550102", localityKeys: [locality],
      propertyType: "departamento", checkIn: inDate, checkOut: outDate,
      maxTotalBudgetArs: 400000,
    })
    demandId = String(demand.id || "")
    if (!demandId) throw Error("QA_DEMAND_MISSING")

    const match = await invoke("commit-match", commitMatch, owner.jwt, {
      propertyId, demandId,
    })
    matchId = String(match.id || "")
    if (!matchId) throw Error("QA_MATCH_MISSING")
    const second = await invoke("commit-replay", commitMatch, owner.jwt, { propertyId, demandId })
    if (second.id !== matchId || second.reused !== true) throw Error("QA_MATCH_REPLAY_FAILED")

    // A different owner cannot decide for this property.
    const unauthorized = await decideMatch(new Request("https://qa.verlo.invalid/api/temporarios/decide", {
      method: "POST", headers: {
        Authorization: "Bearer " + tenant.jwt,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matchId, role: "owner", decision: "accepted" }),
    }))
    if (unauthorized.status !== 403) throw Error("QA_OWNER_ROLE_LEAK")

    const ownerDecision = await invoke("owner-decision", decideMatch, owner.jwt,
      { matchId, role: "owner", decision: "accepted" })
    if ((ownerDecision.match as Record<string, unknown>)?.status !== "new")
      throw Error("QA_OWNER_ACCEPTANCE_FAILED")
    const tenantDecision = await invoke("tenant-decision", decideMatch, tenant.jwt,
      { matchId, role: "tenant", decision: "accepted" })
    if ((tenantDecision.match as Record<string, unknown>)?.status !== "accepted")
      throw Error("QA_TENANT_ACCEPTANCE_FAILED")

    const started = await invoke("reservation-start", startReservation, owner.jwt, { matchId })
    const reservation = started.reservation as Record<string, unknown>
    reservationId = String(reservation?.id || "")
    if (!reservationId || reservation.status !== "draft") throw Error("QA_RESERVATION_DRAFT_MISSING")
    const replay = await invoke("reservation-replay", startReservation, owner.jwt, { matchId })
    if ((replay.reservation as Record<string, unknown>)?.reused !== true)
      throw Error("QA_RESERVATION_REPLAY_FAILED")

    await invoke("owner-terms", acceptTerms, owner.jwt, { matchId, role: "owner" })
    const terms = await invoke("tenant-terms", acceptTerms, tenant.jwt, { matchId, role: "tenant" })
    if ((terms.reservation as Record<string, unknown>)?.status !== "terms_accepted")
      throw Error("QA_TERMS_NOT_ACCEPTED")

    // No contract fee has been paid: the production handler must refuse confirmation.
    const beforeFee = await confirmReservation(new Request("https://qa.verlo.invalid/api/temporarios/confirm", {
      method: "POST", headers: { Authorization: "Bearer " + owner.jwt,
        "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, role: "owner" }),
    }))
    if (beforeFee.status !== 409) throw Error("QA_UNPAID_RESERVATION_NOT_BLOCKED")

    // QA-only fee stand-in, NOT a real Mercado Pago transaction.
    const simulated = await admin.from("temporary_reservations")
      .update({ status: "fee_paid" }).eq("id", reservationId)
    if (simulated.error) throw Error("QA_FEE_STANDIN_FAILED")

    await invoke("confirm-owner", confirmReservation, owner.jwt, { matchId, role: "owner" })
    const confirmation = await invoke("confirm-tenant", confirmReservation, tenant.jwt,
      { matchId, role: "tenant" })
    if ((confirmation.reservation as Record<string, unknown>)?.status !== "confirmed")
      throw Error("QA_RESERVATION_NOT_CONFIRMED")

    const legal = {
      matchId, action: "generate",
      owner: { fullName: "QA Owner Temporary", document: "QA-12345678", address: "QA Olivos synthetic address" },
      tenant: { fullName: "QA Tenant Temporary", document: "QA-87654321", address: "QA Vicente Lopez synthetic address" },
      houseRules: "QA synthetic contract only; no real reservation.",
    }
    const generated = await invoke("contract-generate", contractAction, owner.jwt, legal)
    contractId = String(generated.contractId || "")
    if (!contractId) throw Error("QA_CONTRACT_MISSING")
    await invoke("contract-owner-accept", contractAction, owner.jwt,
      { matchId, action: "accept" })
    await invoke("contract-tenant-accept", contractAction, tenant.jwt,
      { matchId, action: "accept" })

    const final = await admin.from("temporary_contracts").select(
      "id,status,document_text,document_sha256,owner_agreed_at,tenant_agreed_at",
    ).eq("id", contractId).single()
    if (final.error || final.data?.status !== "agreed" ||
        !final.data.owner_agreed_at || !final.data.tenant_agreed_at ||
        !final.data.document_text || !final.data.document_sha256)
      throw Error("QA_CONTRACT_NOT_AGREED")
    if (!final.data.document_text.includes("El pago del alojamiento y cualquier depósito acordado se realizan directamente entre las partes"))
      throw Error("QA_TEMPORARY_PAYMENT_RULE_MISSING")
    const pdf = createTemporaryContractPdf({
      documentText: final.data.document_text, version: 1,
      sha256: final.data.document_sha256, contractId,
    })
    if (!pdf.subarray(0, 8).toString("latin1").startsWith("%PDF-"))
      throw Error("QA_TEMPORARY_PDF_INVALID")

    return NextResponse.json({
      ok: true, qaOnly: true, realTemporaryApiHandlers: true,
      twoAuthenticatedRoles: true, matchIdempotent: true,
      ownerTenantIsolation: true, doubleAcceptance: true,
      reservationTermsAccepted: true, unpaidConfirmationDenied: true,
      feeSimulated: true, bilateralReservationConfirmed: true,
      contractAgreedByBoth: true, temporaryContractPdf: true,
      noRealPayment: true, noExternalNotifications: true,
    }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "QA_TEMPORARY_UNKNOWN")
  } finally {
    if (contractId) {
      await admin.from("temporary_contract_acceptances").delete().eq("contract_id", contractId)
      await admin.from("temporary_contracts").delete().eq("id", contractId)
    }
    if (reservationId) {
      const { data: notifications } = await admin.from("temporary_notification_outbox")
        .select("id").eq("reservation_id", reservationId)
      const ids = (notifications || []).map(n => n.id)
      if (ids.length) await admin.from("temporary_push_outbox").delete().in("notification_id", ids)
      await admin.from("temporary_notification_outbox").delete().eq("reservation_id", reservationId)
      await admin.from("temporary_availability_blocks").delete().eq("reservation_id", reservationId)
      await admin.from("temporary_payment_attempts").delete().eq("reservation_id", reservationId)
      await admin.from("temporary_payments").delete().eq("reservation_id", reservationId)
      await admin.from("temporary_reservations").delete().eq("id", reservationId)
    }
    if (matchId) await admin.from("temporary_matches").delete().eq("id", matchId)
    if (demandId) await admin.from("temporary_demands").delete().eq("id", demandId)
    if (propertyId) await admin.from("temporary_properties").delete().eq("id", propertyId)
    for (const userId of createdUsers) {
      await admin.from("user_profiles").delete().eq("user_id", userId)
      await admin.auth.admin.deleteUser(userId)
    }
  }
}
