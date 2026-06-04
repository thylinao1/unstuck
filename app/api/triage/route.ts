import { z } from 'zod'
import { triageWithClaude } from '@/lib/triage'
import { triageFallback } from '@/lib/fallback'
import { looksLikeCrisis } from '@/lib/safety'
import { rateLimit } from '@/lib/ratelimit'
import type { TriageResponse } from '@/lib/types'

// POST /api/triage
//
// Tries Claude (Haiku) for triage; on no key or ANY error, falls back to the
// deterministic offline engine. The Anthropic key is read server-side in
// lib/triage.ts and never reaches the client. Rate limited per IP so the public
// endpoint can't be scripted to drain the key.

export const maxDuration = 15 // a stuck Claude call can't pin the function

const requestSchema = z.object({
  brainDump: z.string().min(1, 'Write something first.').max(8000),
  minutes: z.number().int().positive().max(600).optional(),
  energy: z.enum(['low', 'med', 'high']).optional(),
})

function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  return fwd ? (fwd.split(',')[0]?.trim() ?? 'unknown') : 'unknown'
}

// Map validation failures to calm, user-safe copy instead of leaking raw zod
// strings like "Too big: expected string to have <=8000 characters".
function friendlyError(error: z.ZodError): string {
  const issue = error.issues[0]
  if (issue?.message === 'Write something first.') return 'Write something first.'
  if (issue?.code === 'too_big') return 'That is a lot at once. Try trimming it down a little.'
  return 'Could not read that. Try a few short lines, one thought per line.'
}

export async function POST(request: Request): Promise<Response> {
  const limit = rateLimit(clientIp(request))
  if (!limit.ok) {
    return Response.json(
      { error: 'One moment — a few too many requests. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: friendlyError(parsed.error) }, { status: 400 })
  }

  const { brainDump, minutes = 15, energy = 'med' } = parsed.data
  const started = Date.now()

  const ai = await triageWithClaude(brainDump, minutes, energy)
  const items = ai?.items ?? triageFallback(brainDump)
  const source: 'ai' | 'fallback' = ai ? 'ai' : 'fallback'
  // When the AI ran, trust its needsSupport judgment — it tells crisis apart from
  // hyperbole ("this deadline is killing me") far better than any keyword net.
  // The regex is the fallback-only backstop for when the AI is unavailable.
  const support = ai ? ai.needsSupport : looksLikeCrisis(brainDump)

  // One structured line per request → visible in Vercel Runtime Logs (fallback
  // rate, latency, volume) with no PII (length and counts only, never the text).
  console.log(
    JSON.stringify({
      at: 'triage',
      source,
      support,
      items: items.length,
      len: brainDump.length,
      minutes,
      energy,
      ms: Date.now() - started,
    }),
  )

  const payload: TriageResponse = { items, source, support }
  return Response.json(payload)
}
