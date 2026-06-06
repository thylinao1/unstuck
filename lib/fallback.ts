import type { Energy, TriageItem } from './types'
import { capitalizeFirst, normalizeDashes } from './text'

// Deterministic, offline triage. No API, no cost.
//
// This is the PUBLIC live engine now (the hosted demo runs with the AI key
// removed to keep it free), so it is built to feel genuinely useful, not like a
// stub: a broad keyword map gives each item a real smallest step plus a bigger
// step for the effort slider, explicit clock times become calendar events, and
// the why lines are plain and true. The full AI version is what the video shows.

const MAX_ITEMS = 12

interface Hint {
  test: RegExp
  step: string
  minutes: number
  energy: Energy
  why: string
  big: string
  bigMinutes: number
  bigWhy: string
}

const HINTS: ReadonlyArray<Hint> = [
  { test: /\b(text|message|dm|whatsapp|imessage)\b/i,
    step: 'Open the chat and type one honest line, even just "hey, thinking of you."',
    minutes: 2, energy: 'low', why: 'A short message closes the loop without a big effort.',
    big: 'Send the message, then jot the one thing you actually want to follow up on.', bigMinutes: 8, bigWhy: 'Following up while it is open keeps it from coming back later.' },
  { test: /\b(email|reply|respond|inbox)\b/i,
    step: 'Open the thread and write one sentence back.',
    minutes: 2, energy: 'low', why: 'One sentence ends the nagging open loop.',
    big: 'Write the full reply and send it, even if it is plain.', bigMinutes: 10, bigWhy: 'A sent reply off your plate beats a perfect draft in your head.' },
  { test: /\b(call|phone|ring|dial|voicemail)\b/i,
    step: 'Find the number and put it on screen, ready to dial.',
    minutes: 2, energy: 'med', why: 'Seeing the number ready makes dialing feel automatic.',
    big: 'Write your one opening sentence, then make the call.', bigMinutes: 10, bigWhy: 'Knowing your first line removes the dread of starting the call.' },
  { test: /\b(write|draft|essay|report|blog|post|paper|article|cover letter)\b/i,
    step: 'Open the doc and write one ugly first sentence.',
    minutes: 2, energy: 'med', why: 'A bad first line beats a blank page and kills the dread.',
    big: 'Outline it in three to four bullet points: main idea, two supports, a close.', bigMinutes: 12, bigWhy: 'An outline turns a scary blank page into filling in gaps.' },
  { test: /\b(pay|bill|invoice|rent|tax|owe|refund|debt)\b/i,
    step: 'Open the account and check the exact amount due.',
    minutes: 3, energy: 'low', why: 'A real number turns a vague money worry into a task.',
    big: 'Pay it now, or write the one line asking for a payment plan.', bigMinutes: 10, bigWhy: 'Acting on the number is what actually lifts the weight.' },
  { test: /\b(book|schedule|appointment|reserve|dentist|doctor|haircut|gp)\b/i,
    step: 'Open the booking page and pick one time slot.',
    minutes: 3, energy: 'low', why: 'Choosing one slot collapses the whole decision into a click.',
    big: 'Book it, then add the date and address to your calendar.', bigMinutes: 8, bigWhy: 'Booked and in the calendar means it is truly handled.' },
  { test: /\b(clean|tidy|laundry|dishes|wash|vacuum|declutter|kitchen|room|mess)\b/i,
    step: 'Set a five minute timer and clear one surface.',
    minutes: 5, energy: 'low', why: 'One cleared surface proves the mess is beatable.',
    big: 'Run a fifteen minute tidy: one room, top surfaces and floor.', bigMinutes: 15, bigWhy: 'A short timed burst gets most of the visible mess in one go.' },
  { test: /\b(read|study|review|revise|research|notes|exam|test|learn)\b/i,
    step: 'Open it and read only the first paragraph.',
    minutes: 5, energy: 'med', why: 'The hardest part is opening it; one paragraph is past that.',
    big: 'Read one section and write three lines on what it said.', bigMinutes: 15, bigWhy: 'Writing it in your words is what makes it actually stick.' },
  { test: /\b(gym|run|walk|exercise|workout|stretch|yoga|jog)\b/i,
    step: 'Put your shoes on and step outside for two minutes.',
    minutes: 2, energy: 'med', why: 'Once your shoes are on, the rest tends to follow.',
    big: 'Do a short fifteen minute version, gentle pace, no pressure.', bigMinutes: 15, bigWhy: 'A short session done beats a long one skipped.' },
  { test: /\b(plan|organise|organize|decide|figure out|sort out|budget)\b/i,
    step: 'Write the options down, one short line each.',
    minutes: 5, energy: 'med', why: 'Options on paper shrink from a worry to a choice.',
    big: 'List the options, then circle the one you would pick if forced now.', bigMinutes: 12, bigWhy: 'A leaning choice is easier to refine than an open question.' },
  { test: /\b(fix|bug|debug|code|build|deploy|ship|pull request|\bpr\b)\b/i,
    step: 'Open the file and reproduce the problem once.',
    minutes: 5, energy: 'high', why: 'Reproducing it turns a scary bug into a known problem.',
    big: 'Reproduce it, then write down the smallest failing case.', bigMinutes: 15, bigWhy: 'A minimal case usually points straight at the fix.' },
  { test: /\b(grocer|shop|shopping|buy|store|supermarket|errand)\b/i,
    step: 'Jot the five things you actually need most right now.',
    minutes: 2, energy: 'low', why: 'A short list makes the trip quick and decided.',
    big: 'Finish the list and pick your slot or store to go.', bigMinutes: 8, bigWhy: 'Deciding when and where removes the last bit of friction.' },
  { test: /\b(meeting|sync|standup|stand-up|1:1|one on one|interview|catch up)\b/i,
    step: 'Write the one outcome you want from it.',
    minutes: 3, energy: 'med', why: 'A clear goal makes the whole thing shorter and calmer.',
    big: 'Jot three quick talking points and the time it starts.', bigMinutes: 10, bigWhy: 'A tiny agenda means you walk in ready, not scrambling.' },
  { test: /\b(apply|application|\bcv\b|resume|job|portfolio)\b/i,
    step: 'Open the application and fill in just your name and email.',
    minutes: 3, energy: 'med', why: 'Starting the form makes finishing it feel close.',
    big: 'Draft two sentences on why you, then paste them in.', bigMinutes: 15, bigWhy: 'A rough draft is far easier to polish than a blank field.' },
  { test: /\b(gift|birthday|present|anniversary|card)\b/i,
    step: 'Note two ideas they would actually like.',
    minutes: 2, energy: 'low', why: 'Two ideas beat an endless scroll of maybes.',
    big: 'Pick one idea and find where to get it.', bigMinutes: 10, bigWhy: 'Choosing turns a vague plan into something you can buy.' },
  { test: /\b(trip|travel|flight|hotel|pack|passport|visa|holiday|vacation)\b/i,
    step: 'Write the one date or detail you need to lock first.',
    minutes: 3, energy: 'low', why: 'One fixed detail makes the rest fall into place.',
    big: 'Check that one thing (dates or price) and note what you find.', bigMinutes: 12, bigWhy: 'A real number or date turns the trip from idea to plan.' },
]

