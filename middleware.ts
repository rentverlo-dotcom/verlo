import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/api/qa/status') {
    const branch = process.env.VERCEL_GIT_COMMIT_REF === 'qa/verlo-e2e'
    const database = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://anptswspguyotnasoacq.supabase.co'
    return NextResponse.json({ ok: branch && database, branch, database }, { status: branch && database ? 200 : 503 })
  }
  return NextResponse.json({ error: 'QA_API_LOCKED' }, { status: 503 })
}

export const config = { matcher: ['/api/:path*'] }
