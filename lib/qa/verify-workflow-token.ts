import { createPublicKey, verify } from 'node:crypto'

const issuer = 'https://token.actions.githubusercontent.com'
const audience = 'verlo-qa-mi-verlo'
const repository = 'rentverlo-dotcom/verlo'
const branchRef = 'refs/heads/qa/verlo-e2e'

function decodeJson(input: string): Record<string, unknown> {
  const result: unknown = JSON.parse(Buffer.from(input, 'base64url').toString('utf8'))
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw Error('INVALID_TOKEN')
  return result as Record<string, unknown>
}

export async function validQaWorkflowToken(token: string, expectedSha: string): Promise<boolean> {
  try {
    if (!token || token.length > 12000) return false
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const header = decodeJson(parts[0])
    const payload = decodeJson(parts[1])
    const now = Math.floor(Date.now() / 1000)

    if (header.alg !== 'RS256' || typeof header.kid !== 'string' ||
        payload.iss !== issuer || payload.aud !== audience ||
        payload.repository !== repository || payload.ref !== branchRef ||
        payload.sha !== expectedSha ||
        payload.workflow_ref !== repository + '/.github/workflows/verlo-qa-isolation.yml@' + branchRef ||
        payload.sub !== 'repo:' + repository + ':ref:' + branchRef ||
        !['push', 'workflow_dispatch'].includes(String(payload.event_name)) ||
        typeof payload.exp !== 'number' || payload.exp <= now ||
        typeof payload.iat !== 'number' || payload.iat > now + 60 ||
        payload.iat < now - 600) {
      console.warn('QA_OIDC_CLAIMS_REJECTED')
      return false
    }

    // GitHub's public JWKS is an external dependency. Transient fetch failures
    // must not turn an otherwise valid workflow identity into a permanent 403.
    // Retry only obtaining the public keys; NEVER retry a bad signature/claims.
    let jwks: { keys?: Array<Record<string, unknown>> } | null = null
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(issuer + '/.well-known/jwks', {
          cache: 'no-store',
          signal: AbortSignal.timeout(3500),
        })
        if (response.ok) {
          const candidate = await response.json() as { keys?: Array<Record<string, unknown>> }
          if (Array.isArray(candidate.keys)) {
            jwks = candidate
            break
          }
        } else if (![429, 500, 502, 503, 504].includes(response.status)) {
          break
        }
      } catch {
        // Network timeout or temporary upstream interruption.
      }
    }
    if (!jwks) {
      console.warn('QA_OIDC_JWKS_UNAVAILABLE')
      return false
    }
    const jwk = jwks.keys?.find(k => k.kid === header.kid && k.kty === 'RSA')
    if (!jwk) {
      console.warn('QA_OIDC_SIGNING_KEY_NOT_FOUND')
      return false
    }
    const key = createPublicKey({ key: jwk as import('node:crypto').JsonWebKey, format: 'jwk' })
    const validSignature = verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]),
      key, Buffer.from(parts[2], 'base64url'))
    if (!validSignature) console.warn('QA_OIDC_INVALID_SIGNATURE')
    return validSignature
  } catch {
    return false
  }
}
