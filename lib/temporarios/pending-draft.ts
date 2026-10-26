"use client"

export type TemporaryDraftKind = "owner" | "tenant"
type StoredDraft = { version: 1; at: number; payload: Record<string, unknown> }
const prefix = "verlo-temporarios-pending-v1-"
const ttl = 20 * 60 * 1000

export function savePendingTemporaryDraft(kind: TemporaryDraftKind, payload: Record<string, unknown>) {
  const draft: StoredDraft = { version: 1, at: Date.now(), payload }
  window.localStorage.setItem(prefix + kind, JSON.stringify(draft))
}
export function readPendingTemporaryDraft(kind: TemporaryDraftKind): Record<string, unknown> | null {
  try {
    const raw = window.localStorage.getItem(prefix + kind)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== "object" || Array.isArray(data)) return null
    const draft = data as Partial<StoredDraft>
    if (draft.version !== 1 || typeof draft.at !== "number" ||
        Date.now() - draft.at > ttl || draft.at > Date.now() ||
        !draft.payload || typeof draft.payload !== "object" || Array.isArray(draft.payload)) {
      clearPendingTemporaryDraft(kind)
      return null
    }
    return draft.payload
  } catch { clearPendingTemporaryDraft(kind); return null }
}
export function clearPendingTemporaryDraft(kind: TemporaryDraftKind) {
  try { window.localStorage.removeItem(prefix + kind) } catch {}
}
