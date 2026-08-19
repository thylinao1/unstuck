import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { Energy, TriageItem } from './types'
import { capitalizeFirst, normalizeDashes } from './text'

// Claude-powered triage. Returns null on ANY problem (no key, API error,
// malformed output) so the caller falls back to the deterministic engine and
// the demo never breaks. Server-side only: the key is read from the env here
// and never reaches the client.
//
// Two passes: a draft triage, then a "skeptic" that challenges each step before
// the user sees it (is this busywork they have already done? is the reason
// true, or forced and preachy?). The skeptic is the thing that catches "write
// down a phone number you already have" and replaces it with a real first step.

const MODEL = 'claude-haiku-4-5' // cheap + fast; triage is a simple extraction task
const MAX_ITEMS = 12
const MAX_STEP_MINUTES = 15
const SKEPTIC_ENABLED = process.env.DISABLE_SKEPTIC !== '1'

// Parse leniently so one over-long field or large estimate can't reject the
// whole result and drop everything to the dumb fallback. The "first step" cap
// is enforced by clamping minutes in code (below), not by rejecting here.
const claudeOutputSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        nextAction: z.string().min(1).max(300),
        minutes: z.number().int().min(0).max(180),
        energy: z.enum(['low', 'med', 'high']),
        priority: z.number().int().min(0).max(100),
        why: z.string().min(1).max(240),
        biggerAction: z.string().min(1).max(300).optional(),
        biggerMinutes: z.number().int().min(0).max(180).optional(),
        biggerWhy: z.string().min(1).max(240).optional(),
        eventStart: z.string().min(10).max(40).optional(),
        eventEnd: z.string().min(10).max(40).optional(),
        eventTitle: z.string().min(1).max(60).optional(),
      }),
    )
    .max(MAX_ITEMS),
  needsSupport: z.boolean().optional(),
})

type RawItem = z.infer<typeof claudeOutputSchema>['items'][number]

const SYSTEM_PROMPT = `You are the triage engine for Unstuck, a tool that helps overwhelmed people take one small action instead of freezing.

A user gives you a messy "brain dump" of everything on their mind. Your job:
- Split it into distinct items. Ignore filler; merge obvious duplicates.
- For EACH item, write the single smallest physical NEXT ACTION: a concrete 2-to-5-minute first step, not the whole task. Start with a verb. Make it so small it feels easy to begin.
- The step must move the real task forward. Never propose busywork the user has almost certainly already done (for example "write down a phone number you already have"). If a task is scary (a hard call, a bill), the first step should reduce the dread, for example drafting the one sentence they will open with.
- Estimate "minutes" for that first step (usually 2-5, never more than ${MAX_STEP_MINUTES}).
- Estimate the "energy" the step needs: "low", "med", or "high".
- Set "priority" 0-100: higher for anything time-sensitive, blocking, or anxiety-driving.
- Write "why": one short line (under 14 words) on why THIS step helps. Use a real reason from psychology or plain common sense. Never restate the action. Never be preachy.
- Also write "biggerAction": a more substantial single step for when the user has energy and time, about 10 to 15 minutes. It is still ONE concrete step, more momentum than the tiny first step, never the whole task. Add "biggerMinutes" (10 to 15) and "biggerWhy" (one short line) for it.
- SCHEDULED EVENTS: ONLY if an item is an appointment, meeting, call, or event at a SPECIFIC CLOCK TIME (for example "dentist at 3pm", "call mum Friday at 6", "meeting tomorrow 10am"), set "eventStart" to the resolved LOCAL start as ISO 8601 with NO timezone, like "2026-06-09T15:00", and set "eventTitle" to a short 2 to 4 word name for it (for example "Dentist", "Call with Sam"). Each item's time must come ONLY from a time stated for THAT item; NEVER copy one item's time onto another item. Resolve "today", "tomorrow", and weekday names against the user's current local time given in the user message. Add "eventEnd" only if a clear end time is stated. Do NOT set eventStart or eventTitle for an item with no specific clock time of its own: a "basketball game" with no time, a "due Friday" deadline, or "sometime this week" is NOT a timed event. When in doubt, omit them.

Safety:
- Set "needsSupport" to true if the dump shows ANY sign that someone could be harmed: self-harm or suicidal thoughts, intent to harm or kill another person, hiding a crime or a body, abuse, or a medical emergency. A stated plan to hurt or kill a specific person (for example "I am going to kill my neighbour tomorrow") or to dispose of or hide a body (for example "dump a body in the river") is ALWAYS needsSupport true. ERR STRONGLY TOWARD true here: set it EVEN IF the line reads as a joke, exaggeration, or absurd next to ordinary tasks, because it is far safer to offer help than to ignore real harm. This is different from everyday overwhelm hyperbole like "this deadline is killing me" or "my boss is killing me", which is NOT a crisis. Still triage the ordinary, non-harmful items normally, but NEVER turn the harmful content into a task or an action and never include it as an item. When needsSupport is true, only return the ordinary items (if any).

Rules:
- nextAction must be a tiny first step ("Open the doc and write one ugly sentence"), never the whole task ("Write the essay").
- Keep titles short and echo the user's own words.
- Write every field (titles, next actions, and why lines) in the same language the user wrote their brain dump in.
- Calm, plain language. No emoji. Never use en dashes or em dashes anywhere; write a number range as "10 to 15", not "10-15" or "10 to 15" with a dash. Return at most ${MAX_ITEMS} items.`

