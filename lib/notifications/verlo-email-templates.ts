/**
 * VERLO transactional email presentation. No provider dependency and no sends.
 * The production logo asset is shared with components/VerloBrand.tsx.
 * Keep business details in Mi VERLO, never in email URLs or sensitive payloads.
 */
export type VerloEmailArea = "tradicionales" | "temporarios" | "powermarket"
export type VerloEmailRole = "tenant" | "owner"
export type VerloEmailEvent = {
  area: VerloEmailArea
  role: VerloEmailRole
  type: string
  title?: string
  body?: string
  url?: string
}

export type VerloEmailTemplate = {
  subject: string
  html: string
  text: string
  url: string
}

const PORTAL = "https://verlo.lat/mi-verlo" as const

/** Keep action-specific destinations. Never permit other origins or dangerous schemes. */
export function safeVerloEmailUrl(value?: string): string {
  if (!value || !value.trim()) return PORTAL
  try {
    const candidate = new URL(value.trim(), "https://verlo.lat")
    if (candidate.protocol !== "https:" || candidate.origin !== "https://verlo.lat" ||
      candidate.username || candidate.password) return PORTAL
    return candidate.toString()
  } catch { return PORTAL }
}
const LOGO = "https://verlo.lat/logo-verlo.png"

function htmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

const powermarketCopy: Record<string, [string, string]> = {
  application_submitted: ["Recibimos tu solicitud de caución", "Podés seguir el estado de tu solicitud en Mi VERLO."],
  application_under_review: ["Tu caución está en evaluación", "PowerMarket está revisando tu solicitud."],
  application_more_info_required: ["Tu caución necesita información", "Revisá los próximos pasos en Mi VERLO."],
  application_prequalified: ["Tu caución avanzó", "Tenés una novedad sobre tu solicitud."],
  application_not_eligible: ["Novedad sobre tu caución", "Consultá el resultado en Mi VERLO."],
  application_alternative_offered: ["Alternativa para tu caución", "Revisá la alternativa disponible en Mi VERLO."],
  application_expired: ["Tu solicitud de caución venció", "Revisá el estado de tu solicitud."],
  application_withdrawn: ["Tu solicitud fue retirada", "Podés consultar los detalles en Mi VERLO."],
  quote_offered: ["Tenés una cotización de caución", "Ingresá a Mi VERLO para revisar la propuesta."],
  quote_accepted: ["Cotización de caución aceptada", "Registramos tu aceptación."],
  quote_declined: ["Cotización de caución rechazada", "Podés consultar el estado en Mi VERLO."],
  quote_expired: ["Tu cotización venció", "Revisá el estado de tu caución."],
  review_pending: ["Tu contrato está en revisión", "PowerMarket está revisando el contrato."],
  review_changes_requested: ["Hay observaciones sobre el contrato", "Revisá las correcciones necesarias en Mi VERLO."],
  review_approved: ["Revisión contractual aprobada", "PowerMarket aprobó la revisión del contrato."],
  policy_pending: ["Tu caución está en trámite", "Seguimos procesando tu caución."],
  policy_final_review: ["Tu caución está en revisión final", "Revisá el estado en Mi VERLO."],
  policy_payment_pending: ["Hay un pago pendiente de tu caución", "Consultá los siguientes pasos en Mi VERLO. El pago se realiza con PowerMarket."],
  policy_payment_confirmed: ["PowerMarket confirmó tu pago", "El pago de tu caución fue confirmado. La emisión de la póliza continúa pendiente."],
  policy_issued: ["Tu póliza de caución fue emitida", "Ingresá a Mi VERLO para conocer el estado actualizado."],
  policy_cancelled: ["Novedad sobre tu caución", "El trámite se encuentra cancelado. Revisá Mi VERLO."],
  policy_rejected: ["Novedad sobre tu caución", "Consultá el estado actualizado de tu solicitud."],
}

// Partner events sent to owners must never claim the owner paid the premium.
const powermarketOwnerCopy: Record<string, [string, string]> = {
  review_pending: ["Contrato en revisión", "PowerMarket está revisando el contrato de tu alquiler."],
  review_changes_requested: ["Hay observaciones sobre el contrato", "PowerMarket solicitó correcciones al contrato de tu alquiler."],
  review_approved: ["Revisión contractual aprobada", "PowerMarket aprobó la versión revisada del contrato."],
  policy_pending: ["Caución del alquiler en trámite", "La caución vinculada a tu alquiler se encuentra en trámite."],
  policy_final_review: ["Caución del alquiler en revisión final", "La caución vinculada a tu alquiler avanzó a revisión final."],
  policy_payment_pending: ["Caución del alquiler pendiente de pago", "El pago de la caución del inquilino está pendiente de confirmación por PowerMarket."],
  policy_payment_confirmed: ["Pago de caución del inquilino confirmado", "PowerMarket confirmó el pago de la caución del inquilino. La póliza todavía no fue emitida."],
  policy_issued: ["Póliza de caución emitida", "La póliza de caución vinculada a tu alquiler fue emitida."],
  policy_cancelled: ["Caución del alquiler cancelada", "La caución vinculada a tu alquiler fue cancelada."],
  policy_rejected: ["Caución del alquiler no emitida", "La caución vinculada a tu alquiler no fue emitida."],
}

