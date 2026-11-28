/** No IO. One vocabulary shared by poll reconciliation and webhook handlers. */
export type IdentikLocalStatus =
  | 'created' | 'sent' | 'pending' | 'completed'
  | 'rejected' | 'cancelled' | 'expired'
export const IDENTIK_PENDING = ['created', 'sent', 'pending'] as const
export const IDENTIK_TERMINAL = ['completed', 'rejected', 'cancelled', 'expired'] as const

export function identikProviderStatus(value: unknown): IdentikLocalStatus | null {
  if (typeof value !== 'string') return null
  switch (value.toUpperCase()) {
    case 'CREATED':
    case 'DRAFT': return 'created'
    case 'SENT': return 'sent'
    case 'PENDING':
    case 'IN_PROGRESS': return 'pending'
    case 'COMPLETED': return 'completed'
    case 'REJECTED':
    case 'DECLINED': return 'rejected'
    case 'CANCELED':
    case 'CANCELLED': return 'cancelled'
    case 'EXPIRED': return 'expired'
    default: return null
  }
}
export function identikCanAdvance(current: string, next: IdentikLocalStatus): boolean {
  if (IDENTIK_TERMINAL.includes(current as typeof IDENTIK_TERMINAL[number])) return false
  if (current === next) return false
  // A stale event or provider response must not regress a document
  // from distributed/pending back to created/sent.
  const order: Record<string, number> = { created: 0, sent: 1, pending: 2 }
  if (next in order && current in order && order[next] < order[current]) return false
  return true
}
