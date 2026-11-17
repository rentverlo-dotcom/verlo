import type { Metadata } from "next"
import { Suspense } from "react"
import TemporarySuccess from "../TemporarySuccess"
export const metadata: Metadata = { title: "VERLO Temporarios | propietario", robots: { index: false, follow: false } }
export default function Page() { return <Suspense fallback={<p>Cargando VERLO…</p>}><TemporarySuccess role="owner" /></Suspense> }
