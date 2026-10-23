/**
 * Identik FIRMA ELECTRONICA API v2.
 * Server-only transport. No secrets, identity documents, or signing URLs in logs.
 * The caller must authorize the VERLO operation and persist document IDs before retries.
 */
import "server-only"

const DEFAULT_BASE = "https://sandbox-electronica.identik.me/api/v2"

export class IdentikApiError extends Error {
  readonly status: number
  readonly retryAfter: string | null

  constructor(status: number, retryAfter: string | null) {
    super(`Identik request failed (HTTP ${status})`)
    this.name = "IdentikApiError"
    this.status = status
    this.retryAfter = retryAfter
  }
}

export type IdentikDocumentCreated = {
  id: number
  envelopeId?: string
}

export type IdentikDocumentStatus = {
  id?: number
  status?: string
  recipients?: unknown[]
  [key: string]: unknown
}

export type IdentikDistribution = {
  documentId: number
  meta?: {
    distributionMethod?: "NONE"
    emailSettings?: Record<string, unknown>
    [key: string]: unknown
  }
  includeSigningUrls?: boolean
}

export type IdentikCreatePayload = {
  recipients: unknown[]
  meta?: Record<string, unknown>
  [key: string]: unknown
}

type Fetcher = typeof fetch

export function makeIdentikElectronicClient(options?: {
  token?: string
  baseUrl?: string
  fetcher?: Fetcher
}) {
  const token = options?.token ?? process.env.IDENTIK_ELECTRONIC_API_TOKEN
  const baseUrl = options?.baseUrl ?? process.env.IDENTIK_ELECTRONIC_API_BASE_URL ?? DEFAULT_BASE
  const fetcher = options?.fetcher ?? fetch

  if (!token) throw new Error("IDENTIK_ELECTRONIC_API_TOKEN is not configured")
  // Prevent sending the Bearer token to arbitrary hosts.
  const parsedBase = new URL(baseUrl)
  if (parsedBase.protocol !== "https:" || !["electronica.identik.me", "sandbox-electronica.identik.me"].includes(parsedBase.hostname) || parsedBase.pathname !== "/api/v2" || parsedBase.search || parsedBase.hash) {
    throw new Error("Invalid Identik electronic API base URL")
  }

  async function request(path: string, init: RequestInit = {}): Promise<Response> {
    const response = await fetcher(`${baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      throw new IdentikApiError(response.status, response.headers.get("Retry-After"))
    }
    return response
  }

  return {
    async createDocument(pdf: Blob, payload: IdentikCreatePayload, filename = "contrato.pdf"): Promise<IdentikDocumentCreated> {
      if (pdf.size === 0 || pdf.type !== "application/pdf") {
        throw new Error("A non-empty application/pdf Blob is required")
      }
      if (!Array.isArray(payload.recipients) || payload.recipients.length !== 2) {
        throw new Error("VERLO contracts require exactly two recipients")
      }
      const body = new FormData()
      body.append("payload", JSON.stringify(payload))
      body.append("file", pdf, filename)
      const response = await request("/document/create", { method: "POST", body })
      const created = await response.json() as IdentikDocumentCreated
      if (!Number.isSafeInteger(created.id) || created.id <= 0) {
        throw new Error("Identik response missing valid document ID")
      }
      return created
    },

    async distributeDocument(body: IdentikDistribution): Promise<unknown> {
      if (!Number.isSafeInteger(body.documentId) || body.documentId <= 0) {
        throw new Error("Invalid document ID")
      }
      const response = await request("/document/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      return response.json()
    },

    async getDocument(documentId: number): Promise<IdentikDocumentStatus> {
      assertDocumentId(documentId)
      const response = await request(`/document/${documentId}`)
      return response.json() as Promise<IdentikDocumentStatus>
    },

    async downloadSignedPdf(documentId: number): Promise<Uint8Array> {
      assertDocumentId(documentId)
      const response = await request(`/document/${documentId}/download`)
      return new Uint8Array(await response.arrayBuffer())
    },

    async downloadCertificate(documentId: number): Promise<Uint8Array> {
      assertDocumentId(documentId)
      const response = await request(`/document/${documentId}/certificate`)
      return new Uint8Array(await response.arrayBuffer())
    },
  }
}

function assertDocumentId(id: number): void {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Invalid document ID")
}
