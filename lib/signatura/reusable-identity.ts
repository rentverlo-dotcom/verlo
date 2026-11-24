/**
 * VERLO reusable identity credential — Signatura QA.
 *
 * Pure release gate: a completed declaration AND independently confirmed
 * biometric evidence are required before reuse for another property.
 *
 * Never accept this shape directly from a browser. Construct it only from a
 * trusted persisted record reconciled with Signatura server-to-server.
 */
export type SignaturaIdentityCredential = {
  provider: "signatura"
  purpose: "verlo_identity_declaration"
  lead_id: string
  auth_user_id: string
  declaration_document_id: string
  declaration_signature_id: string
  declaration_status: "pending" | "completed" | "rejected" | "cancelled"
  biometric_status: "pending" | "verified" | "rejected" | "failed"
  evidence_archived_at: string | null
  verified_at: string | null
  expires_at: string | null
  revoked_at: string | null
}

export type CredentialDecision =
  | { allowed: true; reason: "identity_reusable" }
  | { allowed: false; reason: string }

function validTimestamp(value: string | null): number | null {
  if (!value || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value)) {
    return null
  }
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : null
}

export function canReuseSignaturaIdentity(args: {
  credential: SignaturaIdentityCredential | null | undefined
  leadId: string
  authUserId: string
  at?: Date
}): CredentialDecision {
  const { credential, leadId, authUserId } = args
  if (!credential || !leadId || !authUserId) {
    return { allowed: false, reason: "identity_not_verified" }
  }
  if (credential.provider !== "signatura" ||
      credential.purpose !== "verlo_identity_declaration") {
    return { allowed: false, reason: "wrong_credential_purpose" }
  }
  if (credential.lead_id !== leadId || credential.auth_user_id !== authUserId) {
    return { allowed: false, reason: "identity_actor_mismatch" }
  }
  if (!credential.declaration_document_id || !credential.declaration_signature_id ||
      credential.declaration_status !== "completed") {
    return { allowed: false, reason: "declaration_not_signed" }
  }
  if (credential.biometric_status !== "verified" || !credential.evidence_archived_at) {
    return { allowed: false, reason: "biometric_not_verified" }
  }
  const now = (args.at || new Date()).getTime()
  const verifiedAt = validTimestamp(credential.verified_at)
  const expiresAt = validTimestamp(credential.expires_at)
  const archivedAt = validTimestamp(credential.evidence_archived_at)
  if (!Number.isFinite(now) || verifiedAt === null || expiresAt === null ||
      archivedAt === null || verifiedAt > now || archivedAt > now || expiresAt <= now ||
      expiresAt <= verifiedAt) {
    return { allowed: false, reason: "identity_expired_or_invalid" }
  }
  if (credential.revoked_at !== null) {
    return { allowed: false, reason: "identity_revoked" }
  }
  return { allowed: true, reason: "identity_reusable" }
}
