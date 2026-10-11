"use client"

import type { TemporaryDraftKind } from "./pending-draft"

const prefix = "verlo-temporarios-request-v1-"
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function getTemporaryRequestKey(kind: TemporaryDraftKind): string {
  const stored = window.localStorage.getItem(prefix + kind)
  if (stored && uuidPattern.test(stored)) return stored
  const key = crypto.randomUUID()
  window.localStorage.setItem(prefix + kind, key)
  return key
}

export function clearTemporaryRequestKey(kind: TemporaryDraftKind) {
  window.localStorage.removeItem(prefix + kind)
}
