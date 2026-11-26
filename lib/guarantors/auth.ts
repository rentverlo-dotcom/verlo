import { createClient } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"

/** Authenticated account. Not a lead role; guarantors are bound to contracts. */
export async function getGuarantorActor(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "feature/signatura-qa-integration" ||
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://anptswspguyotnasoacq.supabase.co") return null
  const bearer = request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1]
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!bearer || !url || !anon || !service) return null
  const auth = createClient(url, anon, {auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user}, error} = await auth.auth.getUser(bearer)
  if (error || !user?.email_confirmed_at || !user.email) return null
  const db = createClient(url, service, {auth:{persistSession:false,autoRefreshToken:false}})
  return {user, email:user.email.trim().toLowerCase(), db}
}

export const canonicalEmail = (value: string) => value.trim().toLowerCase()
export const isSyntheticGuarantorEmail = (value: string) =>
  /^[a-z0-9._%+-]+@example\.com$/i.test(value.trim())
