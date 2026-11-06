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
        payload.iat < now - 600) return false

    const response = await fetch(issuer + '/.well-known/jwks', {
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    })
    if (!response.ok) return false
    const jwks = await response.json() as { keys?: Array<Record<string, unknown>> }
    const jwk = jwks.keys?.find(k => k.kid === header.kid && k.kty === 'RSA')
    if (!jwk) return false
    const key = createPublicKey({ key: jwk as import('node:crypto').JsonWebKey, format: 'jwk' })
    return verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]),
      key, Buffer.from(parts[2], 'base64url'))
  } catch {
    return false
  }
}
