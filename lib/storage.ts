'use client'

import { z } from 'zod'
import type { Energy, TriageItem } from './types'

// Local-first persistence. No accounts, no backend — the session lives in the
// browser so judges hit zero signup friction and the app works offline.
//
// The stored blob is fully untrusted input that runs on every page load, so it
// is zod-validated before use (a stale or hand-edited shape returns null and the
// app falls back to the hero instead of crashing). Sessions also carry a
// timestamp so an old session doesn't hijack the landing hero days later.

const KEY = 'unstuck:session:v1'
const TTL_MS = 12 * 60 * 60 * 1000 // 12h — after this, start fresh on the hero

const energySchema = z.enum(['low', 'med', 'high'])

const storedSessionSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      nextAction: z.string(),
      minutes: z.number(),
      energy: energySchema,
      priority: z.number(),
    }),
  ),
  doneIds: z.array(z.string()),
  minutes: z.number(),
  energy: energySchema,
  savedAt: z.number().optional(),
})

export interface StoredSession {
  items: TriageItem[]
  doneIds: string[]
  minutes: number
  energy: Energy
  savedAt?: number
}

export function loadSession(): StoredSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = storedSessionSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return null
    if (parsed.data.savedAt && Date.now() - parsed.data.savedAt > TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

export function saveSession(session: StoredSession): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...session, savedAt: Date.now() }))
  } catch {
    // storage full or disabled — non-fatal, the session just won't persist.
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
