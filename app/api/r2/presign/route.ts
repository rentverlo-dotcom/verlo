import { NextResponse } from "next/server"
import { buildR2Key, createR2UploadUrl, getR2PublicUrl } from "@/lib/r2"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { folder, id, filename, contentType } = body || {}

    if (!folder || !id || !filename || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!["owner-media", "property-media"].includes(folder)) {
      return NextResponse.json(
        { error: "Invalid folder" },
        { status: 400 }
      )
    }

    const key = buildR2Key({
      folder,
      id,
      filename,
    })

    const uploadUrl = await createR2UploadUrl({
      key,
      contentType,
    })

    const publicUrl = getR2PublicUrl(key)

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl,
    })
  } catch (error) {
    console.error("R2 presign error:", error)

    return NextResponse.json(
      { error: "Could not create upload URL" },
      { status: 500 }
    )
  }
}
