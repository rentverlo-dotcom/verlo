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
import { POST as preparePayment } from "@/app/api/temporarios/payments/prepare/route"
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
  const response = await handler(new Request((label === "qa-seed-sandbox-checkout" ? "https://verlopunto0-git-qa-verlo-e2e-verlos-projects-b9e9c595.vercel.app" : "https://qa.verlo.invalid") + "/api/temporarios/" + label, {
    method: "POST",
    headers: { Authorization: "Bearer " + jwt, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }))
  const body = await response.json().catch(() => null) as Record<string, unknown> | null
  if (!response.ok || !body || body.ok !== true) throw Error(label + "_FAILED_" + response.status)
  return body
}


/**
 * One persistent QA-only booking, created using Supabase Auth Admin (never raw
 * writes to auth.users). It stays at terms_accepted until Mercado Pago returns
 * a genuinely verified Sandbox payment. No synthetic fee approvals here.
 */
async function ensureSandboxCheckout(
  admin: ReturnType<typeof createClient>,
  publicClient: ReturnType<typeof createClient>,
) {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "qa/verlo-e2e" ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      !process.env.TEMPORARY_MP_ACCESS_TOKEN?.startsWith("TEST-"))
    throw Error("QA_SANDBOX_TEST_CREDENTIAL_REQUIRED")

  const seedDb = admin as ReturnType<typeof createClient<any>>
  const ownerEmail = "qa-temp-mp-owner-20261113@example.com"
  const tenantEmail = "qa-temp-mp-tenant-20261113@example.com"
  const existing = await seedDb.from("temporary_properties")
    .select("id").eq("owner_email", ownerEmail).maybeSingle()
  if (existing.error) throw Error("QA_SEED_LOOKUP_FAILED")
  if (existing.data) {
    const matches = await seedDb.from("temporary_matches")
      .select("id").eq("property_id", existing.data.id).limit(1)
    if (matches.error || matches.data?.length !== 1) throw Error("QA_SEED_MATCH_MISSING")
    const reservation = await seedDb.from("temporary_reservations")
      .select("id,status").eq("match_id", matches.data[0].id).maybeSingle()
    if (reservation.error || !reservation.data) throw Error("QA_SEED_RESERVATION_MISSING")
    const attempts = await seedDb.from("temporary_payment_attempts")
      .select("mp_checkout_url").eq("reservation_id", reservation.data.id).limit(1)
    if (attempts.error || !attempts.data?.[0]?.mp_checkout_url)
      throw Error("QA_SEED_CHECKOUT_MISSING")
    return { prepared: true, reused: true, reservationId: reservation.data.id,
      reservationStatus: reservation.data.status }
  }

  const users: string[] = []
  let propertyId = "", demandId = "", matchId = "", reservationId = ""
  let success = false
  try {
    const createTestUser = async (email: string) => {
      const password = randomBytes(30).toString("base64url")
      const created = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { qa_synthetic: true, qa_purpose: "temporary_mp_checkout" },
      })
      if (created.error || !created.data.user) throw Error("QA_SEED_USER_CREATE_FAILED")
      users.push(created.data.user.id)
      const login = await publicClient.auth.signInWithPassword({ email, password })
      if (login.error || !login.data.session?.access_token)
        throw Error("QA_SEED_USER_LOGIN_FAILED")
      return { id: created.data.user.id, jwt: login.data.session.access_token }
    }
    const owner = await createTestUser(ownerEmail)
    const tenant = await createTestUser(tenantEmail)

    const today = new Date()
    const checkInDate = new Date(Date.UTC(
      today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 35,
    ))
    const iso = (date: Date) => date.toISOString().slice(0, 10)
    const checkIn = iso(checkInDate)
    const checkOut = iso(new Date(checkInDate.getTime() + 4 * 86400000))
    const p = await invoke("qa-seed-property", createProperty, owner.jwt, {
      requestKey: crypto.randomUUID(), fullName: "QA MP Owner",
      phone: "1155550101", localityKey: "ar:06:060756:06075610",
      localityLabel: "Olivos", propertyType: "departamento",
      nightlyPriceArs: 85000,
      availabilityStart: iso(new Date(checkInDate.getTime() - 2 * 86400000)),
      availabilityEnd: iso(new Date(checkInDate.getTime() + 10 * 86400000)),
      depositRequired: false,
    })
    propertyId = String(p.id || "")
    if (!propertyId) throw Error("QA_SEED_PROPERTY_MISSING")
    const published = await seedDb.from("temporary_properties").update({
      status: "published", title: "QA MP Sandbox - sin validez comercial",
    }).eq("id", propertyId).eq("owner_user_id", owner.id)
    if (published.error) throw Error("QA_SEED_PROPERTY_PUBLISH_FAILED")

    const d = await invoke("qa-seed-demand", createDemand, tenant.jwt, {
      requestKey: crypto.randomUUID(), fullName: "QA MP Tenant",
      phone: "1155550102", localityKeys: ["ar:06:060756:06075610"],
      propertyType: "departamento", checkIn, checkOut,
      maxTotalBudgetArs: 400000,
    })
    demandId = String(d.id || "")
    if (!demandId) throw Error("QA_SEED_DEMAND_MISSING")
    const m = await invoke("qa-seed-match", commitMatch, owner.jwt, {
      propertyId, demandId,
    })
    matchId = String(m.id || "")
    if (!matchId) throw Error("QA_SEED_MATCH_MISSING")
    await invoke("qa-seed-owner-decision", decideMatch, owner.jwt,
      { matchId, role: "owner", decision: "accepted" })
    await invoke("qa-seed-tenant-decision", decideMatch, tenant.jwt,
      { matchId, role: "tenant", decision: "accepted" })
    const r = await invoke("qa-seed-reservation", startReservation, owner.jwt, { matchId })
    reservationId = String((r.reservation as Record<string, unknown>)?.id || "")
    if (!reservationId) throw Error("QA_SEED_RESERVATION_MISSING")
    await invoke("qa-seed-owner-terms", acceptTerms, owner.jwt, { matchId, role: "owner" })
    await invoke("qa-seed-tenant-terms", acceptTerms, tenant.jwt, { matchId, role: "tenant" })

    // This is a real TEST preference, NOT a payment and NOT a simulated approval.
    const checkout = await invoke("qa-seed-sandbox-checkout", preparePayment,
      tenant.jwt, { matchId })
    if (typeof checkout.checkoutUrl !== "string" ||
        !checkout.checkoutUrl.startsWith("https://"))
      throw Error("QA_SEED_CHECKOUT_INVALID")
    success = true
    return { prepared: true, reused: false, reservationId,
      reservationStatus: "terms_accepted" }
  } finally {
    if (!success) {
      if (reservationId) {
        await seedDb.from("temporary_payment_attempts").delete().eq("reservation_id", reservationId)
        await seedDb.from("temporary_reservations").delete().eq("id", reservationId)
      }
      if (matchId) await seedDb.from("temporary_matches").delete().eq("id", matchId)
      if (demandId) await seedDb.from("temporary_demands").delete().eq("id", demandId)
      if (propertyId) await seedDb.from("temporary_properties").delete().eq("id", propertyId)
      for (const id of users) {
        await seedDb.from("user_profiles").delete().eq("user_id", id)
        await admin.auth.admin.deleteUser(id)
      }
    }
  }
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

    // QA-only provider-result stand-in: exercise the REAL atomic payment RPC,
    // rather than setting reservation.status directly. No Mercado Pago calls.
    const attempted = await admin.from("temporary_payment_attempts").insert({
      reservation_id: reservationId, tenant_user_id: tenant.id,
      amount_ars: 49999, currency: "ARS", status: "pending",
      mp_preference_id: "qa-synthetic-" + run,
    }).select("id").single()
    if (attempted.error || !attempted.data?.id)
      throw Error("QA_MP_ATTEMPT_NOT_CREATED")
    const attemptId = attempted.data.id
    const providerPaymentId = "8" + String(BigInt("0x" + run)).slice(0, 14)

    const wrongAmount = await admin.rpc("temporary_register_verified_payment", {
      p_attempt_id: attemptId, p_mp_payment_id: providerPaymentId,
      p_amount: 1, p_currency: "ARS", p_mp_status: "approved",
    })
    if (!wrongAmount.error || wrongAmount.error.message.indexOf("invalid_payment") < 0)
      throw Error("QA_MP_INVALID_AMOUNT_WAS_ACCEPTED")
    const pending = await admin.rpc("temporary_register_verified_payment", {
      p_attempt_id: attemptId, p_mp_payment_id: providerPaymentId,
      p_amount: 49999, p_currency: "ARS", p_mp_status: "pending",
    })
    if (pending.error || pending.data?.status !== "pending")
      throw Error("QA_MP_PENDING_FAILED")
    const approved = await admin.rpc("temporary_register_verified_payment", {
      p_attempt_id: attemptId, p_mp_payment_id: providerPaymentId,
      p_amount: 49999, p_currency: "ARS", p_mp_status: "approved",
    })
    if (approved.error || approved.data?.status !== "approved" ||
        approved.data?.reservationStatus !== "fee_paid")
      throw Error("QA_MP_APPROVAL_FAILED")
    const duplicate = await admin.rpc("temporary_register_verified_payment", {
      p_attempt_id: attemptId, p_mp_payment_id: providerPaymentId,
      p_amount: 49999, p_currency: "ARS", p_mp_status: "approved",
    })
    if (duplicate.error || duplicate.data?.reused !== true)
      throw Error("QA_MP_DUPLICATE_FAILED")
    const staleRejection = await admin.rpc("temporary_register_verified_payment", {
      p_attempt_id: attemptId, p_mp_payment_id: providerPaymentId,
      p_amount: 49999, p_currency: "ARS", p_mp_status: "rejected",
    })
    if (staleRejection.error || staleRejection.data?.status !== "approved")
      throw Error("QA_MP_PAYMENT_DOWNGRADED")
    const foreignPayment = await admin.rpc("temporary_register_verified_payment", {
      p_attempt_id: attemptId, p_mp_payment_id: providerPaymentId + "7",
      p_amount: 49999, p_currency: "ARS", p_mp_status: "approved",
    })
    if (!foreignPayment.error || foreignPayment.error.message.indexOf("payment_id_conflict") < 0)
      throw Error("QA_MP_FOREIGN_PAYMENT_WAS_ACCEPTED")
    const savedPayment = await admin.from("temporary_payment_attempts")
      .select("status,mp_payment_id").eq("id", attemptId).single()
    if (savedPayment.error || savedPayment.data?.status !== "approved" ||
        savedPayment.data.mp_payment_id !== providerPaymentId)
      throw Error("QA_MP_VERIFIED_PAYMENT_NOT_PERSISTED")

    await invoke("confirm-owner", confirmReservation, owner.jwt, { matchId, role: "owner" })
    const confirmation = await invoke("confirm-tenant", confirmReservation, tenant.jwt,
      { matchId, role: "tenant" })
    if ((confirmation.reservation as Record<string, unknown>)?.status !== "confirmed")
      throw Error("QA_RESERVATION_NOT_CONFIRMED")

    // A confirmed reservation must lock exactly the booked nights, atomically.
    const locked = await admin.from("temporary_availability_blocks")
      .select("property_id,reservation_id,check_in,check_out,source")
      .eq("reservation_id", reservationId)
    if (locked.error || !locked.data || locked.data.length !== 1 ||
        locked.data[0].property_id !== propertyId ||
        locked.data[0].check_in !== inDate ||
        locked.data[0].check_out !== outDate ||
        locked.data[0].source !== "verlo")
      throw Error("QA_DATES_NOT_ATOMICALLY_BLOCKED")

    // Concurrent/manual bookings may not overlap an existing confirmed booking.
    const conflicting = await admin.from("temporary_availability_blocks").insert({
      property_id: propertyId, check_in: inDate, check_out: outDate,
      source: "owner_block",
    }).select("id").maybeSingle()
    if (!conflicting.error || conflicting.error.code !== "23P01")
      throw Error("QA_OVERLAPPING_DATES_WERE_ACCEPTED")

    // Transactional outbox must target the two actual participants.
    // No external messages are sent in this synthetic QA run.
    const verifyRecipients = async () => {
      const { data: events, error } = await admin.from("temporary_notification_outbox")
        .select("event_key,event_type,recipient_user_id,recipient_role,status,payload")
        .eq("reservation_id", reservationId)
      if (error || !events || events.length !== 2)
        throw Error("QA_TEMPORARY_NOTIFICATION_COUNT_INVALID")
      const byRole = new Map(events.map(event => [event.recipient_role, event]))
      if (byRole.size !== 2 ||
          byRole.get("owner")?.recipient_user_id !== owner.id ||
          byRole.get("tenant")?.recipient_user_id !== tenant.id ||
          events.some(event => event.event_type !== "reservation_confirmed" ||
            event.status !== "pending" ||
            event.payload?.match_id !== matchId ||
            event.payload?.check_in !== inDate ||
            event.payload?.check_out !== outDate) ||
          new Set(events.map(event => event.event_key)).size !== 2)
        throw Error("QA_TEMPORARY_NOTIFICATION_RECIPIENT_INVALID")
    }
    await verifyRecipients()
    // Duplicate confirmation must neither reopen the booking nor queue a third email.
    const confirmedReplay = await invoke("confirm-replay", confirmReservation,
      tenant.jwt, { matchId, role: "tenant" })
    if ((confirmedReplay.reservation as Record<string, unknown>)?.status !== "confirmed")
      throw Error("QA_TEMPORARY_CONFIRMATION_REPLAY_FAILED")
    await verifyRecipients()

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

    const sandboxSeed = await ensureSandboxCheckout(admin, publicClient)

    return NextResponse.json({
      sandboxCheckoutPrepared: sandboxSeed.prepared,
      sandboxReservationId: sandboxSeed.reservationId,
      sandboxReservationStatus: sandboxSeed.reservationStatus,
      ok: true, qaOnly: true, realTemporaryApiHandlers: true,
      twoAuthenticatedRoles: true, matchIdempotent: true,
      ownerTenantIsolation: true, doubleAcceptance: true,
      reservationTermsAccepted: true, unpaidConfirmationDenied: true,
      feeSimulated: true, verifiedFeeRpcSimulated: true,
      bilateralReservationConfirmed: true,
      datesAtomicallyBlocked: true, overlappingDatesRejected: true,
      notificationRecipientsVerified: true, notificationDeduplicated: true,
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
