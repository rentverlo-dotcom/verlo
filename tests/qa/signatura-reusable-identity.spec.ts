import { test, expect } from "@playwright/test"
import {
  canReuseSignaturaIdentity,
  type SignaturaIdentityCredential,
} from "../../lib/signatura/reusable-identity"

const leadId = "lead-qa"
const authUserId = "auth-user-qa"
const time = new Date("2026-11-24T12:00:00.000Z")

function verified(): SignaturaIdentityCredential {
  return {
    provider: "signatura",
    purpose: "verlo_identity_declaration",
    lead_id: leadId,
    auth_user_id: authUserId,
    declaration_document_id: "document-qa",
    declaration_signature_id: "signature-qa",
    declaration_status: "completed",
    biometric_status: "verified",
    evidence_archived_at: "2026-11-23T11:20:00.000Z",
    verified_at: "2026-11-23T11:20:00.000Z",
    expires_at: "2027-05-23T11:20:00.000Z",
    revoked_at: null,
  }
}

function decision(credential: SignaturaIdentityCredential | null, lead = leadId, user = authUserId) {
  return canReuseSignaturaIdentity({ credential, leadId: lead, authUserId: user, at: time })
}

test("one verified identity is reusable across any number of property requests", () => {
  const record = verified()
  for (let i = 0; i < 50; i++) {
    expect(decision(record)).toEqual({ allowed: true, reason: "identity_reusable" })
  }
})

test("must have a signed declaration, verified biometric result, and archived evidence", () => {
  expect(decision({ ...verified(), declaration_status: "pending" }).allowed).toBe(false)
  expect(decision({ ...verified(), declaration_status: "rejected" }).allowed).toBe(false)
  expect(decision({ ...verified(), biometric_status: "pending" }).allowed).toBe(false)
  expect(decision({ ...verified(), biometric_status: "failed" }).allowed).toBe(false)
  expect(decision({ ...verified(), evidence_archived_at: null }).allowed).toBe(false)
  expect(decision({ ...verified(), declaration_signature_id: "" }).allowed).toBe(false)
  expect(decision({ ...verified(), declaration_document_id: "" }).allowed).toBe(false)
})

test("credential cannot be transferred to another lead or another authenticated user", () => {
  expect(decision(verified(), "another-lead", authUserId)).toEqual({
    allowed: false, reason: "identity_actor_mismatch",
  })
  expect(decision(verified(), leadId, "another-user").allowed).toBe(false)
})

test("expired, malformed, future, and revoked credentials are rejected", () => {
  expect(decision({ ...verified(), expires_at: "2026-11-24T11:59:00.000Z" }).allowed).toBe(false)
  expect(decision({ ...verified(), expires_at: null }).allowed).toBe(false)
  expect(decision({ ...verified(), verified_at: "bogus" }).allowed).toBe(false)
  expect(decision({ ...verified(), verified_at: "2026-12-01T11:20:00.000Z" }).allowed).toBe(false)
  expect(decision({ ...verified(), revoked_at: "2026-11-24T10:00:00.000Z" }).allowed).toBe(false)
})

test("the existing submitted status must never be taken as Signatura verified identity", () => {
  expect(decision(null).allowed).toBe(false)
  expect(decision({ ...verified(), biometric_status: "pending" }).allowed).toBe(false)
})
