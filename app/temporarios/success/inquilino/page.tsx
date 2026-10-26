import type { Metadata } from "next"
import TemporarySuccess from "../TemporarySuccess"
export const metadata: Metadata = { title: "VERLO Temporarios | inquilino", robots: { index: false, follow: false } }
export default function Page() { return <TemporarySuccess role="tenant" /> }
