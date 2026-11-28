import { legacyIdentityDisabled } from "@/lib/identity/legacy-disabled"

// Legacy identity integration is intentionally disabled until signed,
// authenticated provider callbacks and subject binding are implemented.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const POST = legacyIdentityDisabled