const SKEPTIC_PROMPT = `You are a sharp, kind skeptic reviewing an anti-overwhelm app's draft output before a real, overwhelmed user sees it. You get the original brain dump and a list of drafted steps (title, nextAction, minutes, energy, priority, why).

LANGUAGE (critical): return every field in the SAME language as the user's brain dump. If the dump and draft are in French, every title, nextAction, and why you return must be in French. Never translate to English.

Challenge every item and return a corrected full list:
- BUSYWORK: if a nextAction is something the user has almost certainly already done (classic example: "write down a phone number you already have", "make a list of what you owe"), replace it with a genuine smallest first step that reduces the dread or actually unblocks the task (for a scary call: draft the single opening sentence; for a bill with no money: write the one line asking for a payment plan).
- TOO BIG: if a nextAction is really the whole task, shrink it to a true 2-to-5-minute first step.
- THE WHY: if a "why" is false, circular, obvious, forced, preachy, or reads funny (over-psychologising a simple task), rewrite it as the plainest true reason in under 14 words. Plain common sense beats a stretched psychology claim.
- THE BIGGER STEP: each item also has a "biggerAction" (a more substantial single step, ~10 to 15 min) with "biggerMinutes" and "biggerWhy". Apply the same checks to it: no busywork, still one concrete step and not the whole task, true why. Keep BOTH the small step and the bigger step.
- Keep titles unchanged. Keep anything that is already good. Keep the same language as the user.
- EVENT TIMES: if an item has "eventStart" (and maybe "eventEnd"), keep them exactly as given. Do not invent times for items that have none.

Return the full corrected list via record_triage, same shape, with every field including "why", the bigger-step fields, and any eventStart/eventEnd.`

const TOOL: Anthropic.Tool = {
  name: 'record_triage',
  description: 'Record the triaged list of items, each with its smallest next action and a one-line reason it helps.',
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
            why: { type: 'string', description: 'One short line on why this step helps; never restate the action' },
            biggerAction: { type: 'string', description: 'A more substantial single step (~10-15 min) for when the user has energy and time' },
            biggerMinutes: { type: 'integer', description: 'Estimated minutes for biggerAction (10-15)' },
            biggerWhy: { type: 'string', description: 'One short line on why the bigger step helps' },
            eventStart: { type: 'string', description: 'Local ISO start (e.g. "2026-06-09T15:00") ONLY if THIS item states its own specific clock time; omit otherwise. Never reuse another item\'s time' },
            eventEnd: { type: 'string', description: 'Local ISO end, only if clearly stated' },
            eventTitle: { type: 'string', description: 'Short 2-4 word event name, set only when eventStart is set' },
          },
          required: ['title', 'nextAction', 'minutes', 'energy', 'priority', 'why'],
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

// Keep an event time only if it is a parseable local ISO datetime like
// "2026-06-09T15:00" (no zone). Anything else returns undefined, so a malformed
// model value never reaches the "Add to calendar" button.
function validLocalIso(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return undefined
  return Number.isNaN(Date.parse(value)) ? undefined : value
}

// The weekday of "now", so the model can count "this Friday" or "tomorrow"
// correctly. LLMs are weak at date arithmetic; the anchor day fixes most of it.
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
function weekdayHint(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : ` (a ${WEEKDAYS[d.getDay()]})`
}

function logFallback(reason: string, extra?: Record<string, unknown>): void {
  console.warn(JSON.stringify({ at: 'triage.fallback', reason, ...extra }))
}

interface RawResult {
  items: RawItem[]
  needsSupport: boolean
}

