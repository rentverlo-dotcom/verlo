import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucket = process.env.R2_BUCKET || "verlo"
const publicUrl = process.env.R2_PUBLIC_URL
const prefix = process.env.R2_PREFIX || "Verlo MVP/"

if (!accountId || !accessKeyId || !secretAccessKey) {
  throw new Error("Missing R2 env vars")
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

export function buildR2Key(params: {
  folder: string
  id: string
  filename: string
}) {
  const safeFilename = params.filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")

  return `${prefix}${params.folder}/${params.id}/${Date.now()}-${safeFilename}`
}

export async function createR2UploadUrl(params: {
  key: string
  contentType: string
}) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  })

  return getSignedUrl(r2Client, command, {
    expiresIn: 60 * 5,
  })
}

export function getR2PublicUrl(key: string) {
  if (!publicUrl) return null
  return `${publicUrl}/${key}`
}

export const R2_BUCKET = bucket
