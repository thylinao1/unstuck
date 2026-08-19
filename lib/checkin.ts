'use client'

// A gentle, rare, pressure-free check-in. When you start a session, we remember
// the first thing you set out to do. If you reopen the app a good while later
// (not the same day, so it never feels like a deadline ping), we softly ask how
// it went. No backend, no accounts: just a single localStorage record, cleared
// the moment you respond. True closed-app push would need a server, which would
// break the no-backend promise, so this rides on the next time you open the app.

const KEY = 'unstuck:checkin:v1'
const MIN_AGE_MS = 18 * 60 * 60 * 1000 // not before ~18h, so it is never same-day
const MAX_AGE_MS = 6 * 24 * 60 * 60 * 1000 // and not after ~6 days, when it is stale

interface CheckIn {
  task: string
  at: number
}

export function recordCheckIn(task: string): void {
  if (typeof window === 'undefined' || !task) return
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ task, at: Date.now() } satisfies CheckIn))
  } catch {
    // Storage disabled. The check-in simply won't fire, which is fine.
  }
}

// Returns the task to ask about, only if a check-in is genuinely due.
export function loadDueCheckIn(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CheckIn
    const age = Date.now() - data.at
    if (data.task && age >= MIN_AGE_MS && age <= MAX_AGE_MS) return data.task
    return null
  } catch {
    return null
  }
}

export function clearCheckIn(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
