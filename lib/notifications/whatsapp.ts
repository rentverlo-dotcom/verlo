// lib/notifications/whatsapp.ts

type WhatsAppMessage = {
  to: string
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

const PROVIDER = process.env.WHATSAPP_PROVIDER || 'mock'

export async function sendWhatsApp(
  message: WhatsAppMessage
): Promise<WhatsAppResult> {
  switch (PROVIDER) {
    case 'mock':
      return sendMock(message)

    // FUTURO:
    // case 'meta':
    // case 'twilio':
    //   return sendReal(message)

    default:
      throw new Error(`Unknown WHATSAPP_PROVIDER: ${PROVIDER}`)
  }
}

/**
 * MOCK — no envía nada, solo loguea
 * Esto es lo que vamos a usar ahora
 */
async function sendMock(
  message: WhatsAppMessage
): Promise<WhatsAppResult> {
  const messageId = `mock-${crypto.randomUUID()}`

  console.log('[WHATSAPP MOCK]', {
    provider: 'mock',
    message_id: messageId,
    to: message.to,
    template: message.template,
    variables: message.variables,
    context: message.context,
    timestamp: new Date().toISOString(),
  })

  return {
    provider: 'mock',
    success: true,
    message_id: messageId,
  }
}
