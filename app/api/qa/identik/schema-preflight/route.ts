import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QA_DB = 'https://anptswspguyotnasoacq.supabase.co'
const BASE = 'https://sandbox-electronica.identik.me'

// Public schema only, allowlisted paths and Sandbox host. Never reads or
// transmits Identik tokens, signing links, PDFs or customer data.
export async function GET() {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_DB) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 503 })
  }
  for (const path of ['/api/v2/openapi.json', '/api/docs/openapi-v2.json', '/api/v2/openapi']) {
    try {
      const response = await fetch(BASE + path, {
        method: 'GET', redirect: 'error',
        signal: AbortSignal.timeout(9000),
        headers: { Accept: 'application/json' }, cache: 'no-store',
      })
      if (!response.ok) continue
      const length = Number(response.headers.get('content-length') || '0')
      if (length > 2_000_000) continue
      const text = await response.text()
      if (text.length > 2_000_000) continue
      const schema = JSON.parse(text) as Record<string, unknown>
      const paths = (schema.paths || {}) as Record<string, unknown>
      const components = (schema.components || {}) as Record<string, unknown>
      const definitions = (components.schemas || {}) as Record<string, unknown>
      const selectedPaths = Object.fromEntries(Object.entries(paths)
        .filter(([key]) => key.includes('/document/create') ||
          key.includes('/document/distribute')).map(([key,value]) => [key,value]))
      if (!Object.keys(selectedPaths).length) continue
      const names = Object.keys(definitions).filter(x =>
        /document|recipient|field|sign|distribut/i.test(x))
      const selectedSchemas = Object.fromEntries(names.slice(0,35)
        .map(name => [name, definitions[name]]))
      return NextResponse.json({
        ok: true, qaOnly: true, sandboxOnly: true,
        version: schema.info && typeof schema.info === 'object'
          ? (schema.info as Record<string,unknown>).version : null,
        paths: selectedPaths, schemas: selectedSchemas,
      }, { headers: { 'Cache-Control': 'no-store' } })
    } catch { /* try next official public path */ }
  }
  return NextResponse.json({
    ok: false, qaOnly: true,
    error: 'SANDBOX_OPENAPI_NOT_PUBLIC',
  }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
}
