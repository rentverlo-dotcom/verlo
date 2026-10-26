import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import "./georef.css"

export default function TemporariosLayout({ children }: { children: ReactNode }) {
  const isPreview = process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "feature/temporarios"
  const isProduction = process.env.VERCEL_ENV === "production" &&
    process.env.TEMPORARY_PUBLIC_ENABLED === "true" &&
    process.env.TEMPORARY_DB_WRITES_ENABLED === "true"
  if (!isPreview && !isProduction) notFound()
  return children
}
