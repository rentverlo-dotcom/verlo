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
  // The isolation allowlist below is ONLY for QA. Production routes must
  // keep working after QA is merged into main; never inherit QA_API_LOCKED.
  const production =
    process.env.VERCEL_ENV === 'production' &&
    process.env.VERCEL_GIT_COMMIT_REF === 'main' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL ===
      'https://bmgrpcqrdvwculrisasi.supabase.co'
  if (production) return NextResponse.next()

  // The authenticated tenant may request only their own pending signing URL.
  // The route enforces Supabase Auth, tenant role and document ownership.
  if (request.method === 'GET' && path === '/api/signatura/my-signing-url' &&
      process.env.VERCEL_ENV === 'preview' &&
      process.env.VERCEL_GIT_COMMIT_REF === 'feature/signatura-qa-integration' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL === QA_URL) {
    return NextResponse.next()
  }

  // QA read-only response shape diagnostic. Returns only non-sensitive field
  // names from one existing completed demo, never document contents or URLs.
  if (request.method === 'GET' && path === '/api/qa/signatura-response-shape' &&
      process.env.VERCEL_ENV === 'preview' &&
      process.env.VERCEL_GIT_COMMIT_REF === 'feature/signatura-qa-integration' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL === QA_URL) {
    return NextResponse.next()
  }

  // Isolated reconciliation probe: Supabase Auth required inside route;
  // cannot mark anyone verified until biometrics approval is certified.
  if (request.method === 'POST' && path === '/api/signatura/identity-reconcile' &&
      process.env.VERCEL_ENV === 'preview' &&
      process.env.VERCEL_GIT_COMMIT_REF === 'feature/signatura-qa-integration' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL === QA_URL) {
    return NextResponse.next()
  }

  // Authenticated Signatura tenant identity status. Handler verifies Supabase Auth
  // and returns no private document or biometric identifiers.
  if (request.method === 'GET' && path === '/api/signatura/identity-status' &&
      process.env.VERCEL_ENV === 'preview' &&
      process.env.VERCEL_GIT_COMMIT_REF === 'feature/signatura-qa-integration' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL === QA_URL) {
    return NextResponse.next()
  }

  // Isolated Signatura QA webhook. Its handler verifies the HMAC and persists
  // only minimal event metadata. All existing QA and production rules remain.
  if (request.method === 'POST' && path === '/api/webhooks/signatura' &&
      process.env.VERCEL_ENV === 'preview' &&
      process.env.VERCEL_GIT_COMMIT_REF === 'feature/signatura-qa-integration' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL === QA_URL &&
      process.env.SIGNATURA_WEBHOOK_QA_ENABLED === 'true') {
    return NextResponse.next()
  }

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

  // OIDC required inside GET (read-only) and POST (one-time send).
  if (verified && request.method === 'GET' && path === '/api/qa/identik/create-signing') {
    return NextResponse.next()
  }

  // One-time manual Github OIDC guarded Sandbox signing request, QA only.
  if (verified && request.method === 'POST' && path === '/api/qa/identik/create-signing') {
    return NextResponse.next()
  }

  // Authenticated GitHub OIDC is enforced inside the QA-only reconcile handler.
  if (verified && request.method === 'POST' && path === '/api/qa/identik/reconcile-pending') {
    return NextResponse.next()
  }

  if (verified && request.method === 'POST' && path === '/api/qa/identik/reconcile-completed') {
    return NextResponse.next()
  }

  // The archive handler requires signed GitHub OIDC and explicit intent.
  // This allowlist entry applies only to the isolated QA branch/database.
  if (verified && request.method === 'POST' &&
      path === '/api/qa/identik/archive-completed' &&
      (!process.env.IDENTIK_ELECTRONIC_API_BASE_URL ||
       process.env.IDENTIK_ELECTRONIC_API_BASE_URL ===
         'https://sandbox-electronica.identik.me/api/v2')) {
    return NextResponse.next()
  }

  if (verified && request.method === 'POST' && path === '/api/qa/identik/webhook-probe') {
    return NextResponse.next()
  }

  // These actions require a verified Supabase Auth session and independent
  // per-document ownership checks in the handlers. Allow no other new routes.
  if (verified && ['GET', 'POST'].includes(request.method) &&
      ['/api/identik/my-signing', '/api/identik/my-signed'].includes(path)) {
    return NextResponse.next()
  }

  // PowerMarket QA dashboard remains behind verified Supabase Auth and
  // caucion_partner_users checks inside every handler; never opens production.
  if (verified && (
    (request.method === 'POST' && [
      '/api/qa/powermarket/access',
      '/api/qa/powermarket/invite',
      '/api/powermarket/confirm-operation',
      '/api/powermarket/policy-certificate',
      '/api/powermarket/partner-documents',
      '/api/powermarket/contract-reviews/pdf',
    ].includes(path)) ||
    (['GET', 'PATCH'].includes(request.method) && [
      '/api/powermarket/applications',
      '/api/powermarket/contract-reviews',
      '/api/powermarket/quotes',
      '/api/powermarket/policies',
    ].includes(path)) ||
    (request.method === 'POST' && [
      '/api/powermarket/contract-reviews',
      '/api/powermarket/quotes',
      '/api/powermarket/policies',
    ].includes(path)) ||
    (request.method === 'GET' &&
      path === '/api/powermarket/partner-documents')
  )) return NextResponse.next()

  if (verified && request.method === 'POST' && path === '/api/qa/powermarket/submission') {
    return NextResponse.next()
  }

  // QA-only: workflow-specific signed GitHub OIDC + exact 3 demo case guard
  // are enforced inside the route; never open this route in production.
  if (verified && request.method === 'POST' && path === '/api/qa/powermarket/demo-pdfs') {
    return NextResponse.next()
  }

  if (verified && request.method === 'POST' && path === '/api/qa/contracts/lifecycle') {
    return NextResponse.next()
  }

  // Read-only Temporarios views: each handler validates the logged-in user's
  // Supabase access token and verifies resource ownership.
  if (verified && request.method === 'GET' && [
    '/api/temporarios/mine',
    '/api/temporarios/contracts',
    '/api/temporarios/contracts/pdf',
  ].includes(path)) {
    return NextResponse.next()
  }

  // Existing Temporarios customer handlers remain protected by Supabase Auth,
  // verified synthetic QA identities, and per-resource ownership checks.
  // Open only the QA-isolated flow needed for a real sandbox checkout.
  if (verified && request.method === 'POST' && [
    '/api/temporarios/properties',
    '/api/temporarios/demands',
    '/api/temporarios/matches/commit',
    '/api/temporarios/matches/decide',
    '/api/temporarios/reservations/start',
    '/api/temporarios/reservations/accept-terms',
    '/api/temporarios/reservations/confirm',
    '/api/temporarios/payments/prepare',
    '/api/temporarios/payments/reconcile',
    '/api/temporarios/contracts',
  ].includes(path)) {
    return NextResponse.next()
  }

  // Mercado Pago Sandbox webhook: isolated QA branch/database only.
  // The handler independently verifies the webhook signature and payment with MP.
  if (verified && request.method === 'POST' &&
      path === '/api/temporarios/payments/webhook') {
    return NextResponse.next()
  }

  // Signed GitHub Actions identity is verified inside the QA handler.
  if (verified && request.method === 'POST' && path === '/api/qa/temporarios/lifecycle') {
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

  // Read-only CEO indicators; the handler independently requires a verified
  // Supabase Auth session and an allowlisted admin identity.
  if (verified && request.method === 'GET' && path === '/api/admin/dashboard') {
    return NextResponse.next()
  }

  if (verified && request.method === 'GET' && path === '/api/qa/identik/connectivity') {
    return NextResponse.next()
  }

  if (verified && request.method === 'GET' && path === '/api/qa/identik/schema-preflight') {
    return NextResponse.next()
  }

  // Read-only provider URL check; handler verifies exact workflow OIDC and SHA.
  if (verified && request.method === 'GET' && path === '/api/qa/identik/signing-url-check') {
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
