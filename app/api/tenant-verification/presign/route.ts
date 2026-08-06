import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase env vars")
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const BUCKET = "tenant-documents"

const allowedDocTypes = [
  "dni_front",
  "dni_back",
  "selfie",
  "income_proof",
  "guarantee_proof",
] as const

function cleanFilename(filename: string) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { token, docType, filename, contentType } = body || {}

    if (!token || !docType || !filename || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!allowedDocTypes.includes(docType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      )
    }

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ].includes(contentType)
    ) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      )
    }

    const { data: accessToken, error: tokenError } = await supabase
      .from("match_access_tokens")
      .select("id, match_id, lead_id, audience, expires_at")
      .eq("token", token)
      .eq("audience", "tenant")
      .single()

    if (tokenError || !accessToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    }

    if (
      accessToken.expires_at &&
      new Date(accessToken.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json({ error: "Expired token" }, { status: 403 })
    }

    const owner = accessToken.lead_id || accessToken.match_id || accessToken.id
    const path = `tenant-validations/${owner}/${docType}/${Date.now()}-${cleanFilename(
      filename
    )}`

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)

    if (error || !data) {
      console.error("tenant storage presign error:", error)
      return NextResponse.json(
        { error: "Could not create signed upload URL" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      bucket: BUCKET,
      path,
      token: data.token,
      signedUrl: data.signedUrl,
    })
  } catch (error) {
    console.error("tenant verification presign error:", error)

    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    )
  }
}
