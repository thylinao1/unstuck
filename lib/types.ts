// Shared types — the canonical contract between the UI and the triage API.
// WS-A (AI core) and WS-B (frontend) both code against these. Do not redefine
// the shapes elsewhere; import from here.

export type Energy = 'low' | 'med' | 'high'

/** One thing pulled out of the brain dump, shrunk to a doable next step. */
export interface TriageItem {
  /** Stable id (deterministic — safe as a React key and for dedupe). */
  id: string
  /** The original thing the user wrote. */
  title: string
  /** The single smallest physical next action for this item. */
  nextAction: string
  /** Estimated minutes for the next action (not the whole task). */
  minutes: number
  /** Energy the next action needs. */
  energy: Energy
  /** Higher = more unblocking / more urgent. Used to pick what to surface. */
  priority: number
  /** One short line on WHY this step helps (psychology, neuroscience, or plain
   *  common sense), validated by a skeptic pass. Optional for resilience with
   *  sessions saved by an older version. */
  why?: string
  /** A more substantial single step (~10 to 15 min) for when the user has
   *  energy and time. Pre-generated at triage so the time/energy picker can
   *  swap to it instantly, with no extra API call. */
  biggerAction?: string
  biggerMinutes?: number
  biggerWhy?: string
  /** When the item is a scheduled event with a clear date and time, the local
   *  start as ISO 8601 with no zone (e.g. "2026-06-09T15:00"), so the card can
   *  offer "Add to calendar". Absent for anything not tied to a specific time. */
  eventStart?: string
  /** Optional local end; when absent the calendar event defaults to one hour. */
  eventEnd?: string
  /** A short 2 to 4 word name for the event, shown on the "Scheduled" row and
   *  used as the calendar entry's title. Only set when eventStart is set. */
  eventTitle?: string
}

/** What the client sends to POST /api/triage. */
export interface TriageRequest {
  brainDump: string
  /** Minutes the user has available right now (optional hint). */
  minutes?: number
  /** Energy the user has right now (optional hint). */
  energy?: Energy
  /** The user's local "now" as ISO 8601 (e.g. "2026-06-09T14:05"), so the AI can
   *  resolve "3 PM", "Friday", or "tomorrow" into a real calendar time. */
  now?: string
}

/** What POST /api/triage returns. */
export interface TriageResponse {
  items: TriageItem[]
  /** How the items were produced — lets the demo prove the AI is real, and
   *  lets us show graceful degradation when the AI is unavailable. */
  source: 'ai' | 'fallback'
  /** True when the dump shows signs of self-harm, crisis, or a medical
   *  emergency. The UI then offers calm support instead of gamifying it. */
  support?: boolean
}
