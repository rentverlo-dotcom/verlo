/**
 * Server-side QA isolation. Never call production providers from QA.
 * Production is unaffected because this file is only committed to qa/verlo-e2e.
 */
export function qaProvidersDisabled(): boolean {
  return process.env.VERCEL_GIT_COMMIT_REF === 'qa/verlo-e2e'
}

export function qaDatabaseVerified(): boolean {
  return qaProvidersDisabled() &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://anptswspguyotnasoacq.supabase.co'
}
