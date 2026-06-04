import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { Energy, TriageItem } from './types'

// Claude-powered triage. Returns null on ANY problem (no key, API error,
// malformed output) so the caller falls back to the deterministic engine and
// the demo never breaks. Server-side only — the key is read from the env here
// and never reaches the client.

const MODEL = 'claude-haiku-4-5' // cheap + fast; triage is a simple extraction task
const MAX_ITEMS = 12

// Validate whatever Claude returns before we trust it.
const claudeOutputSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        nextAction: z.string().min(1).max(200),
        minutes: z.number().int().min(1).max(120),
        energy: z.enum(['low', 'med', 'high']),
        priority: z.number().int().min(0).max(100),
      }),
    )
    .max(MAX_ITEMS),
})

const SYSTEM_PROMPT = `You are the triage engine for Unstuck, a tool that helps overwhelmed people take one small action instead of freezing.

A user gives you a messy "brain dump" of everything on their mind. Your job:
- Split it into distinct items. Ignore filler; merge obvious duplicates.
- For EACH item, write the single smallest physical NEXT ACTION: a concrete 2-to-5-minute first step, not the whole task. Start with a verb. Make it so small it feels easy to begin.
- Estimate "minutes" for that first step (usually 2-5).
- Estimate the "energy" the step needs: "low", "med", or "high".
- Set "priority" 0-100: higher for anything time-sensitive, blocking, or anxiety-driving.

Rules:
- nextAction must be a tiny first step ("Open the doc and write one ugly sentence"), never the whole task ("Write the essay").
- Keep titles short and echo the user's own words.
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

export async function triageWithClaude(
  brainDump: string,
  minutes: number,
  energy: Energy,
): Promise<TriageItem[] | null> {
  const client = getClient()
  if (!client) return null // no key configured → caller uses the deterministic engine

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          // Caching only engages once the cached prefix passes the model's
          // ~4096-token minimum; harmless (a silent no-op) below that. Kept so
          // it activates automatically if the prompt grows.
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
    if (!toolUse || toolUse.type !== 'tool_use') return null

    const parsed = claudeOutputSchema.safeParse(toolUse.input)
    if (!parsed.success || parsed.data.items.length === 0) return null

    return parsed.data.items.map((item, i) => ({
      ...item,
      id: `c${i}-${slug(item.title)}`,
    }))
  } catch {
    // Any API/parse/network error → fall back to the deterministic engine.
    return null
  }
}
