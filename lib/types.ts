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
}

/** What the client sends to POST /api/triage. */
export interface TriageRequest {
  brainDump: string
  /** Minutes the user has available right now (optional hint). */
  minutes?: number
  /** Energy the user has right now (optional hint). */
  energy?: Energy
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
