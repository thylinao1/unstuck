import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { Energy, TriageItem } from './types'

// Claude-powered triage. Returns null on ANY problem (no key, API error,
// malformed output) so the caller falls back to the deterministic engine and
// the demo never breaks. Server-side only — the key is read from the env here
// and never reaches the client.

const MODEL = 'claude-haiku-4-5' // cheap + fast; triage is a simple extraction task
const MAX_ITEMS = 12
const MAX_STEP_MINUTES = 15 // a "first step" should never exceed the smallest time slider

// Validate whatever Claude returns before we trust it.
const claudeOutputSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        nextAction: z.string().min(1).max(200),
        minutes: z.number().int().min(1).max(MAX_STEP_MINUTES),
        energy: z.enum(['low', 'med', 'high']),
        priority: z.number().int().min(0).max(100),
      }),
    )
    .max(MAX_ITEMS),
  // Set by the model when the dump shows self-harm / crisis / medical-emergency
  // signals. The route turns this into a calm support response.
  needsSupport: z.boolean().optional(),
})

const SYSTEM_PROMPT = `You are the triage engine for Unstuck, a tool that helps overwhelmed people take one small action instead of freezing.

A user gives you a messy "brain dump" of everything on their mind. Your job:
- Split it into distinct items. Ignore filler; merge obvious duplicates.
- For EACH item, write the single smallest physical NEXT ACTION: a concrete 2-to-5-minute first step, not the whole task. Start with a verb. Make it so small it feels easy to begin.
- Estimate "minutes" for that first step (usually 2-5, never more than ${MAX_STEP_MINUTES}).
- Estimate the "energy" the step needs: "low", "med", or "high".
- Set "priority" 0-100: higher for anything time-sensitive, blocking, or anxiety-driving.

Safety:
- If the dump shows any sign of self-harm, suicidal thoughts, abuse, or a medical emergency, set "needsSupport" to true. Still triage the ordinary, non-crisis items normally. Do not turn the crisis itself into a task.

Rules:
- nextAction must be a tiny first step ("Open the doc and write one ugly sentence"), never the whole task ("Write the essay").
- Keep titles short and echo the user's own words.
- Write every field — titles AND next actions — in the same language the user wrote their brain dump in.
- Calm, plain language. No emoji. Return at most ${MAX_ITEMS} items.`

const TOOL: Anthropic.Tool = {
  name: 'record_triage',
  description: 'Record the triaged list of items, each with its smallest next action.',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: "The original thing, in the user's words" },
            nextAction: {
              type: 'string',
              description: 'The single smallest physical next step, verb-first, 2-5 minutes',
            },
            minutes: { type: 'integer', description: 'Estimated minutes for the next step' },
            energy: { type: 'string', enum: ['low', 'med', 'high'] },
            priority: { type: 'integer', description: '0-100, higher = more unblocking or urgent' },
          },
          required: ['title', 'nextAction', 'minutes', 'energy', 'priority'],
        },
      },
      needsSupport: {
        type: 'boolean',
        description: 'True if the dump contains self-harm, crisis, or medical-emergency signals',
      },
    },
    required: ['items'],
  },
}

let cachedClient: Anthropic | null = null

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!cachedClient) cachedClient = new Anthropic()
  return cachedClient
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8)
}

// Capitalize the first character (works across languages) so every card reads
// as a clean imperative, including non-English output where the model may not.
function cap(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s
}

// One structured line to stderr so Vercel Runtime Logs show why we degraded,
// instead of a silent swap to the fallback engine.
function logFallback(reason: string, extra?: Record<string, unknown>): void {
  console.warn(JSON.stringify({ at: 'triage.fallback', reason, ...extra }))
}

export interface TriageResult {
  items: TriageItem[]
  needsSupport: boolean
}

export async function triageWithClaude(
  brainDump: string,
  minutes: number,
  energy: Energy,
): Promise<TriageResult | null> {
  const client = getClient()
  if (!client) {
    logFallback('no-key')
    return null // no key configured → caller uses the deterministic engine
  }

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      temperature: 0, // extraction task — pin it so the same dump is reproducible
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          // Caching only engages once the cached prefix passes the model's
          // minimum; a silent no-op below that. Kept so it activates if the
          // prompt grows. Not claimed as an active cost optimization.
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'record_triage' },
      messages: [
        {
          role: 'user',
          content: `I have about ${minutes} minutes and ${energy} energy right now.\n\nBrain dump:\n${brainDump}`,
        },
      ],
    })

    const toolUse = message.content.find((block) => block.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      logFallback('no-tool-use')
      return null
    }

    const parsed = claudeOutputSchema.safeParse(toolUse.input)
    if (!parsed.success) {
      logFallback('schema-invalid')
      return null
    }

    const needsSupport = parsed.data.needsSupport ?? false
    const items: TriageItem[] = parsed.data.items.map((item, i) => ({
      ...item,
      title: cap(item.title),
      nextAction: cap(item.nextAction),
      id: `c${i}-${slug(item.title)}`,
    }))

    // Empty AND no crisis → nothing to act on; let the fallback try instead.
    if (items.length === 0 && !needsSupport) {
      logFallback('empty-output')
      return null
    }

    if (message.usage) {
      console.log(
        JSON.stringify({
          at: 'triage.usage',
          inTokens: message.usage.input_tokens,
          outTokens: message.usage.output_tokens,
          items: items.length,
          needsSupport,
        }),
      )
    }

    return { items, needsSupport }
  } catch (err: unknown) {
    // Any API/parse/network error → fall back to the deterministic engine,
    // but say WHY in the logs (rate-limit, 5xx, network) instead of swallowing.
    const reason = err instanceof Error ? err.name : 'unknown'
    const status = (err as { status?: number })?.status
    logFallback('api-error', { reason, status })
    return null
  }
}
