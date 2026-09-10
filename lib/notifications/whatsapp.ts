type WhatsAppMessage = {
  to?: string
  role?: "tenant" | "owner"
  template: string
  variables?: Record<string, string | number>
  context?: Record<string, any>
}

type WhatsAppResult = {
  provider: string
  success: boolean
  message_id?: string
  error?: string
}

/**
 * WhatsApp quedó desactivado en Verlo.
 *
 * Se conserva esta función temporalmente porque todavía existen
 * rutas legacy que la importan. No realiza ningún envío externo.
 *
 * El canal activo para notificaciones del flujo real es Web Push.
 */
export async function sendWhatsApp(
  _message: WhatsAppMessage
): Promise<WhatsAppResult> {
  return {
    provider: "disabled",
    success: false,
    error: "WhatsApp disabled. Verlo uses Web Push.",
  }
}
