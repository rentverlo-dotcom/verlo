import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * VERLO / Signatura transport adapter.
 *
 * Isolated QA foundation. Does not replace Identik or enable the production
 * signature/identity flow. Independent onboarding is intentionally NOT mapped
 * until Signatura provides its separate biometric API contract.
 */
const DEFAULT_BASE_URL = "https://connect.signatura.co/api/v2"

function apiBase(): string {
  const raw = process.env.SIGNATURA_API_BASE_URL?.trim() || DEFAULT_BASE_URL
  const url = new URL(raw)
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("Invalid Signatura API base URL")
  }
  // Custom hosts only for explicitly enabled QA/demo instances.
  if (url.hostname !== "connect.signatura.co" &&
      !(process.env.VERCEL_ENV === "preview" && process.env.SIGNATURA_ALLOW_DEMO_HOST === "true")) {
    throw new Error("Signatura API host is not approved")
  }
  return url.toString().replace(/\/$/, "")
}

function credentials(): string {
  const key = process.env.SIGNATURA_API_KEY?.trim()
  if (!key) throw new Error("Signatura API key not configured")
  return key
}

function safeId(id: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("Invalid Signatura identifier")
  }
  return id
}

async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(apiBase() + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${credentials()}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    cache: "no-store",
    signal: options.signal ?? AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    // Never log provider response bodies: they may include personal data.
    throw new Error(`Signatura API request failed: HTTP ${response.status}`)
  }
  return response
}

export type SignaturaSigner = {
  validations: Record<"BI" | "EM" | "PH" | "AF", string | null> |
    Partial<Record<"BI" | "EM" | "PH" | "AF", string | null>>
  invite_channel?: Array<"EM" | "PH">
  order?: number
}

export type SignaturaDocument = {
  id: string
  status?: string
  signatures?: Array<{ id: string; status?: string; url?: string; signing_url?: string }>
  [key: string]: unknown
}

/**
 * Call only from a server-side route after existing VERLO signing gates:
 * two-party consent, active tenant/owner identity and verified payment.
 * Do not call from a browser or directly after an untrusted webhook.
 */
export async function createSignaturaDocument(args: {
  title: string
  pdf: Buffer
  signatures: SignaturaSigner[]
  complete_url?: string
}): Promise<SignaturaDocument> {
  if (!args.pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new Error("Invalid PDF")
  if (args.pdf.length > 50 * 1024 * 1024) throw new Error("PDF exceeds Signatura limit")
  if (args.signatures.length < 1) throw new Error("Missing signers")
  const body = {
    title: args.title,
    file_content: args.pdf.toString("base64"),
    signatures: args.signatures,
    ...(args.complete_url ? { complete_url: args.complete_url } : {}),
  }
  const response = await apiRequest("/documents/create", {
    method: "POST",
    body: JSON.stringify(body),
  })
  return response.json() as Promise<SignaturaDocument>
}

export async function getSignaturaDocument(id: string): Promise<SignaturaDocument> {
  const response = await apiRequest(`/documents/${safeId(id)}`)
  return response.json() as Promise<SignaturaDocument>
}

export async function getSignaturaBiometrics(signatureId: string): Promise<unknown> {
  const response = await apiRequest(`/signatures/${safeId(signatureId)}/biometrics`)
  return response.json()
}

export type SignaturaEvidenceKind = "zipfile" | "pdf-certificate" | "document"

export async function downloadSignaturaEvidence(
  documentId: string, kind: SignaturaEvidenceKind,
): Promise<Buffer> {
  if (!["zipfile", "pdf-certificate", "document"].includes(kind)) {
    throw new Error("Invalid Signatura evidence type")
  }
  const response = await apiRequest(`/documents/${safeId(documentId)}/download/${kind}`)
  return Buffer.from(await response.arrayBuffer())
}

/** Secret must be 32 bytes, encoded as a 64-character hex string. */
export function verifySignaturaWebhook(
  rawBody: Buffer | string,
  receivedSignature: string | null,
  secretHex: string | undefined = process.env.SIGNATURA_WEBHOOK_SECRET,
): boolean {
  if (!secretHex || !/^[a-f0-9]{64}$/i.test(secretHex) ||
      !receivedSignature || !/^[a-f0-9]{64}$/i.test(receivedSignature)) return false

  const expected = createHmac("sha256", Buffer.from(secretHex, "hex"))
    .update(rawBody).digest()
  const received = Buffer.from(receivedSignature, "hex")
  return received.length === expected.length && timingSafeEqual(expected, received)
}

export type SignaturaNotification = {
  notification_action: string
  document_id: string
  signature_id?: string
  new_status?: string
}

/**
 * Treat webhook data as a hint; fetch GET /documents/{id} before any state
 * transition. Events can be duplicated or delivered out-of-order.
 */
export function parseSignaturaNotification(value: unknown): SignaturaNotification {
  if (!value || typeof value !== "object") throw new Error("Invalid webhook")
  const data = value as Record<string, unknown>
  if (typeof data.notification_action !== "string" ||
      typeof data.document_id !== "string") throw new Error("Invalid webhook")
  safeId(data.document_id)
  return {
    notification_action: data.notification_action,
    document_id: data.document_id,
    ...(typeof data.signature_id === "string" ? { signature_id: safeId(data.signature_id) } : {}),
    ...(typeof data.new_status === "string" ? { new_status: data.new_status } : {}),
  }
}