const DEFAULT_HINT: Omit<Hint, 'test'> = {
  step: 'Open it and spend two minutes on just the first part.',
  minutes: 2, energy: 'low', why: 'Starting is the whole battle. A tiny step gets you moving.',
  big: 'Set a fifteen minute timer and do as much of the first part as you can.', bigMinutes: 15, bigWhy: 'A short timed push builds the momentum that carries the rest.',
}

const URGENT =
  /\b(today|urgent|asap|now|overdue|deadline|tonight|tomorrow|due|(mon|tues|wednes|thurs|fri|satur|sun)day)\b/i

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const pad = (n: number) => String(n).padStart(2, '0')

// Pull an explicit clock time out of a chunk and resolve it to a local ISO start,
// so "dentist at 5pm" still becomes a calendar event in the offline engine. A bare
// day with no time ("due Friday") is intentionally NOT treated as an event.
function parseEvent(text: string, now?: string): { start: string; title: string } | null {
  if (!now) return null
  const base = new Date(now)
  if (Number.isNaN(base.getTime())) return null
  const lower = text.toLowerCase()
  let hh: number | null = null
  let mm = 0
  let timeStr = ''
  const ap = lower.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/)
  const h24 = lower.match(/\bat\s*(\d{1,2}):(\d{2})\b/)
  if (ap) {
    hh = parseInt(ap[1], 10); mm = ap[2] ? parseInt(ap[2], 10) : 0
    const pm = ap[3].startsWith('p')
    if (pm && hh < 12) hh += 12
    if (!pm && hh === 12) hh = 0
    timeStr = ap[0]
  } else if (h24) {
    hh = parseInt(h24[1], 10); mm = parseInt(h24[2], 10); timeStr = h24[0]
  }
  if (hh === null || hh > 23 || mm > 59) return null

  const d = new Date(base)
  d.setHours(hh, mm, 0, 0)
  if (/\btomorrow\b/.test(lower)) {
    d.setDate(d.getDate() + 1)
  } else {
    const wd = WEEKDAYS.findIndex((w) => new RegExp(`\\b${w}\\b`).test(lower))
    if (wd >= 0) {
      const add = (wd - base.getDay() + 7) % 7
      d.setDate(base.getDate() + add)
    }
  }
  const start = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  // Title: the chunk minus the time phrase and day words, trimmed short.
  let title = text.replace(new RegExp(timeStr, 'i'), '')
  title = title.replace(/\b(today|tomorrow|this|on|at|the|appointment|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, ' ')
  title = capitalizeFirst(title.replace(/\s+/g, ' ').trim()) || 'Event'
  if (title.length > 30) title = `${title.slice(0, 29).trimEnd()}…`
  return { start, title }
}

function splitDump(raw: string): string[] {
  return raw
    .split(/\n|[;•]|,\s+/)
    .map((s) => s.replace(/^[\s\-*\d.)]+/, '').trim())
    .filter((s) => s.length > 1)
    .slice(0, MAX_ITEMS)
}

function clip(s: string, max = 80): string {
  const t = capitalizeFirst(normalizeDashes(s))
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8)
}

export function triageFallback(brainDump: string, now?: string): TriageItem[] {
  return splitDump(brainDump).map((chunk, i) => {
    const hint = HINTS.find((h) => h.test.test(chunk)) ?? DEFAULT_HINT
    const urgent = URGENT.test(chunk)
    const ev = parseEvent(chunk, now)
    return {
      id: `f${i}-${slug(chunk)}`,
      title: clip(chunk),
      nextAction: hint.step,
      minutes: hint.minutes,
      energy: hint.energy,
      priority: (ev ? 100 : urgent ? 90 : 50) - i,
      why: hint.why,
      biggerAction: hint.big,
      biggerMinutes: hint.bigMinutes,
      biggerWhy: hint.bigWhy,
      eventStart: ev?.start,
      eventTitle: ev?.title,
    }
  })
}
