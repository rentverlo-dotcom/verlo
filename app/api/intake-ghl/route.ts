import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "intake-ghl",
    status: "public",
  })
}

export async function POST() {
  return NextResponse.json({
    ok: true,
    endpoint: "intake-ghl",
    received: true,
  })
}
