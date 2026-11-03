"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { safeAnalyticsPath, trackPostHog } from "@/lib/posthog-client"

/** Product-level behavior without personal data, input values, or private tokens.
 * PostHog autocapture also exists; these named events are the canonical funnels.
 */
function classify(path: string): { area: string; stage: string; role: string } {
  if (path.startsWith("/powermarket")) return { area: "powermarket", stage: "partner_dashboard", role: "partner" }
  if (path.startsWith("/caucion")) return { area: "powermarket", stage: "application", role: "tenant" }
  if (path.startsWith("/temporarios")) return {
    area: "temporarios",
    stage: path.includes("/mi-verlo") ? "dashboard" : path.includes("/buscar") ? "search_form" :
      path.includes("/publicar") ? "publish_form" : path.includes("/contrato") ? "contract" :
      path.includes("/success") ? "confirmation" : "discovery",
    role: path.includes("/publicar") ? "owner" : path.includes("/buscar") ? "tenant" : "unknown",
  }
  const role = path.includes("/propietario") || path.includes("/candidatos") || path.includes("/propiedad")
    ? "owner" : path.includes("/buscar") || path.includes("/matches") ? "tenant" : "unknown"
  const stage = path.includes("/mi-verlo") ? "dashboard" :
    path.includes("/buscar") || path.includes("/publicar") ? "form" :
    path.includes("/contracts") || path.includes("/cierre") ? "contract" :
    path.includes("/matches") || path.includes("/candidatos") ? "matches" :
    path.includes("/success") || path.includes("/gracias") ? "confirmation" : "discovery"
  return { area: "tradicionales", stage, role }
}

const knownActions: Record<string, string> = {
  "enviar solicitud": "caucion_apply",
  "registrar mi búsqueda": "search_submit",
  "publicar": "publish",
  "ver ficha": "partner_open_application",
  "confirmar operación": "partner_confirm_operation",
  "aceptar cotización": "quote_accept",
  "aprobar esta versión": "contract_review_approve",
  "solicitar correcciones": "contract_review_request_changes",
  "consultar contratos pendientes": "partner_review_list",
  "consultar cotizaciones": "partner_quote_list",
  "consultar registros": "partner_policy_list",
  "enviar consulta": "support_send",
  "activar notificaciones": "push_opt_in",
  "ver mis coincidencias": "matches_open",
}
export default function VerloAnalyticsObserver() {
  const pathname = usePathname()
  useEffect(() => {
    const path = safeAnalyticsPath(pathname || "/")
    const context = classify(path)
    trackPostHog("verlo_screen_viewed", { ...context, screen: path })
  }, [pathname])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Element)) return
      const element = target.closest("button,a")
      if (!element) return
      const text = (element.textContent || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("es")
      const action = knownActions[text]
      if (!action) return
      trackPostHog("verlo_action_clicked", {
        ...classify(safeAnalyticsPath(window.location.pathname)), action,
      })
    }
    document.addEventListener("click", handleClick, { capture: true })
    return () => document.removeEventListener("click", handleClick, { capture: true })
  }, [])

  return null
}
