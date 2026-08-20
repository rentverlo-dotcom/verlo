import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120)
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    const r2Endpoint =
      process.env.R2_ENDPOINT

    const r2AccessKey =
      process.env.R2_ACCESS_KEY_ID

    const r2SecretKey =
      process.env.R2_SECRET_ACCESS_KEY

    const r2Bucket =
      process.env.R2_BUCKET

    const r2Prefix =
      clean(process.env.R2_PREFIX)

    const r2PublicUrl =
      clean(process.env.R2_PUBLIC_URL)
        .replace(/\/+$/, "")

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !r2Endpoint ||
      !r2AccessKey ||
      !r2SecretKey ||
      !r2Bucket
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing server configuration",
        },
        { status: 500 }
      )
    }

    const body =
      await req.json().catch(() => ({}))

    const token =
      clean(body?.token)

    const filename =
      safeFilename(
        clean(body?.filename) || "archivo"
      )

    const contentType =
      clean(body?.contentType)

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing token",
        },
        { status: 400 }
      )
    }

    if (!contentType) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing contentType",
        },
        { status: 400 }
      )
    }

    const isPhoto =
      contentType.startsWith("image/")

    const isVideo =
      contentType.startsWith("video/")

    if (!isPhoto && !isVideo) {
      return NextResponse.json(
        {
          ok: false,
          error: "Only photos and videos are allowed",
        },
        { status: 400 }
      )
    }

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )

    // =========================================================
    // 1. VALIDAR TOKEN DE ESA PROPIEDAD
    // =========================================================

    const {
      data: accessToken,
      error: tokenError,
    } = await supabase
      .from("owner_property_access_tokens")
      .select(`
        id,
        owner_lead_id,
        completion_id,
        expires_at,
        revoked_at
      `)
      .eq("token", token)
      .single()

    if (tokenError || !accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid token",
        },
        { status: 404 }
      )
    }

    if (accessToken.revoked_at) {
      return NextResponse.json(
        {
          ok: false,
          error: "Token revoked",
        },
        { status: 403 }
      )
    }

    if (
      accessToken.expires_at &&
      new Date(
        accessToken.expires_at
      ).getTime() < Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Token expired",
        },
        { status: 403 }
      )
    }

    if (!accessToken.completion_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Property completion missing",
        },
        { status: 409 }
      )
    }

    // =========================================================
    // 2. CREAR KEY ÚNICA DE R2
    // =========================================================

    const basePrefix =
      r2Prefix
        ? `${r2Prefix.replace(/\/+$/, "")}/`
        : ""

    const key =
      `${basePrefix}owners/` +
      `${accessToken.owner_lead_id}/` +
      `${accessToken.completion_id}/` +
      `${randomUUID()}-${filename}`

    // =========================================================
    // 3. CLIENTE CLOUDFLARE R2
    // =========================================================

    const r2 =
      new S3Client({
        region: "auto",

        endpoint: r2Endpoint,

        credentials: {
          accessKeyId: r2AccessKey,
          secretAccessKey: r2SecretKey,
        },
      })

    const command =
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        ContentType: contentType,
      })

    // URL válida 15 minutos
    const uploadUrl =
      await getSignedUrl(
        r2,
        command,
        {
          expiresIn: 60 * 15,
        }
      )

    const publicUrl =
      r2PublicUrl
        ? `${r2PublicUrl}/${key}`
        : null

    return NextResponse.json({
      ok: true,

      upload_url: uploadUrl,

      key,

      public_url: publicUrl,

      media_type:
        isVideo
          ? "video"
          : "photo",

      owner_lead_id:
        accessToken.owner_lead_id,

      completion_id:
        accessToken.completion_id,
    })
  } catch (error) {
    console.error(
      "owner-property-upload error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected server error",
      },
      { status: 500 }
    )
  }
}
