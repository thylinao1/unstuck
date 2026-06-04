import { z } from 'zod'
import { triageWithClaude } from '@/lib/triage'
import { triageFallback } from '@/lib/fallback'
import type { TriageResponse } from '@/lib/types'

// POST /api/triage
//
// Tries Claude (Haiku) for triage; on no key or ANY error, falls back to the
// deterministic offline engine. The Anthropic key is read server-side in
// lib/triage.ts and never reaches the client.

const requestSchema = z.object({
  brainDump: z.string().min(1, 'Write something first.').max(8000),
  minutes: z.number().int().positive().max(600).optional(),
  energy: z.enum(['low', 'med', 'high']).optional(),
})

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request.'
    return Response.json({ error: message }, { status: 400 })
  }

  const { brainDump, minutes = 15, energy = 'med' } = parsed.data

  const aiItems = await triageWithClaude(brainDump, minutes, energy)
  const items = aiItems ?? triageFallback(brainDump)
  const payload: TriageResponse = { items, source: aiItems ? 'ai' : 'fallback' }
  return Response.json(payload)
}
