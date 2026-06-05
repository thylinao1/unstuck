import type { Energy, TriageItem } from './types'
import { capitalizeFirst } from './text'

// Deterministic, offline triage.
//
// Two jobs:
//   1. Powers the skeleton route now, so the app works end-to-end with ZERO
//      API cost while the UI is built.
//   2. Becomes the guaranteed fallback when the real Claude call fails or
//      rate-limits (WS-A), so a live demo can never break.
//
// It splits a brain dump into items and shrinks each to a small next action,
// using a tiny keyword map so the result still feels tailored, not generic.

const MAX_ITEMS = 12

interface Hint {
  test: RegExp
  step: string
  minutes: number
  energy: Energy
  why: string
}

const HINTS: ReadonlyArray<Hint> = [
  { test: /\b(email|reply|respond|message|dm)\b/i, step: 'Open the thread and write one sentence back.', minutes: 2, energy: 'low', why: 'One sentence closes the open loop nagging at you.' },
  { test: /\b(call|phone|ring|dial)\b/i, step: 'Find the number and put it on screen, ready to dial.', minutes: 2, energy: 'med', why: 'Seeing the number ready makes dialing feel automatic.' },
  { test: /\b(write|draft|essay|report|blog|post|paper|cover letter)\b/i, step: 'Open the doc and write one ugly first sentence.', minutes: 2, energy: 'med', why: 'A bad first line beats a blank page and kills the dread.' },
  { test: /\b(pay|bill|invoice|rent|tax|budget|owe)\b/i, step: 'Open the account and check the exact amount due.', minutes: 3, energy: 'low', why: 'A real number turns a vague money worry into a task.' },
  { test: /\b(book|schedule|appointment|reserve|dentist|doctor)\b/i, step: 'Open the booking page and pick one time slot.', minutes: 3, energy: 'low', why: 'Choosing one slot collapses the whole decision into a click.' },
  { test: /\b(clean|tidy|laundry|dishes|wash|declutter|vacuum)\b/i, step: 'Set a 5-minute timer and clear one surface.', minutes: 5, energy: 'low', why: 'One cleared surface proves the mess is beatable.' },
  { test: /\b(read|study|review|learn|revise|research)\b/i, step: 'Open it and read only the first paragraph.', minutes: 5, energy: 'med', why: 'The hardest part is opening it; one paragraph is past that.' },
  { test: /\b(gym|run|walk|exercise|workout|stretch)\b/i, step: 'Put your shoes on and step outside for two minutes.', minutes: 2, energy: 'med', why: 'Once your shoes are on, the rest tends to follow.' },
  { test: /\b(plan|organise|organize|decide|figure out|sort out)\b/i, step: 'Write the options down, one short line each.', minutes: 5, energy: 'med', why: 'Options on paper shrink from a worry to a choice.' },
  { test: /\b(fix|bug|debug|code|build|deploy|ship)\b/i, step: 'Open the file and reproduce the problem once.', minutes: 5, energy: 'high', why: 'Reproducing it turns a scary bug into a known problem.' },
]

const DEFAULT_WHY = 'Starting is the whole battle. A tiny step gets you moving.'

const URGENT =
  /\b(today|urgent|asap|now|overdue|deadline|tonight|tomorrow|due|(mon|tues|wednes|thurs|fri|satur|sun)day)\b/i

// Split on the separators a real brain dump uses: newlines (the UI asks for one
// thought per line), semicolons, bullets, and comma-spaces. Deliberately NOT on
// " and "/" then "/". " — those split mid-thought far more often than they
// separate tasks ("understand and master calculus", "budget is 1.5k", "Mr. Smith").
function splitDump(raw: string): string[] {
  return raw
    .split(/\n|[;•]|,\s+/)
    .map((s) => s.replace(/^[\s\-*\d.)]+/, '').trim())
    .filter((s) => s.length > 1)
    .slice(0, MAX_ITEMS)
}

function clip(s: string, max = 80): string {
  const t = capitalizeFirst(s)
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8)
}

export function triageFallback(brainDump: string): TriageItem[] {
  return splitDump(brainDump).map((chunk, i) => {
    const hint = HINTS.find((h) => h.test.test(chunk))
    const urgent = URGENT.test(chunk)
    return {
      id: `f${i}-${slug(chunk)}`,
      title: clip(chunk),
      nextAction: hint?.step ?? 'Take the first tiny step: open it and spend two minutes.',
      minutes: hint?.minutes ?? 2,
      energy: hint?.energy ?? 'low',
      priority: (urgent ? 100 : 50) - i,
      why: hint?.why ?? DEFAULT_WHY,
    }
  })
}