const temporaryCopy: Record<string, [string, string]> = {
  reservation_confirmed: ["Reserva temporaria confirmada", "La reserva fue confirmada. Revisá los detalles en Mi VERLO."],
  temporary_action_required: ["Tenés una acción pendiente", "Hay una novedad en tu alquiler temporario. Revisá Mi VERLO."],
}

const traditionalCopy: Record<string, [string, string]> = {
  intake_received: ["Recibimos tus datos", "Tu información quedó registrada en VERLO."],
  match_created: ["Tenés una nueva coincidencia", "Encontramos una coincidencia para tu búsqueda o publicación."],
  owner_property_submitted: ["Recibimos tu publicación", "Tu propiedad quedó registrada en VERLO."],
  tenant_verification_submitted: ["Recibimos tu verificación", "Podés seguir los próximos pasos desde Mi VERLO."],
  owner_interest_waiting_tenant: ["Hay interés en tu propiedad", "Revisá la novedad en Mi VERLO."],
  double_ok_1: ["Ambas partes mostraron interés", "Tu coincidencia avanzó de etapa."],
  post_visit_waiting: ["Seguimiento de tu visita", "Revisá el próximo paso de tu alquiler."],
  double_ok_2: ["Tu alquiler avanzó", "Revisá los próximos pasos para el contrato."],
  contract_generated: ["Tu contrato está disponible", "Ingresá a Mi VERLO para revisar el contrato."],
  contract_accept_waiting: ["Tu contrato necesita una acción", "Revisá el estado del contrato en Mi VERLO."],
  rental_confirmed: ["Alquiler confirmado", "Podés consultar el estado de tu alquiler en Mi VERLO."],
  owner_match_digest: ["Tenés novedades de tus candidatos", "Revisá las coincidencias de tu publicación."],
  match_digest_tenant: ["Tenés novedades de propiedades", "Revisá tus coincidencias disponibles."],
}

export function renderVerloEmail(event: VerloEmailEvent): VerloEmailTemplate {
  const catalog = event.area === "powermarket" ? powermarketCopy
    : event.area === "temporarios" ? temporaryCopy : traditionalCopy
  const copy = event.area === "powermarket" && event.role === "owner"
    ? powermarketOwnerCopy[event.type] : catalog[event.type]
  if (!copy) throw new Error("Unsupported VERLO email event")

  // Provider-created events use allowlisted copy, not user-supplied raw HTML.
  const subject = event.title?.trim() || copy[0]
  const body = event.body?.trim() || copy[1]
  const destination = safeVerloEmailUrl(event.url)
  const safeDestination = htmlEscape(destination)
  const safeTitle = htmlEscape(subject)
  const safeBody = htmlEscape(body).replace(/\r?\n/g, "<br />")

  return {
    subject,
    url: destination,
    text: `${subject}\n\n${body}\n\nAbrir VERLO: ${destination}\n\nSi no esperabas este correo, podés ignorarlo.`,
    html: `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#f6f5f4;font-family:Arial,Helvetica,sans-serif;color:#050002">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:30px auto;background:#fff;border-radius:18px">
<tr><td style="padding:32px 32px 12px">
<img src="${LOGO}" alt="" width="36" height="36" style="display:inline-block;vertical-align:middle">
<span style="font-family:Georgia,serif;font-size:32px;font-style:italic;letter-spacing:-2px;vertical-align:middle;margin-left:8px">verlo</span>
</td></tr>
<tr><td style="padding:16px 32px 32px">
<h1 style="font-size:23px;line-height:1.3;margin:0 0 16px">${safeTitle}</h1>
<p style="font-size:16px;line-height:1.65;margin:0 0 28px">${safeBody}</p>
<a href="${safeDestination}" style="display:inline-block;border-radius:28px;padding:14px 24px;background:#050002;color:white;text-decoration:none;font-weight:bold">Ver novedad en VERLO</a>
<p style="font-size:12px;color:#777;margin:30px 0 0;line-height:1.5">Este correo es una notificación de VERLO. Si no la esperabas, podés ignorarla.</p>
</td></tr></table></body></html>`,
  }
}

export const VERLO_EMAIL_EVENT_TYPES = {
  tradicionales: Object.keys(traditionalCopy),
  temporarios: Object.keys(temporaryCopy),
  powermarket: Object.keys(powermarketCopy),
} as const
