import { NextResponse } from "next/server"
import { createHmac, createHash, randomBytes } from "node:crypto"
import { getTemporaryStorageConfig } from "@/lib/temporarios/storage-config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase())
const hmac = (key: Buffer | string, value: string) => createHmac("sha256", key).update(value).digest()
const hash = (value: string) => createHash("sha256").update(value).digest("hex")

export async function POST(request: Request) {
  const config = getTemporaryStorageConfig(process.env)
  if (!config) return NextResponse.json({ ok: false, error: "Preview test storage unavailable" }, { status: 503 })

  // No public upload capabilities without an authenticated test gate.
  // A dedicated authenticated draft flow must be introduced before enabling signing.
  return NextResponse.json({
    ok: false,
    error: "Temporary media signing disabled until draft authorization is implemented",
  }, { status: 403 })
}
