import crypto from 'crypto'

type WhatsAppMessage = {
  to?: string
  role?: 'tenant' | 'owner'
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

const TENANT_DEBUG = process.env.WHATSAPP_TENANT_DEBUG
const OWNER_DEBUG = process.env.WHATSAPP_OWNER_DEBUG

export async function sendWhatsApp(
  message: WhatsAppMessage
): Promise<WhatsAppResult> {
  switch (PROVIDER) {
    case 'mock':
      return sendMock(message)
    default:
      throw new Error(`Unknown WHATSAPP_PROVIDER: ${PROVIDER}`)
  }
}

async function sendMock(
  message: WhatsAppMessage
): Promise<WhatsAppResult> {
  const messageId = `mock-${crypto.randomUUID()}`

  let destination = message.to

  // 🔥 OVERRIDE PARA TESTING REAL
  if (message.role === 'tenant' && TENANT_DEBUG) {
    destination = TENANT_DEBUG
  }

  if (message.role === 'owner' && OWNER_DEBUG) {
    destination = OWNER_DEBUG
  }

  console.log('[WHATSAPP MOCK SEND]', {
    provider: 'mock',
    message_id: messageId,
    to: destination,
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
