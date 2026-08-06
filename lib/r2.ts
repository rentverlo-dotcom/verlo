import crypto from "crypto"

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucket = process.env.R2_BUCKET || "verlo"
const publicUrl = process.env.R2_PUBLIC_URL
const prefix = process.env.R2_PREFIX || "Verlo MVP/"

if (!accountId || !accessKeyId || !secretAccessKey) {
  throw new Error("Missing R2 env vars")
}

function hmac(key: crypto.BinaryLike, value: string) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest()
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex")
}

function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  )
}

function encodeKeyForPath(key: string) {
  return key.split("/").map(encodeRfc3986).join("/")
}

function getSigningKey(secret: string, date: string) {
  const kDate = hmac(`AWS4${secret}`, date)
  const kRegion = hmac(kDate, "auto")
  const kService = hmac(kRegion, "s3")
  return hmac(kService, "aws4_request")
}

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
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const dateStamp = amzDate.slice(0, 8)
  const host = `${accountId}.r2.cloudflarestorage.com`
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`
  const encodedKey = encodeKeyForPath(params.key)
  const canonicalUri = `/${bucket}/${encodedKey}`

  const queryParams: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": "300",
    "X-Amz-SignedHeaders": "content-type;host",
  }

  const canonicalQueryString = Object.keys(queryParams)
    .sort()
    .map((key) => `${encodeRfc3986(key)}=${encodeRfc3986(queryParams[key])}`)
    .join("&")

  const canonicalHeaders = `content-type:${params.contentType}\nhost:${host}\n`
  const signedHeaders = "content-type;host"
  const payloadHash = "UNSIGNED-PAYLOAD"

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
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n")

  const signingKey = getSigningKey(secretAccessKey, dateStamp)

  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex")

  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`
}

export function getR2PublicUrl(key: string) {
  if (!publicUrl) return null
  return `${publicUrl.replace(/\/$/, "")}/${key}`
}

export const R2_BUCKET = bucket

