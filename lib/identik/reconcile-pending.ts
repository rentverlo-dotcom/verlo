import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { makeIdentikElectronicClient } from '@/lib/identik/electronic-v2'
import {
  IDENTIK_PENDING, identikCanAdvance, identikProviderStatus,
} from '@/lib/identik/reconciliation-status'

export const IDENTIK_BATCH_LIMIT = 5
type DocumentRow = {
  id: string
  identik_document_id: number
  status: string
  updated_at: string
}
type ReconciliationCounts = {
  selected: number
  checked: number
  changed: number
  unchanged: number
  failed: number
  alreadyChanged: number
  hasMore: boolean
}
const THROTTLE_MS = 2 * 60 * 1000

// Each call processes at most five *existing* pending documents. This is safe
// to rerun; the provider is read-only and no invitation/document is created.
export async function reconcilePendingIdentikDocuments(
  db: SupabaseClient,
  options: { baseUrl: string; limit?: number; now?: Date },
): Promise<ReconciliationCounts> {
  const limit = Math.min(IDENTIK_BATCH_LIMIT,
    Math.max(1, Math.floor(options.limit ?? IDENTIK_BATCH_LIMIT)))
  const now = options.now ?? new Date()
  const nowIso = now.toISOString()
  const due = new Date(now.getTime() - THROTTLE_MS).toISOString()
  const { data, error } = await db.from('identik_electronic_documents')
    .select('id,identik_document_id,status,updated_at')
    .in('status', [...IDENTIK_PENDING])
    .not('identik_document_id', 'is', null)
    .or('last_checked_at.is.null,last_checked_at.lte.' + due)
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })
    .limit(limit + 1)

  if (error) throw new Error('IDENTIK_BATCH_LOOKUP_FAILED')
  const available = (data || []) as DocumentRow[]
  const rows = available.slice(0, limit)
  const counts: ReconciliationCounts = {
    selected: rows.length, checked: 0, changed: 0, unchanged: 0,
    failed: 0, alreadyChanged: 0, hasMore: available.length > limit,
  }
  if (!rows.length) return counts
  const provider = makeIdentikElectronicClient({ baseUrl: options.baseUrl })
  // Small, bounded read-only fan-out to avoid exceeding serverless duration.
  await Promise.all(rows.map(async row => {
    try {
      if (!Number.isSafeInteger(Number(row.identik_document_id)) ||
          Number(row.identik_document_id) <= 0) {
        throw new Error('INVALID_PROVIDER_DOCUMENT_ID')
      }
      const response = await provider.getDocument(Number(row.identik_document_id))
      if (response.id !== undefined &&
          Number(response.id) !== Number(row.identik_document_id)) {
        throw new Error('PROVIDER_ID_MISMATCH')
      }
      const newStatus = identikProviderStatus(response.status)
      if (!newStatus) throw new Error('UNRECOGNIZED_PROVIDER_STATUS')
      counts.checked++
      const advance = identikCanAdvance(row.status, newStatus)
      const mutation: Record<string, unknown> = {
        last_checked_at: nowIso, last_error_code: null, updated_at: nowIso,
      }
      if (advance) {
        mutation.status = newStatus
        if (newStatus === 'completed') mutation.completed_at = nowIso
      }
      // Compare-and-swap. Webhooks/other workers win without being overwritten.
      const { data: updated, error: updateError } = await db
        .from('identik_electronic_documents')
        .update(mutation).eq('id', row.id)
        .eq('status', row.status).eq('updated_at', row.updated_at)
        .select('id').maybeSingle()
      if (updateError) throw new Error('PERSISTENCE_FAILED')
      if (!updated) { counts.alreadyChanged++; return }
      if (advance) counts.changed++
      else counts.unchanged++
    } catch (error) {
      counts.failed++
      const code = error instanceof Error && error.message === 'UNRECOGNIZED_PROVIDER_STATUS'
        ? 'UNRECOGNIZED_PROVIDER_STATUS'
        : error instanceof Error && error.message === 'PROVIDER_ID_MISMATCH'
          ? 'PROVIDER_ID_MISMATCH' : 'PROVIDER_OR_DATABASE_UNAVAILABLE'
      // Do not rewrite a status changed by another worker. Errors remain
      // visible on the row, and last_checked_at prevents a tight retry loop.
      await db.from('identik_electronic_documents')
        .update({ last_checked_at: nowIso, last_error_code: code,
          updated_at: nowIso })
        .eq('id', row.id).eq('status', row.status)
        .eq('updated_at', row.updated_at)
    }
  }))
  return counts
}
