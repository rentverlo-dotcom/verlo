import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const QA_URL = 'https://anptswspguyotnasoacq.supabase.co'

function qaVerified() {
  return process.env.VERCEL_GIT_COMMIT_REF === 'qa/verlo-e2e' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === QA_URL
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const verified = qaVerified()

  if (verified && request.method === 'GET' && path === '/buscar') {
    return NextResponse.redirect(new URL('/permanentes', request.url), 307)
  }
  if (verified && request.method === 'GET' && path === '/propietario/publicar-v2') {
    return NextResponse.redirect(new URL('/propietarios', request.url), 307)
  }

  if (path === '/api/qa/status') {
    return NextResponse.json({
      ok: verified,
      branch: process.env.VERCEL_GIT_COMMIT_REF === 'qa/verlo-e2e',
      database: process.env.NEXT_PUBLIC_SUPABASE_URL === QA_URL,
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    }, { status: verified ? 200 : 503 })
  }

  if (verified && request.method === 'POST' &&
      path === '/api/webhooks/identik-electronic' &&
      process.env.IDENTIK_ELECTRONIC_WEBHOOK_SECRET &&
      (!process.env.IDENTIK_ELECTRONIC_API_BASE_URL ||
       process.env.IDENTIK_ELECTRONIC_API_BASE_URL ===
         'https://sandbox-electronica.identik.me/api/v2')) {
    return NextResponse.next()
  }

  if (verified && request.method === 'POST' && path === '/api/qa/contracts/lifecycle') {
    return NextResponse.next()
  }

  if (verified && request.method === 'POST' && path === '/api/qa/mi-verlo/isolation') {
    return NextResponse.next()
  }

  if (verified && request.method === 'GET' && path === '/api/qa/contracts/preflight') {
    return NextResponse.next()
  }

  if (verified && request.method === 'GET' && path === '/api/qa/notifications/preflight') {
    return NextResponse.next()
  }

  if (verified && request.method === 'GET' && path === '/api/qa/mi-verlo/preflight') {
    return NextResponse.next()
  }

  if (verified && request.method === 'GET' && path === '/api/mi-verlo') {
    return NextResponse.next()
  }

  if (verified && request.method === 'GET' && path === '/api/qa/identik/connectivity') {
    return NextResponse.next()
  }

  if (verified && request.method === 'GET' && path === '/api/qa/identik/readiness') {
    return NextResponse.next()
  }

  // The signed artifact endpoint performs its own contract-role and token checks.
  // Permit it only on the isolated QA branch with Identik's Sandbox URL.
  if (verified && request.method === 'POST' &&
      path === '/api/qa/identik/signed-artifact' &&
      (!process.env.IDENTIK_ELECTRONIC_API_BASE_URL ||
       process.env.IDENTIK_ELECTRONIC_API_BASE_URL ===
         'https://sandbox-electronica.identik.me/api/v2')) {
    return NextResponse.next()
  }

  if (verified && request.method === 'GET' &&
      (path === '/api/qa/tradicionales/preflight' || path === '/api/qa/tradicionales/result')) {
    return NextResponse.next()
  }

  if (verified && path === '/api/qa/tradicionales/media' && request.method === 'POST') {
    return NextResponse.next()
  }

  if (verified && path === '/api/qa/tradicionales/notify' && request.method === 'POST') {
    return NextResponse.next()
  }

  if (verified && path === '/api/lead-intake' && request.method === 'POST') {
    const data = await request.clone().json().catch(() => null)
    const email = String(data?.email || '').trim().toLowerCase()
    const source = String(data?.source || '').trim()
    const role = String(data?.role || '').trim()
    const intent = String(data?.intent || '').trim()
    const validRole = (role === 'owner' && intent === 'owner_new_listing') ||
      (role === 'tenant' && intent === 'tenant_search')

    if (email.endsWith('@example.com') && source.startsWith('qa_e2e_') && validRole) {
      return NextResponse.next()
    }
  }

  return NextResponse.json({ error: 'QA_API_LOCKED' }, {
    status: 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export const config = { matcher: ['/api/:path*', '/buscar', '/propietario/publicar-v2'] }