// One forced tool call. Returns the parsed raw items (pre id-mapping) or null.
async function runToolCall(
  client: Anthropic,
  system: string,
  userContent: string,
  label: string,
): Promise<RawResult | null> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    temperature: 0,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    tools: [TOOL],
    tool_choice: { type: 'tool', name: 'record_triage' },
    messages: [{ role: 'user', content: userContent }],
  })

  const toolUse = message.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    logFallback('no-tool-use', { label })
    return null
  }
  const parsed = claudeOutputSchema.safeParse(toolUse.input)
  if (!parsed.success) {
    logFallback('schema-invalid', {
      label,
      issue: parsed.error.issues[0]?.message,
      path: parsed.error.issues[0]?.path?.join('.'),
    })
    return null
  }
  if (message.usage) {
    console.log(
      JSON.stringify({ at: 'triage.usage', label, inTokens: message.usage.input_tokens, outTokens: message.usage.output_tokens, items: parsed.data.items.length }),
    )
  }
  return { items: parsed.data.items, needsSupport: parsed.data.needsSupport ?? false }
}

export interface TriageResult {
  items: TriageItem[]
  needsSupport: boolean
}

export async function triageWithClaude(
  brainDump: string,
  minutes: number,
  energy: Energy,
  now?: string,
): Promise<TriageResult | null> {
  const client = getClient()
  if (!client) {
    logFallback('no-key')
    return null
  }

  try {
    const nowLine = now ? `My current local date and time is ${now}${weekdayHint(now)}.\n` : ''
    const draft = await runToolCall(
      client,
      SYSTEM_PROMPT,
      `${nowLine}I have about ${minutes} minutes and ${energy} energy right now.\n\nBrain dump:\n${brainDump}`,
      'draft',
    )
    if (!draft) return null
    if (draft.items.length === 0 && !draft.needsSupport) {
      logFallback('empty-output')
      return null
    }

    // The skeptic pass. Skipped on a crisis dump (the support card is what
    // matters there) and on empty output. Any failure falls back to the draft,
    // so the second call can never break the result.
    let finalItems = draft.items
    if (SKEPTIC_ENABLED && draft.items.length > 0 && !draft.needsSupport) {
      const skepticInput = `Original brain dump:\n${brainDump}\n\nDrafted steps to review (JSON):\n${JSON.stringify(
        draft.items.map((it) => ({
          title: it.title,
          nextAction: it.nextAction,
          minutes: it.minutes,
          energy: it.energy,
          priority: it.priority,
          why: it.why,
          biggerAction: it.biggerAction,
          biggerMinutes: it.biggerMinutes,
          biggerWhy: it.biggerWhy,
          eventStart: it.eventStart,
          eventEnd: it.eventEnd,
          eventTitle: it.eventTitle,
        })),
      )}`
      const refined = await runToolCall(client, SKEPTIC_PROMPT, skepticInput, 'skeptic')
      if (refined && refined.items.length > 0) finalItems = refined.items
    }

    const items: TriageItem[] = finalItems.map((item, i) => ({
      title: normalizeDashes(item.title),
      nextAction: capitalizeFirst(normalizeDashes(item.nextAction)),
      // Clamp into [1, cap] instead of rejecting a 0 or an over-large estimate.
      minutes: Math.max(1, Math.min(item.minutes, MAX_STEP_MINUTES)),
      energy: item.energy,
      priority: item.priority,
      why: item.why ? normalizeDashes(item.why) : item.why,
      biggerAction: item.biggerAction ? capitalizeFirst(normalizeDashes(item.biggerAction)) : undefined,
      // The bigger step sits between 6 and the cap, so it is clearly more than
      // the tiny first step but still fits the time pickers.
      biggerMinutes:
        item.biggerMinutes != null
          ? Math.max(6, Math.min(item.biggerMinutes, MAX_STEP_MINUTES))
          : undefined,
      biggerWhy: item.biggerWhy ? normalizeDashes(item.biggerWhy) : item.biggerWhy,
      // Only keep an event time the browser can actually parse, so a malformed
      // model value never reaches the "Add to calendar" button. The title and
      // end only ride along when there is a real start.
      eventStart: validLocalIso(item.eventStart),
      eventEnd: validLocalIso(item.eventStart) ? validLocalIso(item.eventEnd) : undefined,
      eventTitle:
        validLocalIso(item.eventStart) && item.eventTitle
          ? normalizeDashes(item.eventTitle)
          : undefined,
      id: `c${i}-${slug(item.title)}`,
    }))

    return { items, needsSupport: draft.needsSupport }
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.name : 'unknown'
    const status = (err as { status?: number })?.status
    logFallback('api-error', { reason, status })
    return null
  }
}
