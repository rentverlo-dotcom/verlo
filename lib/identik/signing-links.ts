import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

const BUCKET = "identik-contracts"
type Links = { owner: string; tenant: string }
type Recipient = { email?: unknown; signingUrl?: unknown; signingStatus?: unknown }

export function validIdentikSigningUrl(value: unknown): value is string {
  if (typeof value !== "string") return false
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password &&
      (url.hostname === "identik.me" || url.hostname.endsWith(".identik.me"))
  } catch { return false }
}

// Treat provider responses as untrusted. Never substitute links based on array order.
export function extractSigningLinks(response: unknown, ownerEmail: string, tenantEmail: string): Links | null {
  if (!response || typeof response !== "object") return null
  const data = response as Record<string, unknown>
  const nested = data.data && typeof data.data === "object" ? data.data as Record<string, unknown> : null
  const candidates = [data.recipients, data.signers, nested?.recipients, nested?.signers]
  const recipients = candidates.find(Array.isArray) as Recipient[] | undefined
  if (!recipients) return null
  const get = (email: string) => {
    const matches = recipients.filter(r => r && typeof r === "object" &&
      String(r.email || "").trim().toLowerCase() === email.trim().toLowerCase())
    return matches.length === 1 && validIdentikSigningUrl(matches[0].signingUrl)
      ? matches[0].signingUrl as string : null
  }
  const owner = get(ownerEmail), tenant = get(tenantEmail)
  if (!owner || !tenant || owner === tenant) return null
  return { owner, tenant }
}

function key(docId: string) {
  if (!/^[a-f0-9-]{36}$/i.test(docId)) throw new Error("Invalid internal document ID")
  return `signing-links/${docId}.json`
}

// Only server-side service-role code calls this. Private bucket; never generate public URLs.
export async function saveSigningLinks(db: SupabaseClient, docId: string, links: Links) {
  if (!validIdentikSigningUrl(links.owner) || !validIdentikSigningUrl(links.tenant)) {
    throw new Error("Invalid provider signing links")
  }
  const { error } = await db.storage.from(BUCKET).upload(
    key(docId), new Blob([JSON.stringify(links)], { type: "application/json" }),
    { contentType: "application/json", upsert: false }
  )
  if (error) throw new Error("Private signing links could not be archived")
}

export async function readOwnSigningLink(db: SupabaseClient, docId: string, role: keyof Links): Promise<string | null> {
  const { data, error } = await db.storage.from(BUCKET).download(key(docId))
  if (error || !data) return null
  try {
    const links = JSON.parse(await data.text()) as Record<string, unknown>
    return validIdentikSigningUrl(links[role]) ? links[role] as string : null
  } catch { return null }
}
