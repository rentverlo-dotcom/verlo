import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  createHash,
  createHmac,
  randomUUID,
} from "crypto"

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

function sha256(value: string) {
  return createHash("sha256")
    .update(value)
    .digest("hex")
}

function hmac(
  key: Buffer | string,
  value: string
) {
  return createHmac("sha256", key)
    .update(value)
    .digest()
}

function encodePath(path: string) {
  return path
    .split("/")
    .map((part) =>
      encodeURIComponent(part)
        .replace(/%2F/g, "/")
    )
    .join("/")
}

function amzDate(date: Date) {
  return date
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, "")
}

function createR2PresignedPutUrl({
  endpoint,
  bucket,
  key,
  accessKeyId,
  secretAccessKey,
  contentType,
}: {
  endpoint: string
  bucket: string
  key: string
  accessKeyId: string
  secretAccessKey: string
  contentType: string
}) {
  const region = "auto"
  const service = "s3"
  const expires = 900

  const now = new Date()

  const fullAmzDate =
    amzDate(now)

  const dateStamp =
    fullAmzDate.slice(0, 8)

  const endpointUrl =
    new URL(endpoint)

  const host =
    endpointUrl.host

  const canonicalUri =
    `/${encodeURIComponent(bucket)}/${encodePath(key)}`

  const credentialScope =
    `${dateStamp}/${region}/${service}/aws4_request`

  const credential =
    `${accessKeyId}/${credentialScope}`

  const queryParams =
    new URLSearchParams()

  queryParams.set(
    "X-Amz-Algorithm",
    "AWS4-HMAC-SHA256"
  )

  queryParams.set(
    "X-Amz-Credential",
    credential
  )

  queryParams.set(
    "X-Amz-Date",
    fullAmzDate
  )

  queryParams.set(
    "X-Amz-Expires",
    String(expires)
  )

  queryParams.set(
    "X-Amz-SignedHeaders",
    "host"
  )

  const canonicalQueryString =
    Array.from(queryParams.entries())
      .sort(([a], [b]) =>
        a.localeCompare(b)
      )
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&")

  const canonicalHeaders =
    `host:${host}\n`

  const signedHeaders =
    "host"

  const payloadHash =
    "UNSIGNED-PAYLOAD"

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    fullAmzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n")

  const kDate =
    hmac(
      `AWS4${secretAccessKey}`,
      dateStamp
    )

  const kRegion =
    hmac(
      kDate,
      region
    )

  const kService =
    hmac(
      kRegion,
      service
    )

  const kSigning =
    hmac(
      kService,
      "aws4_request"
    )

  const signature =
    createHmac(
      "sha256",
      kSigning
    )
      .update(stringToSign)
      .digest("hex")

  return (
    `${endpointUrl.protocol}//${host}` +
    canonicalUri +
    `?${canonicalQueryString}` +
    `&X-Amz-Signature=${signature}`
  )
}

export async function POST(
  req: NextRequest
) {
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
      clean(
        process.env.R2_PREFIX
      )

    const r2PublicUrl =
      clean(
        process.env.R2_PUBLIC_URL
      ).replace(/\/+$/, "")

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
          error:
            "Missing server configuration",
        },
        {
          status: 500,
        }
      )
    }

    const body =
      await req
        .json()
        .catch(() => ({}))

    const token =
      clean(body?.token)

    const filename =
      safeFilename(
        clean(
          body?.filename
        ) || "archivo"
      )

    const contentType =
      clean(
        body?.contentType
      )

    if (
      !token ||
      !contentType
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing token or contentType",
        },
        {
          status: 400,
        }
      )
    }

    const isPhoto =
      contentType.startsWith(
        "image/"
      )

    const isVideo =
      contentType.startsWith(
        "video/"
      )

    if (
      !isPhoto &&
      !isVideo
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Only photos and videos are allowed",
        },
        {
          status: 400,
        }
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

    const {
      data: accessToken,
      error: tokenError,
    } =
      await supabase
        .from(
          "owner_property_access_tokens"
        )
        .select(`
          id,
          owner_lead_id,
          completion_id,
          expires_at,
          revoked_at
        `)
        .eq(
          "token",
          token
        )
        .single()

    if (
      tokenError ||
      !accessToken
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid token",
        },
        {
          status: 404,
        }
      )
    }

    if (
      accessToken.revoked_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Token revoked",
        },
        {
          status: 403,
        }
      )
    }

    if (
      accessToken.expires_at &&
      new Date(
        accessToken.expires_at
      ).getTime() <
        Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Token expired",
        },
        {
          status: 403,
        }
      )
    }

    if (
      !accessToken.completion_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Property completion missing",
        },
        {
          status: 409,
        }
      )
    }

    const prefix =
      r2Prefix
        ? `${r2Prefix.replace(
            /\/+$/,
            ""
          )}/`
        : ""

    const key =
      `${prefix}owners/` +
      `${accessToken.owner_lead_id}/` +
      `${accessToken.completion_id}/` +
      `${randomUUID()}-${filename}`

    const uploadUrl =
      createR2PresignedPutUrl({
        endpoint:
          r2Endpoint,

        bucket:
          r2Bucket,

        key,

        accessKeyId:
          r2AccessKey,

        secretAccessKey:
          r2SecretKey,

        contentType,
      })

    const publicUrl =
      r2PublicUrl
        ? `${r2PublicUrl}/${key}`
        : null

    return NextResponse.json({
      ok: true,

      upload_url:
        uploadUrl,

      key,

      public_url:
        publicUrl,

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
        error:
          "Unexpected server error",
      },
      {
        status: 500,
      }
    )
  }
}
