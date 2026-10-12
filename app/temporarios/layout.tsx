import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import "./georef.css"

export default function TemporariosLayout({ children }: { children: ReactNode }) {
  const isPreview = process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "feature/temporarios"
  if (!isPreview) notFound()
  return children
}
