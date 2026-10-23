import { NextRequest, NextResponse } from "next/server"
import { IdentikApiError, makeIdentikElectronicClient } from "@/lib/identik/electronic-v2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Read-only sandbox connectivity check.
 * Requires a backend secret; never creates documents or spends credits.
 * GET a deliberately nonexistent numeric document. A 404 is expected if
 * authentication succeeds and the API is reachable.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const base = process.env.IDENTIK_ELECTRONIC_API_BASE_URL ||
    "https://sandbox-electronica.identik.me/api/v2"
  if (base !== "https://sandbox-electronica.identik.me/api/v2") {
    return NextResponse.json({ ok: false, error: "QA sandbox only" }, { status: 403 })
  }
  try {
    const client = makeIdentikElectronicClient()
    await client.getDocument(2147483647)
    return NextResponse.json({ ok: true, reachable: true, documentUnexpectedlyExists: true }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    if (error instanceof IdentikApiError) {
      return NextResponse.json({
        ok: error.status === 404,
        reachable: true,
        authLikelyValid: error.status === 404,
        providerHttpStatus: error.status,
      }, { status: error.status === 404 ? 200 : 502, headers: { "Cache-Control": "no-store" } })
    }
    return NextResponse.json({ ok: false, reachable: false, error: "Connection failed" },
      { status: 502, headers: { "Cache-Control": "no-store" } })
  }
}
