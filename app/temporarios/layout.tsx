import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"
import "./georef.css"

export default function TemporariosLayout({ children }: { children: ReactNode }) {
  const isPreview = process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "feature/temporarios"
  const isProduction = process.env.VERCEL_ENV === "production" &&
    process.env.TEMPORARY_PUBLIC_ENABLED === "true"
  if (!isPreview && !isProduction) notFound()
  return <>
    {children}
    <footer className="temporarios-footer">
      <div className="temporarios-footer-inner">
        <div className="temporarios-footer-brand">
          <VerloBrand width={86} />
          <p>Alquiler directo, seguro y sin comisión inmobiliaria.</p>
        </div>
        <nav className="temporarios-footer-links" aria-label="Información y contacto">
          <Link href="/temporarios/buscar">Buscar temporarios</Link>
          <Link href="/temporarios/publicar">Publicar alojamiento</Link>
          <Link href="/">Alquileres permanentes</Link>
          <Link href="/terminos">Términos y condiciones</Link>
          <Link href="/privacidad">Política de privacidad</Link>
          <a href="mailto:hola@verlo.lat">Contacto · hola@verlo.lat</a>
        </nav>
      </div>
    </footer>
  </>
}
