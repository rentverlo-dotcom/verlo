import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "ghl-lead-webhook",
  })
}

export async function POST() {
  return NextResponse.json({
    ok: true,
    received: true,
  })
}
