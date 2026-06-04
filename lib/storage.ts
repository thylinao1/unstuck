'use client'

import type { Energy, TriageItem } from './types'

// Local-first persistence. No accounts, no backend — the session lives in the
// browser so judges hit zero signup friction and the app works offline.

const KEY = 'unstuck:session:v1'

export interface StoredSession {
  items: TriageItem[]
  doneIds: string[]
  minutes: number
  energy: Energy
}

export function loadSession(): StoredSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    return null
  }
}

export function saveSession(session: StoredSession): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session))
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
