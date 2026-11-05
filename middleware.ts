import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'QA_API_LOCKED' }, { status: 503 })
  }
  return NextResponse.next()
}

export const config = { matcher: ['/api/:path*'] }
