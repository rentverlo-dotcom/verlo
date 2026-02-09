import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { matchId } = req.query

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('match_id', matchId)
    .single()

  if (error || !contract) {
    return res.status(404).json({ error: 'Contract not found' })
  }

  if (user.id !== contract.tenant_id && user.id !== contract.owner_id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  return res.status(200).json({ contract })
}
