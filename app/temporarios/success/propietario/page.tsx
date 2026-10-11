import type { Metadata } from "next"
import TemporarySuccess from "../TemporarySuccess"
export const metadata: Metadata = { title: "VERLO Temporarios | propietario", robots: { index: false, follow: false } }
export default function Page() { return <TemporarySuccess role="owner" /> }
