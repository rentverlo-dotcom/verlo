// lib/notifications/whatsapp.ts

import crypto from 'crypto'

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
  try {
    switch (PROVIDER) {
      case 'mock':
        return await sendMock(message)

      // FUTURO:
      // case 'meta':
      // case 'twilio':
      //   return await sendReal(message)

      default:
        throw new Error(`Unknown WHATSAPP_PROVIDER: ${PROVIDER}`)
    }
  } catch (error: any) {
    console.error('[WHATSAPP ERROR]', error)

    return {
      provider: PROVIDER,
      success: false,
      error: error.message,
    }
  }
}

/**
 * MOCK — No envía nada real.
 * Solo loguea en consola del servidor.
 * Seguro para usar en producción mientras diseñamos UX.
 */
async function sendMock(
  message: WhatsAppMessage
): Promise<WhatsAppResult> {
  const messageId = `mock-${crypto.randomUUID()}`

  console.log('\n📲 [WHATSAPP MOCK]')
  console.log({
    provider: 'mock',
    message_id: messageId,
    to: message.to,
    template: message.template,
    variables: message.variables || {},
    context: message.context || {},
    timestamp: new Date().toISOString(),
  })
  console.log('--------------------------------------\n')

  return {
    provider: 'mock',
    success: true,
    message_id: messageId,
  }
}
