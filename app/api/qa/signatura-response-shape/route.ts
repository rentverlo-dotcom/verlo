import { NextResponse } from "next/server"
import { getSignaturaDocument } from "@/lib/signatura/client"

// TEMPORARY QA DIAGNOSTIC: Returns only the shape of a single already-signed
// Signatura demo document. Never returns URLs, tokens, body data, signers or IDs.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const QA_URL = "https://anptswspguyotnasoacq.supabase.co"
const EXISTING_DEMO_DOCUMENT = "01a20f7d-e305-75a8-bc6c-066d30f2a9e6"

function reply(value: object, status = 200) {
  return NextResponse.json(value, {
    status, headers: { "Cache-Control": "no-store, max-age=0" },
  })
}
function flattenShape(value: unknown, depth = 0, prefix = ""): string[] {
  if (!value || typeof value !== "object" || depth > 3) return []
  const properties = Object.entries(value as Record<string, unknown>)
  return properties.flatMap(([key, item]) => {
    const path = prefix ? prefix + "." + key : key
    if (/email|phone|name|photo|document_number|identity|address|payload|token|file|hash/i.test(key)) {
      return [] // Ignore potentially sensitive nested fields.
    }
    if (Array.isArray(item)) return [
      path + "[]",
      ...(item.length && typeof item[0] === "object"
        ? flattenShape(item[0], depth + 1, path + "[]") : []),
    ]
    if (item && typeof item === "object") return [path, ...flattenShape(item, depth + 1, path)]
    return [path + (typeof item === "string" && /^https:\/\//.test(item) ? " [https-url]" : "")]
  })
}

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "feature/signatura-qa-integration" ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL) {
    return reply({ ok: false }, 404)
  }
  try {
    const document = await getSignaturaDocument(EXISTING_DEMO_DOCUMENT)
    return reply({
      ok: true,
      document_shape: flattenShape(document),
      // A completed test's invite token might be missing/expired; do not
      // conclude a pending document lacks its URL from this probe alone.
      caution: "completed_demo_only",
    })
  } catch {
    return reply({ ok: false, error: "provider_not_available" }, 502)
  }
}
